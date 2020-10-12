import * as IO from "./io";

test("creates input string", () => {
  const input = IO.openInputString("");
  expect(input.read).toBeDefined();
});

test("creates output string", () => {
  const output = IO.openOutputString();
  expect(output.output).toBeDefined();
  expect(output.write).toBeDefined();
});

test("reads null when no characters left", () => {
  const input = IO.openInputString("");
  expect(input.read()).toEqual(null);
});

test("reads one character at a time", () => {
  const input = IO.openInputString("123");
  expect(input.read()).toEqual("1");
  expect(input.read()).toEqual("2");
  expect(input.read()).toEqual("3");
  expect(input.read()).toEqual(null);
});

test("writes one string at a time", () => {
  const output = IO.openOutputString();
  expect(output.output()).toEqual("");
  output.write("Hello");
  expect(output.output()).toEqual("Hello");
  output.write(" World!");
  expect(output.output()).toEqual("Hello World!");
});
