#lang racket

(for ([i (in-range 0 100)])
  (printf "[inc$~a] = ~a\n" i (+ i 1)))
