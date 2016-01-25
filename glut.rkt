#lang racket/base

(require racket/cmdline)
(require "semantics.rkt")
(require "parser.rkt")

(define (main)
  (define parsed
    (filter (lambda (l) (not (null? l)))
            (parse (open-input-file (vector-ref (current-command-line-arguments) 0)))))
  (run parsed (current-input-port) (current-output-port))
  (void))

(main)
