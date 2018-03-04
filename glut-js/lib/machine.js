module.exports = (function() {
  'use strict';

  var newState = function(jumpPairs, input, output) {
    var table = {};
    for (var i = 0; i < jumpPairs.length; i++) {
      table[jumpPairs[i][0]] = jumpPairs[i][1];
    }
    var read = function() {
      var read = input.read();
      if (read === null) {
        table.$in = "";
        table.$eof = "1";
      } else {
        table.$in = read;
        table.$eof = "0";
      }
    };
    var write = function() {
      output.write(table.$out);
    };
    return {
      type: "state",
      table: table,
      running: true,
      read: read,
      write: write
    };
  };

  var concat = function(keys) {
    return keys.filter(function(e) {
      return e.length > 0;
    }).reduce(function(prev, curr) {
      return prev + curr;
    }, "");
  };

  var lookup = function(state, key) {
    if (key === "$in") {
      state.read();
    }
    if (state.table.hasOwnProperty(key)) {
      return state.table[key];
    } else {
      state.running = false;
      return null;
    }
  };

  var update = function(state, key, value) {
    state.table[key] = value;
    if (key === "$out") {
      state.write();
    }
  };

  var resolve = function(state, key) {
    var resolveKey = function(k) {
      if (k.hasOwnProperty("type") && k.type === "reference") {
        return lookup(state, resolve(state, k.key));
      } else if (k.constructor === Array) {
        return resolve(state, k);
      } else {
        return k;
      }
    };

    var resolveInner = function(ks) {
      if (ks.length === 0) {
        return [];
      } else {
        var first = resolveKey(ks[0]);
        if (first === null) {
          return [];
        }
        var rest = resolveInner(ks.slice(1));
        rest.unshift(first);
        return rest;
      }
    };

    return concat(resolveInner(key));
  };

  var makeExecutor = function(cb) {
    return function(state, inst) {
      var key = resolve(state, inst.key[0].key);
      var val = resolve(state, inst.val);
      if (cb) {
        cb(key, val);
      }
      update(state, key, val);
    };
  };

  var run = function(instructions, input, output, cb) {
    var hashed;
    var executeInstr = makeExecutor(cb);

    var runMachine = function() {
      var getInstruction = function(i) {
        if (hashed.hasOwnProperty(i)) {
          return hashed[i];
        } else {
          return null;
        }
      };

      var step = function(state, i) {
        var inst = getInstruction(i);
        if (inst === null) {
          state.running = false;
          return state;
        }

        var executeNext = function() {
          executeInstr(state, inst);
          var next = lookup(state, concat(["next", i]));
          update(state, "$pc", next);
          if (cb) {
            return {
              state: state,
              step: function(state) {
                return step(state, next);
              }
            };
          } else {
            return step(state, next);
          }
        };

        if (state.running) {          
          return executeNext();
        } else {
          return state;
        }
      };

      var init = function(state) {
        if (instructions !== undefined && instructions.length > 0) {
          var firstInstruction = instructions[0].index;
          update(state, "$pc", firstInstruction);
          if (cb) {
            return {
              state: state,
              step: function(state) {
                return step(state, firstInstruction);
              }
            };
          } else {
            return step(state, firstInstruction);          
          }
        } else {
          return null;
        }
      };

      return init;
    };

    var start = function() {
      if (instructions === undefined || instructions.length === 0) {
        return {
          type: "state",
          table: {},
          running: false
        };
      }
      var jumps = makeJumps(instructions);
      var state = newState(jumps, input, output);

      hashed = {};
      for (var i = 0; i < instructions.length; i++) {
        var inst = instructions[i];
        hashed[inst.index] = inst;
      }

      return runMachine()(state);
    };

    return start();
  };

  var makeJumps = function(instructions) {
    if (instructions === undefined || instructions.length === 1) {
      return [];
    } else {
      var i = concat(["next", instructions[0].index]);
      var j = instructions[1].index;
      var jumps = makeJumps(instructions.slice(1));
      jumps.unshift([i, j]);
      return jumps;
    }
  };

  return {
    run: run
  };
}());
