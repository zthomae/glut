#lang racket

(require racket/cmdline)
(require "semantics.rkt")

(define (main)
  (define print-parsed (make-parameter #f))
  (define file-to-run
    (command-line
     #:program "glut"
     #:once-each
     [("-p" "--print-parsed") "Print parsed program" (print-parsed #t)]
     #:args (filename)
     filename))
  (run (parse (port->string (open-input-file file-to-run)) (print-parsed))
       (current-input-port)
       (current-output-port))
  (void))

(main)
