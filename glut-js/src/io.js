export const openInputString = (s) => {
  let pos = 0;
  const len = s.length;
  const read = () => {
    if (pos === len) return null;
    return s[pos++];
  };

  return {
    read: read,
  };
};

export const openOutputString = () => {
  let _output = "";
  const output = () => {
    return _output;
  };
  const write = (s) => {
    _output += s;
  };

  return {
    output: output,
    write: write,
  };
};
