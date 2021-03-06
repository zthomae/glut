#lang racket

(require racket/base)
(require racket/string)
(provide (all-defined-out))

(define-struct state (table in out [running #:mutable]) #:transparent)

;; new-state wraps the generated make-state function with
;; correct initialization
(define (new-state jump-pairs in out)
  (make-state (make-hash jump-pairs) in out #t))

;; concat joins keys, as per the spec, with $
(define (concat . keys)
  (string-join (filter non-empty-string? keys) ""))

;; lookup wraps a basic hash-table lookup to read from
;; input and stop the machine on an invalid key
(define (lookup a-state key)
  (define (die) (set-state-running! a-state #f))
  (define table (state-table a-state))
  (when (equal? key "$in") (read-in! a-state))
  (hash-ref table key die))

;; update! wraps hash-table setting to write to output
(define (update! a-state key val)
  (define table (state-table a-state))
  (hash-set! table key val)
  (when (equal? key "$out") (write-out a-state)))

;; reads a character from input and places it in the table
;; under key $in
(define (read-in! a-state)
  (define in (state-in a-state))
  (define c (read-char in))
  (if (eof-object? c)
      (begin
        (update! a-state "$eof" "1")
        (update! a-state "$in" ""))
      (begin
        (update! a-state "$eof" "0")
        (update! a-state "$in" (make-string 1 c)))))

;; writes the value in the table under key $out to output
(define (write-out a-state)
  (define out (state-out a-state))
  (define v (lookup a-state "$out"))
  (display v out))

(module+ test
  (require rackunit)
  (let* ([in (open-input-string "1")]
        [out (open-output-string)]
        [jumps (list (cons "1" "2") (cons "2" "5"))]
        [s (new-state jumps in out)])

   ;; test setting and getting
   (update! s "key" "val")
   (check-equal? (lookup s "key") "val")
   (update! s "key" "val2")
   (check-equal? (lookup s "key") "val2")

   ;; test that jump pairs are included
   (check-equal? (lookup s "1") "2")
   (check-equal? (lookup s "2") "5")

   ;; test input
   (check-equal? (lookup s "$in") "1")
   (check-equal? (lookup s "$eof") "0")
   (check-equal? (lookup s "$in") "")
   (check-equal? (lookup s "$eof") "1")

   ;; test output
   (update! s "$out" "written")
   (check-equal? (get-output-string out) "written"))

  ;; test concatenation
  (check-equal? (concat "a" "b" "c") "abc"))
  
