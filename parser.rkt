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

(define (strip-quotes s)
  (define last (- (string-length s) 1))
  (define start
    (if (eq? #\" (string-ref s 0)) 1 0))
  (define end
    (if (eq? #\" (string-ref s last)) last (+ 1 last)))
  (substring s start end))

(define glut-lexer
  (lexer
   [#\newline 'NEWLINE]
   [#\[ 'LBR]
   [#\] 'RBR]
   [#\= 'EQ]
   [(re-: "\"" (complement (re-: (re-~ "\\") "\"")) "\"")
    (token-STRING-LIT (prepare-string-literal lexeme))]
   [(re-: ";" (re-* (re-~ "\n")) "\n") 'COMMENT]
   [(re-+ (re-~ (re-or whitespace #\[ #\] #\=)))
    (token-ID lexeme)]
   ;; if non-newline whitespace encountered, lex for the next token
   [whitespace (glut-lexer input-port)]
   [(eof) 'EOF]))

(define (glut-parser line-count)
  (define (increment!)
    (set! line-count (+ line-count 1)))
  (parser
   (start prgm)
   (end EOF)
   (tokens value-tokens empty-tokens)
   (error (lambda (a b c) (error "Parse error")))

   (grammar
    (prgm [() '()]
          [(line prgm) (cons $1 $2)])
    (line [(NEWLINE)
           (begin
             (increment!)
             '())]
          [(COMMENT)
           (begin
             (increment!)
             '())]
          [(stmt NEWLINE)
           (begin
             (increment!)
             $1)]
          [(stmt COMMENT)
           (begin
             (increment!)
             $1)])
    (stmt [(lookup EQ expr)
           (make-instruction (number->string line-count) (list $1) $3)])
    (expr [() '()]
          [(STRING-LIT) (list $1)]
          [(ID expr) (cons $1 $2)]
          [(lookup expr) (cons $1 $2)])
    (lookup [(LBR expr RBR) (make-reference $2)]))))

(define (parse in)
  (filter (lambda (l) (not (null? l))) ((glut-parser 1) (lambda () (glut-lexer in)))))

(module+ test
  (require rackunit)

  (define m-i make-instruction)
  (define m-r make-reference)
  (define i-i instruction-index)
  (define i-k instruction-key)
  (define i-v instruction-val)
  (define r-k reference-key)

  (check-exn exn:fail? (lambda () (parse (open-input-string "[b]"))))
  (check-exn exn:fail? (lambda () (parse (open-input-string "[b] = [c"))))
  (check-exn exn:fail? (lambda () (parse (open-input-string "b = c\n"))))

  (let* ([parsed (parse (open-input-string "[b] = c\n"))]
         [inst (car parsed)]
         [rest (cdr parsed)])
    (check-equal? (i-i inst) "1")
    (check-equal? (reference-key (car (i-k inst))) '("b"))
    (check-equal? (i-v inst) '("c"))
    (check-equal? null rest))

  (let* ([parsed (parse (open-input-string "[next$1] = 0\n[dummy] = 0\n"))]
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

  (let* ([parsed (parse (open-input-string "[b[c[d]]] = 0\n"))]
         [inst (car parsed)]
         [key (r-k (car (i-k inst)))]
         [rest (cdr parsed)])
    (check-equal? (i-i inst) "1")
    (check-equal? (car key) "b")
    (check-equal? (car (r-k (cadr key))) "c")
    (check-equal? (car (r-k (cadr (r-k (cadr key))))) "d")
    (check-equal? null rest)))
