# glut

**G**iant **L**ook**U**p **T**able is an esoteric programming language
with only one kind of statement: Setting a value in a hash table.

## Usage

```
$ racket glut.rkt [program_file]
```

## Expressions

An expression in **glut** is either a string (the only primitive type
in the language) or a hash table lookup. Strings are either bare or
(double-) quoted and evaluate to themselves.  Lookups are bounded in
square brackets and evalute to their corresponding values.

### Examples

* `1`: The string `1`
* `[1]`: The value stored in the table under the key `1`
* `[[1]]`: The value stored in the table under the key that is the value
stored under the key `1`

It is allowed for a lookup to be performed on the result of a lookup,
as if there were nested tables. However, all nested lookups are
evaluated by concatenating the expressions into a single string,
corresponding to a single global lookup.

### Nested-lookup examples

* `[a][b]`: The string `a'$b'`, where `a'` and `b'` are the values stored
in the table under `a` and `b`, respectively
* `[[a][b]]`: The value in the table stored under the key `a'$b'`
* `1[a]`: The string `1$a'`
* `[1[a]]`: The value in the table stored under the key `1$a'`
* `[[a]1]`: The value in the table stored under th ekey `a'$1`

Whitespace inside of an expression is interpreted as
concatenation. The only way to have whitespace inside a string is to
use a string literal -- a string surrounded by double quotes. No
brackets are interpreted as lookups inside of a string literal.

Inside of a string literal, the escape sequences `\n` and `\t` are
supported. All others are interpreted literally as a backslash
followed by the next character.

## Statements

Every statement is a global table assignment of the form `[key] =
value`. `value` can be any expression. Any extra whitespace is
ignored.

Input and output is handled by reading from and assigning to special
keys. The lookup `[$in]` will result in a single character being read
from standard input, and will evaluate to this character represented
as a string. The character will also be stored in `[$in]`. Assigning
to `[$out]` will cause that statement's value to be written to
standard output after the value is stored in `[$out]`.

Any line which is either empty or begins with a semicolon is ignored.

## Runtime

The runtime provides one (and only one) global hash table. There
is a special key, `$pc`, which holds the index of the current
instruction. The interpreter repeats the following steps as long
as the program is running:

1. Evaluate instruction `$pc`
2. Set `$pc` to the value stored in `[next[$pc]]`.

The values `[next[$pc]]` are initialized at startup to store the
immediate next instruction number for each instruction `$pc`. The
instruction number refers to the line number in the source file.
For this reason, every statement must be on its own line. NOTE:
Due to a current limitation in the parser, the last source line
must also be followed by a newline.

The instructions themselves are not stored in the global table.

The program terminates when an invalid lookup is made -- that is,
attempting to get the value stored under a key when nothing has been
put there.

## Notes

The interpreter in this repository is not finished and is not bug-free.

## License

This project is licensed under the MIT license.
