#lang racket/base

(require parser-tools/lex)
(require parser-tools/yacc)
(require (prefix-in re- parser-tools/lex-sre))
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

(define glut-parser
  (parser
   (start prgm)
   (end EOF)
   (tokens value-tokens empty-tokens)
   (error (lambda (a b c) (void)))

   (grammar
    (prgm [() '()]
          [(stmt prgm) (cons $1 $2)])
    (stmt [(lookup EQ expr NEWLINE) (cons $1 $3)])
    (expr [() '()]
          [(ID expr) (cons $1 $2)]
          [(lookup expr) (cons $1 $2)])
    (lookup [(LBR expr RBR) (cons 'REF $2)]))))

(define (parse in)
  (glut-parser (lambda () (glut-lexer in))))
