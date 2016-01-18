#lang racket

(require racket/base)
(require racket/string)
(require racket/match)
(require rackunit)
(provide (all-defined-out))

(define-struct state (table in out [running #:mutable]))

(define (new-state jump-pairs in out)
  (make-state (make-hash jump-pairs) in out #t))

(define (concat . keys)
  (string-join (filter non-empty-string? keys) "$"))

(define (lookup a-state key)
  (define (die) (set-state-running! a-state #f))
  (define table (state-table a-state))
  (when (equal? key "$in") (read-in! a-state))
  (hash-ref table key die))

(define (update! a-state key val)
  (define table (state-table a-state))
  (hash-set! table key val)
  (when (equal? key "$out") (write-out a-state)))

(define (read-in! a-state)
  (define in (state-in a-state))
  (define c (read-char in))
  (if (eof-object? c)
      (update! a-state "$in" "")
      (update! a-state "$in" (make-string 1 c))))

(define (write-out a-state)
  (define out (state-out a-state))
  (define v (lookup a-state "$out"))
  (write-string v out))

(define-struct instruction (index key val))
(define-struct reference (key))

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

(define (execute-instr a-state an-instruction)
  (define key (resolve a-state (reference-key (car (instruction-key an-instruction)))))
  (define val (resolve a-state (instruction-val an-instruction)))
  (update! a-state key val))

(define (run instructions in out)
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
    (update! a-state "$pc" "0")
    (step "0"))
  (define (start)
    (define jumps (make-jumps instructions))
    (define a-state (new-state jumps in out))
    (run-machine a-state))
  (start))

(define (make-jumps instructions)
  (if (or (null? instructions) (null? (cdr instructions)))
      '()
      (let ([i (concat "next" (instruction-index (car instructions)))]
            [j (instruction-index (cadr instructions))])
        (cons (cons i j) (make-jumps (cdr instructions))))))

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
         [string-output (open-output-string)])
    (let ([s (run instructions cin string-output)])
      (check-equal? (get-output-string string-output) "Hello world"))))
