var Machine = require("../lib/machine.js");
var IO = require("../lib/io.js");

module.exports = function() {
  describe("Machine", function() {
    var run = Machine.run;
    it("does nothing when given no instructions", function() {
      expect(function() {
        run();
        run([]);
      }).not.toThrow();
    });

    it("works with simple instructions", function() {
      var i1 = {
        type: "instruction",
        index: "0",
        key: [{
          type: "reference",
          key: ["first"]
        }],
        val: ["set"]
      };

      var i2 = {
        type: "instruction",
        index: "1",
        key: [{
          type: "reference",
          key: ["second"]
        }],
        val: ["also set"]
      };

      var s = run([i1, i2]);
      expect(s.table.first).toEqual("set");
      expect(s.table.second).toEqual("also set");
      expect(s.running).toEqual(false);
    });

    it("works with references", function() {
      var i1 = {
        type: "instruction",
        index: "0",
        key: [{
          type: "reference",
          key: ["first"]
        }],
        val: [{
          type: "reference",
          key: ["$pc"]
        }]
      };
      var i2 = {
        type: "instruction",
        index: "1",
        key: [{
          type: "reference",
          key: ["second"]
        }],
        val: [{
          type: "reference",
          key: ["first"]
        }]
      };
      var i3 = {
        type: "instruction",
        index: "3",
        key: [{
          type: "reference",
          key: ["third"]
        }],
        val: ["first"]
      };
      var s = run([i1, i2, i3]);
      expect(s.table.first).toEqual(s.table.second);
      expect(s.table.third).toEqual("first");
    });

    it("works with concatenated lookups", function() {
      var s = run([{
        type: "instruction",
        index: "0",
        key: [{
          type: "reference",
          key: ["next", "0"]
        }],
        val: ["4"]
      }]);
      expect(s.table.next0).toEqual("4");
    });

    it("works with nested keys", function() {
      var i1 = {
        type: "instruction",
        index: "0",
        key: [{
          type: "reference",
          key: ["test"]
        }],
        val: ["next"]
      };

      var i2 = {
        type: "instruction",
        index: "1",
        key: [{
          type: "reference",
          key: ["first", {
            type: "reference",
            key: ["test"]
          }]
        }],
        val: ["hello"]
      };

      var s = run([i1, i2]);
      expect(s.table.firstnext).toEqual("hello");
    });

    it("works with nested lookups for values", function() {
      var i1 = {
        type: "instruction",
        index: "1",
        key: [{
          type: "reference",
          key: ["2"]
        }],
        val: ["100"]
      };
      var i2 = {
        type: "instruction",
        index: "2",
        key: [{
          type: "reference",
          key: ["2"]
        }],
        val: [{
          type: "reference",
          key: [{
            type: "reference",
            key: ["$pc"]
          }]
        }]
      };
      var s = run([i1, i2]);
      expect(s.table["2"]).toEqual("100");
    });

    it("works with input", function() {
      var input = IO.openInputString("123");
      var i1 = {
        type: "instruction",
        index: "0",
        key: [{
          type: "reference",
          key: ["set"]
        }],
        val: [{
          type: "reference",
          key: ["$in"]
        }]
      };
      var s = run([i1], input);
      expect(s.table.set).toEqual("1");
      expect(s.table.$eof).toEqual("0");
    });

    if("works with incomplete input", function() {
      var input = IO.openInputString("1");
      var i1 = {
        type: "instruction",
        index: "0",
        key: [{
          type: "reference",
          key: ["set"]
        }],
        val: [{
          type: "reference",
          key: ["$in"]
        }]
      };
      var s = run([i1, i1], input);
      expect(s.table.set).toEqual("");
      expect(s.table.$eof).toEqual("1");
    });

    it("works with output", function() {
      var output = IO.openOutputString();
      var i1 = {
        type: "instruction",
        index: "0",
        key: [{
          type: "reference",
          key: ["$out"]
        }],
        val: ["Hello World!"]
      };
      var s = run([i1], null, output);
      expect(output.output()).toEqual("Hello World!");
    });

  });
};
