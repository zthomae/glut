#lang racket/base

(require parsack)
(require racket/pretty)

(provide (rename-out [parse-program parse])
         (struct-out instruction)
         (struct-out reference))

(define-struct instruction (index key val) #:transparent)
(define-struct reference (key) #:transparent)

(define whitespace
  (many (<or> $tab
              (char #\space))))

(define string-char
  (<or> (try (parser-compose (string "\\\"")
                             (return #\")))
        (noneOf "\"")))

;; the parser won't combine escape-sequence characters. this
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
                 [(or (eq? (cadr l) #\") (eq? (cadr l) #\\))
                  (cons (cadr l) (replace-in-list (cddr l)))]
                 [else (cons (car l) (replace-in-list (cdr l)))])]
          [else (cons (car l) (replace-in-list (cdr l)))]))
  (list->string (replace-in-list (string->list s))))

(define string-literal
  (parser-compose (char #\")
                  (str <- (many string-char))
                  (char #\")
                  (return (escape-chars (list->string str)))))

(define identifier (many1 (noneOf "\"\t\n[]=; ")))

(define lookup
  (parser-compose (char #\[)
                  whitespace
                  (key <- expr)
                  whitespace
                  (char #\])
                  (return (make-reference key))))

(define one-exp (<or> lookup
                string-literal
                (parser-compose (id <- identifier)
                                (return (list->string id)))))

(define expr
  (many
   (parser-compose
    (e <- one-exp)
    whitespace
    (return e))))

(define statement
  (parser-compose (key <- lookup)
                  whitespace
                  (char #\=)
                  whitespace
                  (value <- (parser-cons one-exp expr))
                  (return (make-instruction -1 (list key) value))))

(define comment
  (parser-compose (char #\;)
                  (many (noneOf "\n"))
                  (return null)))

(define (and-newline p)
  (parser-compose
   (ret <- p)
   $eol
   (return ret)))

(define full-statement
  (parser-compose (stmt <- statement)
                  whitespace
                  (<or> (and-newline comment) $eol)
                  (return stmt)))

(define line
  (parser-compose
   (line <- (<or> (and-newline comment)
                  full-statement
                  $eol))
   (return line)))

(define program
  (parser-compose
   (prgm <- (many line))
   $eof
   (return prgm)))

(define (correct-lines parsed)
  (for/list ([i (in-range 1 (+ 1 (length parsed)))]
             [inst parsed]
             #:when (instruction? inst))
    (make-instruction (number->string i)
                      (instruction-key inst)
                      (instruction-val inst))))

(define (parse-program in [print-parsed #f])
  (define parsed (correct-lines (parse-result program in)))
  (when print-parsed (pretty-print parsed))
  parsed)

(module+ test
  (require rackunit)

  (define m-i make-instruction)
  (define m-r make-reference)
  (define i-i instruction-index)
  (define i-k instruction-key)
  (define i-v instruction-val)
  (define r-k reference-key)

  (check-exn exn:fail? (lambda () (parse-program "[b]")))
  (check-exn exn:fail? (lambda () (parse-program "[b] = [c")))
  (check-exn exn:fail? (lambda () (parse-program "b = c\n")))

  (let* ([parsed (parse-program "[b] = c\n")]
         [inst (car parsed)]
         [rest (cdr parsed)])
    (check-equal? (i-i inst) "1")
    (check-equal? (reference-key (car (i-k inst))) '("b"))
    (check-equal? (i-v inst) '("c"))
    (check-equal? null rest))

  (let* ([parsed (parse-program "[next$1] = 0\n[dummy] = 0\n")]
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

  (let* ([parsed (parse-program "[b[c[d]]] = 0\n")]
         [inst (car parsed)]
         [key (r-k (car (i-k inst)))]
         [rest (cdr parsed)])
    (check-equal? (i-i inst) "1")
    (check-equal? (car key) "b")
    (check-equal? (car (r-k (cadr key))) "c")
    (check-equal? (car (r-k (cadr (r-k (cadr key))))) "d")
    (check-equal? null rest))

  (let* ([parsed (parse-program "[$out] = \"[mod$\"\n[$out] = \"i\"\n")]
         [inst (car parsed)]
         [key (r-k (car (i-k inst)))]
         [rest (cdr parsed)])
    (check-equal? (i-i inst) "1")
    (check-equal? (car key) "$out")
    (check-equal? (i-v inst) '("[mod$")))

  (let* ([parsed (parse-program "[m1] = [mod[i]3]\n")]
         [inst (car parsed)])
    (check-equal? (car (r-k (car (i-v inst)))) "mod")
    (check-equal? (car (r-k (cadr (r-k (car (i-v inst)))))) "i")
    (check-equal? (caddr (r-k (car (i-v inst)))) "3"))

  (let* ([parsed (parse-program "[m1] = [hello][thing]\n")]
         [inst (car parsed)])
    (check-equal? (car (r-k (car (i-v inst)))) "hello")
    (check-equal? (car (r-k (cadr (i-v inst)))) "thing")))
