#lang racket/base

(require parser-tools/lex)
(require racket/generator)
(require (prefix-in re- parser-tools/lex-sre))
(require rackunit)

(provide lex)

(define glut-lexer
  (lexer
   [whitespace
    ;; =>
    (glut-lexer input-port)]
   [#\[
    ;; =>
    (cons '(LBR) (glut-lexer input-port))]
   [#\]
    ;; =>
    (cons '(RBR) (glut-lexer input-port))]
   [#\=
    ;; =>
    (cons '(EQ) (glut-lexer input-port))
    ]
   [(re-+ (re-~ (re-or whitespace #\[ #\] #\=)))
    ;; =>
    (cons `(ID ,(string->symbol lexeme))
          (glut-lexer input-port))]
   [(eof)
    ;; =>
    '()]))

(define (lex input-port)
  (sequence->generator (glut-lexer input-port)))

(let ([expr "[a][b[c]]"]
      [stmt "[b] = next[1]"])
  (check-equal? (glut-lexer (open-input-string expr))
                '((LBR) (ID a) (RBR) (LBR) (ID b) (LBR) (ID c) (RBR) (RBR)))
  (check-equal? (glut-lexer (open-input-string stmt))
                '((LBR) (ID b) (RBR) (EQ) (ID next) (LBR) (ID |1|) (RBR))))
