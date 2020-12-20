import { Tokens, lexer, parser } from "./parse";

describe("Lexer", () => {
  const getAllTokens = function (getToken) {
    const tokens = [];
    let t = getToken();
    while (t !== Tokens.EOF) {
      tokens.push(t);
      t = getToken();
    }
    tokens.push(t);
    return tokens;
  };

  test("handles every bare token", () => {
    expect(lexer("\n")()).toEqual(Tokens.NEWLINE);
    expect(lexer("[")()).toEqual(Tokens.LBR);
    expect(lexer("]")()).toEqual(Tokens.RBR);
    expect(lexer("=")()).toEqual(Tokens.EQ);
    expect(lexer("")()).toEqual(Tokens.EOF);
  });

  test("handles identifiers", () => {
    expect(lexer("abc")()).toEqual([Tokens.ID, "abc"]);
    expect(lexer("next$0")()).toEqual([Tokens.ID, "next$0"]);
    const l = lexer("a b");
    expect(l()).toEqual([Tokens.ID, "a"]);
    expect(l()).toEqual([Tokens.ID, "b"]);
  });

  test("handles string literals", () => {
    expect(lexer('"Hello"')()).toEqual([Tokens.STRINGLIT, "Hello"]);
    expect(lexer('"\\"Hello\\""')()).toEqual([Tokens.STRINGLIT, '"Hello"']);
  });

  test("doesn't accept unterminated string literals", () => {
    expect(() => {
      lexer('"Hello')();
    }).toThrow("Syntax error");
    expect(() => {
      lexer('"Hello\n')();
    }).toThrow("Syntax error");
  });

  test("handles basic statement", () => {
    const expected = [
      Tokens.LBR,
      [Tokens.ID, "$out"],
      Tokens.RBR,
      Tokens.EQ,
      [Tokens.STRINGLIT, "Hello World\n"],
      Tokens.NEWLINE,
      Tokens.EOF,
    ];
    expect(getAllTokens(lexer('[$out] = "Hello World\n"\n'))).toEqual(expected);
  });

  test("throws EOF repeatedly", () => {
    const l = lexer("a");
    expect(l()).toEqual([Tokens.ID, "a"]);
    expect(l()).toEqual(Tokens.EOF);
    expect(l()).toEqual(Tokens.EOF);
  });
});

describe("parser", () => {
  test("parses a basic statement", () => {
    const s = '[$out] = "Hello World\n"\n';
    const parsed = parser(lexer(s))();
    expect(parsed.length).toEqual(1);
    expect(parsed[0]).toEqual({
      type: "instruction",
      index: "1",
      key: [
        {
          type: "reference",
          key: ["$out"],
        },
      ],
      val: ["Hello World\n"],
    });
  });

  test("counts lines properly", () => {
    const program = "[b]= c\n; Comment\n\n[c]=d\n";
    const parsed = parser(lexer(program))();
    expect(parsed.length).toEqual(2);
    expect(parsed[0]).toEqual({
      type: "instruction",
      index: "1",
      key: [
        {
          type: "reference",
          key: ["b"],
        },
      ],
      val: ["c"],
    });
    expect(parsed[1]).toEqual({
      type: "instruction",
      index: "4",
      key: [
        {
          type: "reference",
          key: ["c"],
        },
      ],
      val: ["d"],
    });
  });

  test("parses compound identifiers", () => {
    expect(parser(lexer("[d[e]] = b[1]\n"))()).toEqual([
      {
        type: "instruction",
        index: "1",
        key: [
          {
            type: "reference",
            key: [
              "d",
              {
                type: "reference",
                key: ["e"],
              },
            ],
          },
        ],
        val: [
          "b",
          {
            type: "reference",
            key: ["1"],
          },
        ],
      },
    ]);
    expect(parser(lexer("[d] = [b[c]d]\n"))()).toEqual([
      {
        type: "instruction",
        index: "1",
        key: [
          {
            type: "reference",
            key: ["d"],
          },
        ],
        val: [
          {
            type: "reference",
            key: [
              "b",
              {
                type: "reference",
                key: ["c"],
              },
              "d",
            ],
          },
        ],
      },
    ]);
  });

  test("fails on assignment to value", () => {
    expect(() => {
      parser(lexer("c=d\n"))();
    }).toThrow("Parse error -- stmt expected LBR");
    expect(() => {
      parser(lexer("c=[d]\n"))();
    }).toThrow("Parse error -- stmt expected LBR");
  });
});
