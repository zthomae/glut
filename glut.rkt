#!/usr/bin/env racket

#lang racket/base

(require racket/cmdline)
(require "semantics.rkt")
(require "parser.rkt")

(define (main)
  (run (parse (open-input-file (vector-ref (current-command-line-arguments) 0)))
                    (current-input-port)
                    (current-output-port))
  (displayln ""))

(main)
