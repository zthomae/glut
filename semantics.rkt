#lang racket

(require racket/base)
(require racket/match)
(require "table.rkt")
(require "parser.rkt")

(provide (all-defined-out)
         (all-from-out "parser.rkt"))

;; looks up a key in the table. the key is possibly compound and also
;; may contain references to look up
(define (resolve a-state key)
  (define (resolve-key k)
    (match k
      [(reference r) (lookup a-state (resolve a-state r))]
      [(list l) (resolve a-state l)]
      [_ k]))
  (define (resolve-inner ks)
    (if (null? ks) '()
        (cons (resolve-key (car ks)) (resolve-inner (cdr ks)))))
  (apply concat (resolve-inner key)))

;; execute an instruction: set the value stored in the table under the
;; instruction's key to the instruction's value
(define (execute-instr a-state an-instruction)
  (define key (resolve a-state (reference-key (car (instruction-key an-instruction)))))
  (define val (resolve a-state (instruction-val an-instruction)))
  (update! a-state key val))

;; run starts the machine with a list of instructions and input and output
;; ports and runs it to completion
(define (run instructions in out)
  ;; instructions are hashed with their indices for faster lookup
  (define (hash-instructions)
    (define h (make-hash))
    (define (add-entry xs)
      (if (null? xs)
          h
          (begin
            (hash-set! h (instruction-index (car xs)) (car xs))
            (add-entry (cdr xs)))))
    (add-entry instructions))
  (define hashed (hash-instructions))

  ;; run-machine executes instructions in a loop until the
  ;; program terminates
  (define (run-machine a-state)
    (define (die) (set-state-running! a-state #f))
    (define (get-instruction i)
      (hash-ref hashed i die))
    (define (step i)
      (define instr (get-instruction i))
      (define (execute-next)
        (execute-instr a-state instr)
        (let ([next (lookup a-state (concat "next" i))])
          (update! a-state "$pc" next)
          (step next)))
      (if (state-running a-state)
          (execute-next)
          a-state))
    (when (not (null? instructions))
      (define first-instruction (instruction-index (car instructions)))
      (update! a-state "$pc" first-instruction)
      (step first-instruction)))

  ;; start the machine: construct the initial jump table, make a new
  ;; state, and start executing
  (define (start)
    (define jumps (make-jumps instructions))
    (define a-state (new-state jumps in out))
    (run-machine a-state))
  
  (start))

;; construct the initial jump table from instruction line numbers
(define (make-jumps instructions)
  (if (or (null? instructions) (null? (cdr instructions)))
      '()
      (let ([i (concat "next" (instruction-index (car instructions)))]
            [j (instruction-index (cadr instructions))])
        (cons (cons i j) (make-jumps (cdr instructions))))))

(module+ test
  (require rackunit)
  (let ([cin (current-input-port)]
       [cout (current-output-port)]
       [m-i make-instruction]
       [m-r make-reference])

   ;; executing no instructions should do nothing
   (let ([instructions '()])
     (check-not-exn (lambda () (run instructions cin cout))))

   ;; test simple instruction
   (let* ([i1 (m-i "0" (list (m-r '("first"))) '("set"))]
          [i2 (m-i "1" (list (m-r '("second"))) '("also set"))]
          [instructions (list i1 i2)]
          [s (run instructions cin cout)])
     (check-equal? (lookup s "first") "set")
     (check-equal? (lookup s "second") "also set"))

   ;; test references
   (let* ([i1 (m-i "0" (list (m-r '("first"))) (list (m-r '("$pc"))))]
          [i2 (m-i "1" (list (m-r '("second"))) (list (m-r '("first"))))]
          [i3 (m-i "3" (list (m-r '("third"))) '("first"))]
          [instructions (list i1 i2 i3)]
          [s (run instructions cin cout)])
     (check-equal? (lookup s "second") (lookup s "first"))
     (check-equal? (lookup s "third") "first"))

   ;; test basic concatenated lookup
   (let* ([i1 (m-i "0" (list (m-r '("next" "0"))) '("4"))]
          [s (run (list i1) cin cout)])
     (check-equal? (lookup s "next$0") "4"))

   ;; test nested lookup
   (let* ([i1 (m-i "0" (list (m-r '("test"))) '("next"))]
          [i2 (m-i "1" (list (m-r (list "first" (m-r '("test"))))) '("hello"))]
          [instructions (list i1 i2)]
          [s (run instructions cin cout)])
     (check-equal? (lookup s "first$next") "hello"))

   ;; test input
   (let* ([i1 (m-i "0" (list (m-r '("first"))) (list (m-r '("$in"))))]
          [i2 (m-i "2" (list (m-r '("second"))) (list (m-r '("$in"))))]
          [i3 (m-i "5" (list (m-r '("third"))) (list (m-r '("$in"))))]
          [instructions (list i1 i2 i3)]
          [string-input (open-input-string "12")]
          [s (run instructions string-input cout)])
     (check-equal? (lookup s "first") "1")
     (check-equal? (lookup s "second") "2")
     (check-equal? (lookup s "third") ""))

   ;; test output
   (let* ([i1 (m-i "0" (list (m-r '("$out"))) '("Hello"))]
          [i2 (m-i "1" (list (m-r '("space"))) '(" "))]
          [i3 (m-i "2" (list (m-r '("$out"))) (list (m-r '("space"))))]
          [i4 (m-i "3" (list (m-r '("$out"))) '("world"))]
          [instructions (list i1 i2 i3 i4)]
          [string-output (open-output-string)]
          [s (run instructions cin string-output)])
     (check-equal? (get-output-string string-output) "Hello world"))

   ;; test input string containing [
   (let* ([i0 (m-i "0" (list (m-r '("i"))) '("1"))]
          [i1 (m-i "1" (list (m-r '("$out"))) '("[mod$"))]
          [i2 (m-i "2" (list (m-r '("$out"))) (list (m-r '("i"))))]
          [string-output (open-output-string)]
          [s (run (list i0 i1 i2) cin string-output)])
     (check-equal? (lookup s "i") "1")
     (check-equal? (get-output-string string-output) "[mod$1"))))
