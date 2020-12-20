import * as Parse from "./parse";
import * as Machine from "./machine";

export const Create = function(view) {
  let m = null;
  let delay = 0;
  let breaks = {};
  let running = false;
  return {
    start: function() {
      view.clear();
      const code = view.getCode();
      const parsed = Parse.parser(Parse.lexer(code))();
      m = Machine.run(parsed, view.getInput(), view.getOutput(), view.update);
      if (m.state !== undefined) {
        const table = m.state.table;
        for (let key in table) {
          view.update(key, table[key]);
        }
      }
    },
    step: function() {
      if (!view.isLocked()) {
        this.start();
      }
      view.update("$pc", m.state.table.$pc);
      m = m.step(m.state);
    },
    run: function() {
      if (!view.isLocked()) {
        this.start();
      }
      this.running = true;
      this.continue();
    },
    continue: function() {
      if (this.running) {
        if (delay) {
          if (m.state.running && !(m.state.table.$pc in breaks)) {
            this.step();
          }
          if (!m.state.running || m.state.table.$pc in breaks) {
            this.running = false;
          } else {
            setTimeout(this.continue.bind(this), delay);
          }
          delete breaks[m.state.table.$pc];
        } else {
          while (m.state.running && !(m.state.table.$pc in breaks)) {
            this.step();
          }
          delete breaks[m.state.table.$pc];
          this.running = false;
        }
      }
    },
    stop: function() {
      this.running = false;
    },
    addBreakpoint: function(inst) {
      breaks[inst] = true;
    },
    removeBreakpoint: function(inst) {
      delete breaks[inst];
    },
    setDelay: function(d) {
      delay = d;
    }
  };
}

export const Bind = (view, presenter) => view.bind(presenter);
