import * as Presenter from "./presenter";

describe("Presenter", () => {
  const view = {
    Create: function () {
      let rows = {};
      return {
        bind: function () {},
        clear: function () {
          rows = {};
        },
        update: function (key, val) {
          rows[key] = val;
        },
        getCode: function () {
          if (!this.isLocked()) {
            this.lock();
          }
          return "[1] = 2\n[2] = [1]\n";
        },
        isLocked: function () {
          return this._locked;
        },
        lock: function () {
          this._locked = true;
        },
        unlock: function () {
          this._locked = false;
        },
        _lookup: function (key) {
          return rows[key];
        },
        _locked: false,
        getInput: function () {
          return {
            read: function () {
              return "a";
            },
          };
        },
        getOutput: function () {
          const _output = "";
          return {
            output: function () {
              return _output;
            },
            write: function (s) {
              _output += s;
            },
          };
        },
      };
    },
  };

  test("should add initial keys", () => {
    const v = view.Create();
    const p = Presenter.Create(v);
    Presenter.Bind(v, p);
    p.start();
    expect(v._lookup("next1")).toEqual("2");
    expect(v._lookup("$pc")).toEqual("1");
  });

  test("should start machine if step() called first", () => {
    const v = view.Create();
    const p = Presenter.Create(v);
    Presenter.Bind(v, p);
    p.step();
    expect(v._lookup("1")).toEqual("2");
  });

  test("should add keys on stepping", () => {
    const v = view.Create();
    const p = Presenter.Create(v);
    Presenter.Bind(v, p);
    p.start();
    p.step();
    expect(v._lookup("1")).toEqual("2");
    expect(v._lookup("$pc")).toEqual("1");
    p.step();
    expect(v._lookup("2")).toEqual("2");
    expect(v._lookup("$pc")).toEqual("2");
  });

  test("should continue to run without breakpoints", () => {
    const v = view.Create();
    const p = Presenter.Create(v);
    Presenter.Bind(v, p);
    p.run();
    expect(v._lookup("1")).toEqual("2");
    expect(v._lookup("2")).toEqual("2");
  });

  test("should stop running with a breakpoint", () => {
    const v = view.Create();
    const p = Presenter.Create(v);
    Presenter.Bind(v, p);
    p.addBreakpoint("1");
    p.run();
    expect(v._lookup("1")).not.toBeDefined();
    p.addBreakpoint("2");
    p.run();
    expect(v._lookup("1")).toEqual("2");
    expect(v._lookup("2")).not.toBeDefined();
  });

  test("should be able to delete breakpoints", () => {
    const v = view.Create();
    const p = Presenter.Create(v);
    Presenter.Bind(v, p);
    p.addBreakpoint("2");
    p.removeBreakpoint("2");
    p.run();
    expect(v._lookup("2")).toEqual("2");
  });
});
