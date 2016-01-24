#lang racket/base

(require parser-tools/lex)
(require parser-tools/yacc)
(require (prefix-in re- parser-tools/lex-sre))
(require "semantics.rkt")

(provide parse)

(define-tokens value-tokens (ID STRING-LIT))
(define-empty-tokens empty-tokens (LBR RBR EQ EOF COMMENT NEWLINE))

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
    (token-STRING-LIT (strip-quotes lexeme))]
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
   (error (lambda (a b c) (void)))

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
          [(stmt)
           (begin
             (increment!)
             $1)])
    (stmt [(lookup EQ expr NEWLINE)
           (make-instruction (number->string line-count) (list $1) $3)])
    (expr [() '()]
          [(STRING-LIT) (list $1)]
          [(ID expr) (cons $1 $2)]
          [(lookup expr) (cons $1 $2)])
    (lookup [(LBR expr RBR) (make-reference $2)]))))

(define (parse in)
  ((glut-parser 0) (lambda () (glut-lexer in))))

