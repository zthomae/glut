import * as Machine from "./machine";
import * as IO from "./io";

describe("Machine", () => {
  const run = Machine.run;

  test("does nothing when given no instructions", () => {
    expect(() => {
      run();
      run([]);
    }).not.toThrow();
  });

  test("works with simple instructions", () => {
    const i1 = {
      type: "instruction",
      index: "0",
      key: [
        {
          type: "reference",
          key: ["first"],
        },
      ],
      val: ["set"],
    };

    const i2 = {
      type: "instruction",
      index: "1",
      key: [
        {
          type: "reference",
          key: ["second"],
        },
      ],
      val: ["also set"],
    };

    const s = run([i1, i2]);
    expect(s.table.first).toEqual("set");
    expect(s.table.second).toEqual("also set");
    expect(s.running).toEqual(false);
  });

  test("works with references", () => {
    const i1 = {
      type: "instruction",
      index: "0",
      key: [
        {
          type: "reference",
          key: ["first"],
        },
      ],
      val: [
        {
          type: "reference",
          key: ["$pc"],
        },
      ],
    };
    const i2 = {
      type: "instruction",
      index: "1",
      key: [
        {
          type: "reference",
          key: ["second"],
        },
      ],
      val: [
        {
          type: "reference",
          key: ["first"],
        },
      ],
    };
    const i3 = {
      type: "instruction",
      index: "3",
      key: [
        {
          type: "reference",
          key: ["third"],
        },
      ],
      val: ["first"],
    };
    const s = run([i1, i2, i3]);
    expect(s.table.first).toEqual(s.table.second);
    expect(s.table.third).toEqual("first");
  });

  test("works with concatenated lookups", () => {
    const s = run([
      {
        type: "instruction",
        index: "0",
        key: [
          {
            type: "reference",
            key: ["next", "0"],
          },
        ],
        val: ["4"],
      },
    ]);
    expect(s.table.next0).toEqual("4");
  });

  test("works with nested keys", () => {
    const i1 = {
      type: "instruction",
      index: "0",
      key: [
        {
          type: "reference",
          key: ["test"],
        },
      ],
      val: ["next"],
    };

    const i2 = {
      type: "instruction",
      index: "1",
      key: [
        {
          type: "reference",
          key: [
            "first",
            {
              type: "reference",
              key: ["test"],
            },
          ],
        },
      ],
      val: ["hello"],
    };

    const s = run([i1, i2]);
    expect(s.table.firstnext).toEqual("hello");
  });

  test("works with nested lookups for values", () => {
    const i1 = {
      type: "instruction",
      index: "1",
      key: [
        {
          type: "reference",
          key: ["2"],
        },
      ],
      val: ["100"],
    };
    const i2 = {
      type: "instruction",
      index: "2",
      key: [
        {
          type: "reference",
          key: ["2"],
        },
      ],
      val: [
        {
          type: "reference",
          key: [
            {
              type: "reference",
              key: ["$pc"],
            },
          ],
        },
      ],
    };
    const s = run([i1, i2]);
    expect(s.table["2"]).toEqual("100");
  });

  test("works with input", () => {
    const input = IO.openInputString("123");
    const i1 = {
      type: "instruction",
      index: "0",
      key: [
        {
          type: "reference",
          key: ["set"],
        },
      ],
      val: [
        {
          type: "reference",
          key: ["$in"],
        },
      ],
    };
    const s = run([i1], input);
    expect(s.table.set).toEqual("1");
    expect(s.table.$eof).toEqual("0");
  });

  if (
    ("works with incomplete input",
    () => {
      const input = IO.openInputString("1");
      const i1 = {
        type: "instruction",
        index: "0",
        key: [
          {
            type: "reference",
            key: ["set"],
          },
        ],
        val: [
          {
            type: "reference",
            key: ["$in"],
          },
        ],
      };
      const s = run([i1, i1], input);
      expect(s.table.set).toEqual("");
      expect(s.table.$eof).toEqual("1");
    })
  );

  test("works with output", () => {
    const output = IO.openOutputString();
    const i1 = {
      type: "instruction",
      index: "0",
      key: [
        {
          type: "reference",
          key: ["$out"],
        },
      ],
      val: ["Hello World!"],
    };
    const s = run([i1], null, output);
    expect(output.output()).toEqual("Hello World!");
  });
});
