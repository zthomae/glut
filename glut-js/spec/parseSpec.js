var Parse = require("../lib/parse.js");

module.exports = function() {
  var Tokens = Parse.Tokens;
  var lexer = Parse.lexer;
  var parser = Parse.parser;

  describe("Lexer", function() {
    var getAllTokens = function(getToken) {
      var tokens = [];
      var t = getToken();
      while (t !== Tokens.EOF) {
        tokens.push(t);
        t = getToken();
      }
      tokens.push(t);
      return tokens;
    };

    it("handles every bare token", function() {
      expect(lexer('\n')()).toEqual(Tokens.NEWLINE);
      expect(lexer('[')()).toEqual(Tokens.LBR);
      expect(lexer(']')()).toEqual(Tokens.RBR);
      expect(lexer('=')()).toEqual(Tokens.EQ);
      expect(lexer('')()).toEqual(Tokens.EOF);
    });

    it("handles identifiers", function() {
      expect(lexer('abc')()).toEqual([Tokens.ID, 'abc']);
      expect(lexer('next$0')()).toEqual([Tokens.ID, 'next$0']);
      var l = lexer('a b');
      expect(l()).toEqual([Tokens.ID, 'a']);
      expect(l()).toEqual([Tokens.ID, 'b']);
    });

    it("handles string literals", function() {
      expect(lexer('"Hello"')()).toEqual([Tokens.STRINGLIT, 'Hello']);
      expect(lexer('"\\"Hello\\""')()).toEqual([Tokens.STRINGLIT, '"Hello"']);
    });

    it("doesn't accept unterminated string literals", function() {
      expect(function() { lexer('"Hello')(); }).toThrow("Syntax error");
      expect(function() { lexer('"Hello\n')(); }).toThrow("Syntax error");
    });

    it("handles basic statement", function() {
      var expected = [Tokens.LBR,
                      [Tokens.ID, '$out'],
                      Tokens.RBR,
                      Tokens.EQ,
                      [Tokens.STRINGLIT, 'Hello World\n'],
                      Tokens.NEWLINE,
                      Tokens.EOF];
      expect(getAllTokens(lexer('[$out] = "Hello World\n"\n')))
        .toEqual(expected);
    });

    it("throws EOF repeatedly", function() {
      var l = lexer('a');
      expect(l()).toEqual([Tokens.ID, 'a']);
      expect(l()).toEqual(Tokens.EOF);
      expect(l()).toEqual(Tokens.EOF);
    });
  });

  describe("parser", function() {
    it("parses a basic statement", function() {
      var s = '[$out] = "Hello World\n"\n';
      var parsed = parser(lexer(s))();
      expect(parsed.length).toEqual(1);
      expect(parsed[0]).toEqual({
        type: "instruction",
        index: "1",
        key: [{
          type: "reference",
          key: ["$out"]
        }],
        val: ['Hello World\n']
      });
    });

    it("counts lines properly", function() {
      var program = '[b]= c\n; Comment\n\n[c]=d\n';
      var parsed = parser(lexer(program))();
      expect(parsed.length).toEqual(2);
      expect(parsed[0]).toEqual({
        type: "instruction",
        index: "1",
        key: [{
          type: "reference",
          key: ["b"]
        }],
        val: ["c"]
      });
      expect(parsed[1]).toEqual({
        type: "instruction",
        index: "4",
        key: [{
          type: "reference",
          key: ["c"]
        }],
        val: ["d"]
      });
    });

    it("parses compound identifiers", function() {
      expect(parser(lexer('[d[e]] = b[1]\n'))()).toEqual([{
        type: "instruction",
        index: "1",
        key: [{
          type: "reference",
          key: [ "d", {
            type: "reference",
            key: ["e"]
          }]
        }],
        val: ["b", {
          type: "reference",
          key: ["1"]
        }]
      }]);
      expect(parser(lexer('[d] = [b[c]d]\n'))()).toEqual([{
        type: "instruction",
        index: "1",
        key: [{
          type: "reference",
          key: ["d"]
        }],
        val: [{
          type: "reference",
          key: ["b", {
            type: "reference",
            key: ["c"]
          }, "d"]
        }]
      }]);
    });

    it("fails on assignment to value", function() {
      expect(function() { parser(lexer('c=d\n'))(); }).toThrow("Parse error -- stmt expected LBR");
      expect(function() { parser(lexer('c=[d]\n'))(); }).toThrow("Parse error -- stmt expected LBR");
    });
  });
};
