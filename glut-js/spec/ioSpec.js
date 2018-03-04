var IO = require("../lib/io.js");

module.exports = function() {  
  describe("IO", function() {
    it("creates input string", function() {
      var input = IO.openInputString("");
      expect(input.read).toBeDefined();
    });

    it("creates output string", function() {
      var output = IO.openOutputString();
      expect(output.output).toBeDefined();
      expect(output.write).toBeDefined();
    });

    it("reads null when no characters left", function() {
      var input = IO.openInputString("");
      expect(input.read()).toEqual(null);
    });
    
    it("reads one character at a time", function() {
      var input = IO.openInputString("123");
      expect(input.read()).toEqual("1");
      expect(input.read()).toEqual("2");
      expect(input.read()).toEqual("3");
      expect(input.read()).toEqual(null);
    });

    it("writes one string at a time", function() {
      var output = IO.openOutputString();
      expect(output.output()).toEqual("");
      output.write("Hello");
      expect(output.output()).toEqual("Hello");
      output.write(" World!");
      expect(output.output()).toEqual("Hello World!");
    });
  });
};
