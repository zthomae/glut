var Presenter = require("../lib/presenter.js");

module.exports = function() {
  describe("Presenter", function() {
    var view = {
      Create: function() {
        var rows = {};
        return {
          bind: function() { },
          clear: function() {
            rows = {};
          },
          update: function(key, val) {
            rows[key] = val;
          },
          getCode: function() {
            if (!this.isLocked()) {
              this.lock(); 
            }
            return "[1] = 2\n[2] = [1]\n";
          },
          isLocked: function() {
            return this._locked;
          },
          lock: function() {
            this._locked = true;
          },
          unlock: function() {
            this._locked = false;
          },
          _lookup: function(key) {
            return rows[key];
          },
          _locked: false,
          getInput: function() {
            return {
              read: function() {
                return 'a';
              }
            };
          },
          getOutput: function() {
            var _output = "";
            return {
              output: function() {
                return _output;
              },
              write: function(s) {
                _output += s;
              }
            };
          }
        };
      }
    };

    it("should add initial keys", function() {
      var v = view.Create();
      var p = Presenter.Create(v);
      Presenter.Bind(v, p);
      p.start();
      expect(v._lookup("next1")).toEqual("2");
      expect(v._lookup("$pc")).toEqual("1");
    });

    it("should start machine if step() called first", function() {
      var v = view.Create();
      var p = Presenter.Create(v);
      Presenter.Bind(v, p);
      p.step();
      expect(v._lookup("1")).toEqual("2");
    });

    it("should add keys on stepping", function() {
      var v = view.Create();
      var p = Presenter.Create(v);
      Presenter.Bind(v, p);
      p.start();
      p.step();
      expect(v._lookup("1")).toEqual("2");
      expect(v._lookup("$pc")).toEqual("1");
      p.step();
      expect(v._lookup("2")).toEqual("2");
      expect(v._lookup("$pc")).toEqual("2");
    });

    it("should continue to run without breakpoints", function() {
      var v = view.Create();
      var p = Presenter.Create(v);
      Presenter.Bind(v, p);
      p.run();
      expect(v._lookup("1")).toEqual("2");
      expect(v._lookup("2")).toEqual("2");
    });

    it("should stop running with a breakpoint", function() {
      var v = view.Create();
      var p = Presenter.Create(v);
      Presenter.Bind(v, p);
      p.addBreakpoint("1");
      p.run();
      expect(v._lookup("1")).not.toBeDefined();
      p.addBreakpoint("2");
      p.run();
      expect(v._lookup("1")).toEqual("2");
      expect(v._lookup("2")).not.toBeDefined();
    });

    it("should be able to delete breakpoints", function() {
      var v = view.Create();
      var p = Presenter.Create(v);
      Presenter.Bind(v, p);
      p.addBreakpoint("2");
      p.removeBreakpoint("2");
      p.run();
      expect(v._lookup("2")).toEqual("2");
    });
  });
};
