#lang racket

(require racket/base)
(require racket/string)
(require racket/match)
(require rackunit)
(provide (all-defined-out))

(define-struct state (table in out [running #:mutable]))

(define (new-state lines in out)
  (make-state (make-hash (make-increments lines)) in out #t))

(define (concat . keys)
  (string-join keys "$"))

(define (make-increments last)
  (define (add-increment n rest)
    (define src (concat "next" (number->string n)))
    (define next (add1 n))
    (define dst (number->string next))
    (if (= next last)
        rest
        (add-increment next (cons (cons src dst) rest))))
  (add-increment 0 '()))

(define (lookup a-state key)
  (define (die) (set-state-running! a-state #f))
  (define table (state-table a-state))
  (when (equal? key "$in") (read-in a-state))
  (hash-ref table key die))

(define (update a-state key val)
  (define table (state-table a-state))
  (hash-set! table key val)
  (when (equal? key "$out") (write-out a-state)))

(define (read-in a-state)
  (define in (state-in a-state))
  (define c (read-char in))
  (if (eof-object? c)
      (update a-state "$in" "")
      (update a-state "$in" (make-string 1 c))))

(define (write-out a-state)
  (define out (state-out a-state))
  (define v (lookup a-state "$out"))
  (write-string v out))

(define-struct instruction (key val))
(define-struct reference (key))

(define (execute-instr a-state an-instruction)
  (define i-v (instruction-val an-instruction))
  (define val
    (match i-v
      [(reference k) (lookup a-state k)]
      [_ i-v])) ; This is bad...
  (update a-state
          (instruction-key an-instruction)
          val))

(define (run instructions first in out)
  (define (run-machine a-state)
    (define (die) (set-state-running! a-state #f))
    (define (get-instruction i)
      (hash-ref instructions i die))
    (define (step i)
      (define instr (get-instruction i))
      (define (execute-next)
        (execute-instr a-state instr)
        (let ([next (lookup a-state (concat "next" i))])
          (update a-state "$pc" next)
          (step next)))
      (if (state-running a-state)
          (execute-next)
          a-state))
    (define f (number->string first))
    (update a-state "$pc" f)
    (step f))
  (define (start)
    (define len (length (hash->list instructions)))
    (when (> len 0)
      (begin
        (define lines (+ first len))
        (define a-state (new-state lines in out))
        (run-machine a-state))))
  (if (< first 0) (error "start must be non-negative")
      (start)))

(let ([instructions (make-hash)])
  (define cin (current-input-port))
  (define cout (current-output-port))
  
  ;; executing no instructions should do nothing
  (check-not-exn (lambda () (run instructions 0 cin cout)))
  (check-not-exn (lambda () (run instructions 512 cin cout)))

  ;; executing with negative first line should error
  (check-exn exn:fail? (lambda () (run instructions -1 cin cout)))

  ;; test simple instruction
  (hash-set! instructions "0" (make-instruction "first" "set"))
  (let ([s (run instructions 0 cin cout)])
    (check-equal? (lookup s "first") "set"))

  (hash-set! instructions "1" (make-instruction "second" "also set"))
  (let ([s (run instructions 0 cin cout)])
    (check-equal? (lookup s "first") "set")
    (check-equal? (lookup s "second") "also set"))

  ;; test setting
  (hash-set! instructions "0" (make-instruction "first" (make-reference "$pc")))
  (hash-set! instructions "1" (make-instruction "second" (make-reference "first")))
  (hash-set! instructions "2" (make-instruction "third" "first"))
  (let ([s (run instructions 0 cin cout)])
    (check-equal? (lookup s "second") (lookup s "first"))
    (check-equal? (lookup s "third") "first"))
  
  ;; test input
  (define string-input (open-input-string "12"))
  (hash-set! instructions "0" (make-instruction "first" (make-reference "$in")))
  (hash-set! instructions "1" (make-instruction "second" (make-reference "$in")))
  (hash-set! instructions "2" (make-instruction "third" (make-reference "$in")))
  (let ([s (run instructions 0 string-input cout)])
    (check-equal? (lookup s "first") "1")
    (check-equal? (lookup s "second") "2")
    (check-equal? (lookup s "third") ""))

  ;; test output
  (define string-output (open-output-string))
  (hash-set! instructions "0" (make-instruction "$out" "Hello"))
  (hash-set! instructions "1" (make-instruction "$out" " "))
  (hash-set! instructions "2" (make-instruction "$out" "world"))
  (let ([s (run instructions 0 cin string-output)])
    (check-equal? (get-output-string string-output) "Hello world")))
