module.exports = (function() {
  'use strict';

  var Parse = {};

  var Tokens = Parse.Tokens = {
    NEWLINE: "NEWLINE",
    LBR: "LEFT BRACKET",
    RBR: "RIGHT BRACKET",
    EQ: "EQUALS",
    COMMENT: "COMMENT",
    ID: "IDENTIFIER",
    STRINGLIT: "STRING LITERAL",
    EOF: "EOF"
  };

  // Given an input string, return a generator of tokens Will continue
  // to generate EOF after the input is fully lexed.
  Parse.lexer = function(input) {
    var len = input.length;
    var currentPos = 0;

    var peek = function(i) {
      if (i >= len) {
        return Tokens.EOF;
      } else {
        return input[i];
      }
    };

    var escapeChars = function(s) {
      if (s.length === 0) {
        return s;
      } else if (s[0] === '\\') {
        if (s[1] === 'n') {
          return '\n' + escapeChars(s.substring(2));
        } else if (s[1] === 't') {
          return '\t' + escapeChars(s.substring(2));
        } else if (s[1] === '"' || s[1] === '\\') {
          return s[1] + escapeChars(s.substring(2));
        } else {
          return s[0] + escapeChars(s.substring(1));
        }
      } else {
        return s[0] + escapeChars(s.substring(1));
      }
    };

    var getStringLiteral = function() {
      var escaping = false;
      currentPos++;
      var start = currentPos;
      var p = peek(currentPos);
      while (p !== Tokens.EOF && !(p === '"' && !escaping)) {
        escaping = (p === '\\');
        currentPos++;
        p = peek(currentPos);
      }
      if (p === Tokens.EOF) {
        throw "Syntax error";
      }
      currentPos++;
      var s = input.substring(start, currentPos - 1);
      return escapeChars(s);
    };

    var getIdentifier = function() {
      var start = currentPos;
      var p = peek(currentPos);
      var excluded = ['\n', '\t', ' ', '[', ']', '=', Tokens.EOF];
      while (excluded.indexOf(p) === -1) {
        currentPos++;
        p = peek(currentPos);
      }
      return input.substring(start, currentPos);
    };

    var getToken = function() {
      switch (peek(currentPos)) {
      case Tokens.EOF:
        return Tokens.EOF;
      case '\t':
        currentPos++;
        return getToken();
      case ' ':
        currentPos++;
        return getToken();
      case '\n':
        currentPos++;
        return Tokens.NEWLINE;
      case '[':
        currentPos++;
        return Tokens.LBR;
      case ']':
        currentPos++;
        return Tokens.RBR;
      case '=':
        currentPos++;
        return Tokens.EQ;
      case ';':
        var p = peek(currentPos);
        while (p != '\n') {
          if (p === Tokens.EOF) {
            throw "Expected newline";
          } else {
            currentPos++;
            p = peek(currentPos);
          }
        }
        currentPos++;
        return Tokens.COMMENT;
      case '"':
        var lit = getStringLiteral();
        return [Tokens.STRINGLIT, lit];
      default:
        var id = getIdentifier();
        return [Tokens.ID, id];
      }
    };
    return getToken;
  };

  // Given a token generator (made via lexer()), returns a function of
  // no arguments that, when called, returns a valid parse (a list of
  // parsed expressions), if there is one
  Parse.parser = function(getToken) {
    var currentToken = getToken();
    var currentLine = 1;

    var nextToken = function() {
      currentToken = getToken();
    };

    // program: null | line program
    var program = function() {
      if (currentToken !== Tokens.EOF) {
        var nextLine = line();
        return nextLine.concat(program());
      } else {
        return [];
      }
    };

    // line: comment | newline | stmt newline | stmt comment
    var line = function() {
      if (currentToken === Tokens.COMMENT) {
        nextToken();
        currentLine++;
        return [];
      } else if (currentToken === Tokens.NEWLINE) {
        nextToken();
        currentLine++;
        return [];
      } else {
        var nextStmt = stmt();
        if (currentToken === Tokens.COMMENT ||
            currentToken === Tokens.NEWLINE)
        {
          nextToken();
          currentLine++;
          return [nextStmt];
        } else {
          throw "Parse error -- line expected a COMMENT or NEWLINE";
        }
      }
    };

    // stmt: lookup EQ expr
    var stmt = function() {
      if (currentToken === Tokens.LBR) {
        var nextLookup = lookup();
        if (currentToken === Tokens.EQ) {
          nextToken();
          var nextExpr = expr();
          return {
            type: "instruction",
            index: currentLine.toString(),
            key: nextLookup,
            val: nextExpr
          };
        } else {
          throw "Parse error -- stmt expected EQ";
        }
      } else {
        throw "Parse error -- stmt expected LBR";
      }
    };

    // expr: null | ID expr | lookup expr | stringlit expr
    var expr = function() {
      if (currentToken[0] === Tokens.ID) {
        var id = [currentToken[1]];
        nextToken();
        if (currentToken[0] === Tokens.ID ||
            currentToken === Tokens.LBR ||
            currentToken[0] === Tokens.STRINGLIT)
        {
          return id.concat(expr());
        } else {
          return id;
        }
      } else if (currentToken === Tokens.LBR) {
        var nextLookup = lookup();
        if (currentToken[0] === Tokens.ID ||
            currentToken === Tokens.LBR ||
            currentToken[0] === Tokens.STRINGLIT)
        {
          return nextLookup.concat(expr());
        } else {
          return nextLookup;
        }
      } else if (currentToken[0] === Tokens.STRINGLIT) {
        var lit = [currentToken[1]];
        nextToken();
        if (currentToken[0] === Tokens.ID ||
            currentToken === Tokens.LBR ||
            currentToken[0] === Tokens.STRINGLIT)
        {
          return lit.concat(expr());
        } else {
          return lit;
        }
      } else {
        throw "Parse error -- expr expected an ID, LBR, or STRINGLIT";
      }
    };

    // lookup: [ expr ]
    var lookup = function() {
      if (currentToken === Tokens.LBR) {
        nextToken();
        var nextExpr = expr();
        if (currentToken === Tokens.RBR) {
          nextToken();
          return [{
            type: "reference",
            key: nextExpr
          }];
        } else if (currentToken[0] === Tokens.ID) {
          var res = nextExpr.concat(expr());
          if (currentToken === Tokens.RBR) {
            nextToken();
            return res;
          } else {
            throw "Parse error -- lookup expected a RBR";
          }
        } else {
          throw "Parse error -- lookup expected a RBR or ID";
        }
      } else {
        throw "Parse error -- lookup expected a LBR";
      }
    };

    return program;
  };

  return Parse;
}());
