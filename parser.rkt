#lang racket/base

(require racket/string)
(require parser-tools/lex)
(require parser-tools/yacc)
(require (prefix-in re- parser-tools/lex-sre))

(provide parse
         (struct-out instruction)
         (struct-out reference))

(define-tokens value-tokens (ID STRING-LIT))
(define-empty-tokens empty-tokens (LBR RBR EQ EOF COMMENT NEWLINE))

(define-struct instruction (index key val) #:transparent)
(define-struct reference (key) #:transparent)

(define (prepare-string-literal s)
  (escape-chars (strip-quotes s)))

;; the lexer won't combine escape-sequence characters. this
;; finds backslashes followed by newlines, or tabs and replaces
;; them with their escaped counterparts
(define (escape-chars s)
  (define (replace-in-list l)
    (cond [(null? l) '()]
          [(equal? #\\ (car l))
           (cond [(null? (cdr l)) l]
                 [(eq? (cadr l) #\n)
                  (cons #\newline (replace-in-list (cddr l)))]
                 [(eq? (cadr l) #\t)
                  (cons #\tab (replace-in-list (cddr l)))]
                 [else (cons (car l) (replace-in-list (cdr l)))])]
          [else (cons (car l) (replace-in-list (cdr l)))]))
  (list->string (replace-in-list (string->list s))))

;; string literals are parsed with the double quotes still attached.
;; this removes them
(define (strip-quotes s)
  (define last (- (string-length s) 1))
  (define start
    (if (eq? #\" (string-ref s 0)) 1 0))
  (define end
    (if (eq? #\" (string-ref s last)) last (+ 1 last)))
  (substring s start end))

;; lexer returns a function that, when called with an input source,
;; returns a generator of tokens.
(define (glut-lexer input)
  (define len (string-length input))
  (define current-position 0)
  (define (increment-position!)
    (set! current-position (+ current-position 1)))
  (define (peek i)
    (if (>= i len)
        'EOF
        (string-ref input i)))
  (define (get-string-literal)
    (define escaping #f)
    (define new-position (+ current-position 1))
    (define start new-position)
    (define p (peek new-position))
    (define (get-characters)
      (when (and (not (eq? p 'EOF)) (not (and (eq? p #\") (not escaping))))
        (begin (set! escaping (eq? p #\\))
               (increment-position!)
               (set! p (peek current-position))
               (get-characters))))
    (set! current-position new-position)
    (get-characters)
    (if (eq? p 'EOF)
        (error "Syntax error")
        (begin (increment-position!)
               (prepare-string-literal (substring input start (- current-position 1))))))
  (define (get-identifier)
    (define start current-position)
    (define p (peek current-position))
    (define excluded (list #\newline #\tab #\space #\[ #\] #\= 'EOF))
    (define (get-characters)
      (when (not (memq p excluded))
        (begin (increment-position!)
               (set! p (peek current-position))
               (get-characters))))
    (get-characters)
    (substring input start current-position))

  (define (consume-comment)
    (define p (peek current-position))
    (define (loop)
      (when (not (eq? p #\newline))
        (if (eq? p 'EOF)
            (error "Expected newline")
            (begin
              (increment-position!)
              (set! p (peek current-position))
              (loop)))))
    (loop)
    (increment-position!)
    'COMMENT)
  (define (get-token)
    (define p (peek current-position))
    (cond [(eq? p 'EOF) 'EOF]
          [(eq? p #\tab) (begin (increment-position!)
                                (get-token))]
          [(eq? p #\space) (begin (increment-position!)
                                  (get-token))]
          [(eq? p #\newline) (begin (increment-position!)
                                    'NEWLINE)]
          [(eq? p #\[) (begin (increment-position!)
                              'LBR)]
          [(eq? p #\]) (begin (increment-position!)
                              'RBR)]
          [(eq? p #\=) (begin (increment-position!)
                              'EQ)]
          [(eq? p #\;) (consume-comment)]
          [(eq? p #\") (cons 'STRINGLIT (get-string-literal))]
          [else (cons 'ID (get-identifier))]))
  get-token)

;; parser returns a function that, when given a thunk calling a lexer
;; with an input source, returns a parsed result (if there is one). In
;; this case, it returns a list.
(define (glut-parser get-token)
  (define current-token (get-token))
  (define current-line 1)

  (define (next-token!) (set! current-token (get-token)))
  (define (increment-line!) (set! current-line (+ current-line 1)))

  (define (parse-error msg)
    (error (number->string current-line) msg current-token))

  (define (program)
    (if (not (eq? current-token 'EOF))
        (append (line) (program))
        '()))

  (define (line)
    (cond [(eq? current-token 'COMMENT)
           (begin (next-token!)
                  (increment-line!)
                  '())]
          [(eq? current-token 'NEWLINE)
           (begin (next-token!)
                  (increment-line!)
                  '())]
          [else (let ([next-stmt (stmt)])
                  (if (or (eq? current-token 'COMMENT)
                          (eq? current-token 'NEWLINE))
                      (begin
                        (next-token!)
                        (increment-line!)
                        (list next-stmt))
                      (parse-error "Parse error -- line expected COMMENT or NEWLINE, got")))]))

  (define (stmt)
    (if (eq? current-token 'LBR)
        (let ([next-lookup (lookup)])
          (if (eq? current-token 'EQ)
              (begin
                (next-token!)
                (let ([next-expr (expr)])
                  (make-instruction (number->string current-line)
                                    next-lookup
                                    next-expr)))
              (parse-error "Parse error -- stmt expected EQ, got")))
        (parse-error "Parse error -- stmt expected LBR, got")))

  (define (expr)
    (if (pair? current-token)
        (cond [(eq? (car current-token) 'ID)
               (let ([id (list (cdr current-token))])
                 (next-token!)
                 (if (or (eq? current-token 'LBR)
                         (and (pair? current-token)
                              (or (eq? (car current-token) 'ID)
                                  (eq? (car current-token) 'STRINGLIT))))
                     (append id (expr))
                     id))]
              [(eq? (car current-token) 'STRINGLIT)
               (let ([lit (list (cdr current-token))])
                 (next-token!)
                 (if (or (eq? current-token 'LBR)
                         (and (pair? current-token)
                              (or (eq? (car current-token) 'ID)
                                  (eq? (car current-token) 'STRINGLIT))))
                     (append lit (expr))
                     lit))])
        (if (eq? current-token 'LBR)
            (let ([next-lookup (lookup)])
              (if (or (eq? current-token 'LBR)
                      (and (pair? current-token)
                           (or (eq? (car current-token) 'ID)
                               (eq? (car current-token) 'STRINGLIT))))
                  (append next-lookup (expr))
                  next-lookup))
            (parse-error "Parse error -- expr expected LBR, got"))))

  (define (lookup)
    (if (eq? current-token 'LBR)
        (begin
          (next-token!)
          (let ([next-expr (expr)])
            (cond [(eq? current-token 'RBR)
                   (begin
                     (next-token!)
                     (list (make-reference next-expr)))]
                  [(and (pair? current-token) (eq? (car current-token) 'ID))
                   (let ([tok current-token])
                     (next-token!)
                     (append (list tok) (expr)))]
                (parse-error "Parse error -- lookup expected RBR, got"))))
        (begin
          (parse-error "Parse error -- lookup expected LBR, got"))))

  program)

;; parse wraps lexing and parsing in a way suitable for export
(define (parse in [debug #f])
  (let ([parsed (filter (lambda (l) (not (null? l)))
                        ((glut-parser (glut-lexer in))))])
    (when debug
      (displayln parsed))
    parsed))

(module+ test
  (require rackunit)

  (define m-i make-instruction)
  (define m-r make-reference)
  (define i-i instruction-index)
  (define i-k instruction-key)
  (define i-v instruction-val)
  (define r-k reference-key)

  (check-exn exn:fail? (lambda () (parse "[b]")))
  (check-exn exn:fail? (lambda () (parse "[b] = [c")))
  (check-exn exn:fail? (lambda () (parse "b = c\n")))

  (let* ([parsed (parse "[b] = c\n")]
         [inst (car parsed)]
         [rest (cdr parsed)])
    (check-equal? (i-i inst) "1")
    (check-equal? (reference-key (car (i-k inst))) '("b"))
    (check-equal? (i-v inst) '("c"))
    (check-equal? null rest))

  (let* ([parsed (parse "[next$1] = 0\n[dummy] = 0\n")]
         [i1 (car parsed)]
         [i2 (cadr parsed)]
         [rest (cddr parsed)])
    (check-equal? (i-i i1) "1")
    (check-equal? (r-k (car (i-k i1))) '("next$1"))
    (check-equal? (i-v i1) '("0"))

    (check-equal? (i-i i2) "2")
    (check-equal? (r-k (car (i-k i2))) '("dummy"))
    (check-equal? (i-v i2) '("0"))

    (check-equal? null rest))

  (let* ([parsed (parse "[b[c[d]]] = 0\n")]
         [inst (car parsed)]
         [key (r-k (car (i-k inst)))]
         [rest (cdr parsed)])
    (check-equal? (i-i inst) "1")
    (check-equal? (car key) "b")
    (check-equal? (car (r-k (cadr key))) "c")
    (check-equal? (car (r-k (cadr (r-k (cadr key))))) "d")
    (check-equal? null rest))

  (let* ([parsed (parse "[$out] = \"[mod$\"\n[$out] = \"i\"\n")]
         [inst (car parsed)]
         [key (r-k (car (i-k inst)))]
         [rest (cdr parsed)])
    (check-equal? (i-i inst) "1")
    (check-equal? (car key) "$out")
    (check-equal? (i-v inst) '("[mod$")))

  (let* ([parsed (parse "[m1] = [mod[i]3]\n")]
         [inst (car parsed)])
    (check-equal? (car (r-k (car (i-v inst)))) "mod")
    (check-equal? (car (r-k (cadr (r-k (car (i-v inst)))))) "i")
    (check-equal? (caddr (r-k (car (i-v inst)))) "3")))
