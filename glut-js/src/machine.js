const newState = (jumpPairs, input, output) => {
  const table = {};
  for (let i = 0; i < jumpPairs.length; i++) {
    table[jumpPairs[i][0]] = jumpPairs[i][1];
  }
  const read = () => {
    const read = input.read();
    if (read === null) {
      table.$in = "";
      table.$eof = "1";
    } else {
      table.$in = read;
      table.$eof = "0";
    }
  };
  const write = () => {
    output.write(table.$out);
  };
  return {
    type: "state",
    table: table,
    running: true,
    read: read,
    write: write,
  };
};

const concat = (keys) => {
  return keys
    .filter((e) => e.length > 0)
    .reduce((prev, curr) => prev + curr, "");
};

const lookup = (state, key) => {
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

const update = (state, key, value) => {
  state.table[key] = value;
  if (key === "$out") {
    state.write();
  }
};

const resolve = (state, key) => {
  const resolveKey = (k) => {
    if (k.hasOwnProperty("type") && k.type === "reference") {
      return lookup(state, resolve(state, k.key));
    } else if (k.constructor === Array) {
      return resolve(state, k);
    } else {
      return k;
    }
  };

  const resolveInner = (ks) => {
    if (ks.length === 0) {
      return [];
    } else {
      const first = resolveKey(ks[0]);
      if (first === null) {
        return [];
      }
      const rest = resolveInner(ks.slice(1));
      rest.unshift(first);
      return rest;
    }
  };

  return concat(resolveInner(key));
};

const makeExecutor = (cb) => {
  return (state, inst) => {
    const key = resolve(state, inst.key[0].key);
    const val = resolve(state, inst.val);
    if (cb) {
      cb(key, val);
    }
    update(state, key, val);
  };
};

export const run = (instructions, input, output, cb) => {
  let hashed;
  const executeInstr = makeExecutor(cb);

  const runMachine = () => {
    const getInstruction = (i) => {
      if (hashed.hasOwnProperty(i)) {
        return hashed[i];
      } else {
        return null;
      }
    };

    const step = (state, i) => {
      const inst = getInstruction(i);
      if (inst === null) {
        state.running = false;
        return state;
      }

      const executeNext = () => {
        executeInstr(state, inst);
        const next = lookup(state, concat(["next", i]));
        update(state, "$pc", next);
        if (cb) {
          return {
            state: state,
            step: (state) => step(state, next)
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

    const init = (state) => {
      if (instructions !== undefined && instructions.length > 0) {
        const firstInstruction = instructions[0].index;
        update(state, "$pc", firstInstruction);
        if (cb) {
          return {
            state: state,
            step: (state) => step(state, firstInstruction)
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

  const start = () => {
    if (instructions === undefined || instructions.length === 0) {
      return {
        type: "state",
        table: {},
        running: false,
      };
    }
    const jumps = makeJumps(instructions);
    const state = newState(jumps, input, output);

    hashed = {};
    for (let i = 0; i < instructions.length; i++) {
      const inst = instructions[i];
      hashed[inst.index] = inst;
    }

    return runMachine()(state);
  };

  return start();
};

const makeJumps = (instructions) => {
  if (instructions === undefined || instructions.length === 1) {
    return [];
  } else {
    const i = concat(["next", instructions[0].index]);
    const j = instructions[1].index;
    const jumps = makeJumps(instructions.slice(1));
    jumps.unshift([i, j]);
    return jumps;
  }
};
