#lang racket/base

(require parser-tools/lex)
(require parser-tools/yacc)
(require (prefix-in re- parser-tools/lex-sre))
(require "semantics.rkt")
(require rackunit)

(define-tokens value-tokens (ID))
(define-empty-tokens empty-tokens (LBR RBR EQ EOF NEWLINE))

(define glut-lexer
  (lexer
   [#\newline 'NEWLINE]
   [#\[ 'LBR]
   [#\] 'RBR]
   [#\= 'EQ]
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
          [(stmt)
           (begin
             (increment!)
             $1)])
    (stmt [(lookup EQ expr NEWLINE)
           (make-instruction (number->string line-count) (list $1) $3)])
    (expr [() '()]
          [(ID expr) (cons $1 $2)]
          [(lookup expr) (cons $1 $2)])
    (lookup [(LBR expr RBR) (make-reference $2)]))))
(define (parse in)
  ((glut-parser 0) (lambda () (glut-lexer in))))
