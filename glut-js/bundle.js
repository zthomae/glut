/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./main.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./lib/editable.js":
/*!*************************!*\
  !*** ./lib/editable.js ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = (function() {\n  'use strict';\n\n  var makeLine = function(line, index) {\n    var lineDiv = document.createElement(\"div\");\n    lineDiv.setAttribute(\"id\", \"line-\" + (index + 1));\n    lineDiv.innerText = line;\n    return lineDiv;\n  };\n\n  return {\n    create: function(e) {\n      return {\n        elem: e,\n        code: \"\",\n        format: function() {\n          this.code = this.elem.innerText;\n          if (this.code[this.code.length - 1] != '\\n') this.code += '\\n';\n          var lines = this.code.split('\\n').map(makeLine);\n          this.elem.innerHTML = \"\";\n          for (var i = 0; i < lines.length; i++) {\n            this.elem.appendChild(lines[i]);\n          }\n        }   \n      };\n    }\n  };\n}());\n\n\n//# sourceURL=webpack:///./lib/editable.js?");

/***/ }),

/***/ "./lib/io.js":
/*!*******************!*\
  !*** ./lib/io.js ***!
  \*******************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = (function() {\n  'use strict';\n\n  var openInputString = function(s) {\n    var pos = 0;\n    var len = s.length;\n    var read = function() {\n      if (pos === len) return null;\n      return s[pos++];\n    };\n\n    return {\n      read: read\n    };\n  };\n\n  var openOutputString = function() {\n    var _output = \"\";\n    var output = function() {\n      return _output;\n    };\n    var write = function(s) {\n      _output += s;\n    };\n\n    return {\n      output: output,\n      write: write\n    };\n  };\n\n  return {\n    openInputString: openInputString,\n    openOutputString: openOutputString\n  };\n}());\n\n\n//# sourceURL=webpack:///./lib/io.js?");

/***/ }),

/***/ "./lib/machine.js":
/*!************************!*\
  !*** ./lib/machine.js ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = (function() {\n  'use strict';\n\n  var newState = function(jumpPairs, input, output) {\n    var table = {};\n    for (var i = 0; i < jumpPairs.length; i++) {\n      table[jumpPairs[i][0]] = jumpPairs[i][1];\n    }\n    var read = function() {\n      var read = input.read();\n      if (read === null) {\n        table.$in = \"\";\n        table.$eof = \"1\";\n      } else {\n        table.$in = read;\n        table.$eof = \"0\";\n      }\n    };\n    var write = function() {\n      output.write(table.$out);\n    };\n    return {\n      type: \"state\",\n      table: table,\n      running: true,\n      read: read,\n      write: write\n    };\n  };\n\n  var concat = function(keys) {\n    return keys.filter(function(e) {\n      return e.length > 0;\n    }).reduce(function(prev, curr) {\n      return prev + curr;\n    }, \"\");\n  };\n\n  var lookup = function(state, key) {\n    if (key === \"$in\") {\n      state.read();\n    }\n    if (state.table.hasOwnProperty(key)) {\n      return state.table[key];\n    } else {\n      state.running = false;\n      return null;\n    }\n  };\n\n  var update = function(state, key, value) {\n    state.table[key] = value;\n    if (key === \"$out\") {\n      state.write();\n    }\n  };\n\n  var resolve = function(state, key) {\n    var resolveKey = function(k) {\n      if (k.hasOwnProperty(\"type\") && k.type === \"reference\") {\n        return lookup(state, resolve(state, k.key));\n      } else if (k.constructor === Array) {\n        return resolve(state, k);\n      } else {\n        return k;\n      }\n    };\n\n    var resolveInner = function(ks) {\n      if (ks.length === 0) {\n        return [];\n      } else {\n        var first = resolveKey(ks[0]);\n        if (first === null) {\n          return [];\n        }\n        var rest = resolveInner(ks.slice(1));\n        rest.unshift(first);\n        return rest;\n      }\n    };\n\n    return concat(resolveInner(key));\n  };\n\n  var makeExecutor = function(cb) {\n    return function(state, inst) {\n      var key = resolve(state, inst.key[0].key);\n      var val = resolve(state, inst.val);\n      if (cb) {\n        cb(key, val);\n      }\n      update(state, key, val);\n    };\n  };\n\n  var run = function(instructions, input, output, cb) {\n    var hashed;\n    var executeInstr = makeExecutor(cb);\n\n    var runMachine = function() {\n      var getInstruction = function(i) {\n        if (hashed.hasOwnProperty(i)) {\n          return hashed[i];\n        } else {\n          return null;\n        }\n      };\n\n      var step = function(state, i) {\n        var inst = getInstruction(i);\n        if (inst === null) {\n          state.running = false;\n          return state;\n        }\n\n        var executeNext = function() {\n          executeInstr(state, inst);\n          var next = lookup(state, concat([\"next\", i]));\n          update(state, \"$pc\", next);\n          if (cb) {\n            return {\n              state: state,\n              step: function(state) {\n                return step(state, next);\n              }\n            };\n          } else {\n            return step(state, next);\n          }\n        };\n\n        if (state.running) {          \n          return executeNext();\n        } else {\n          return state;\n        }\n      };\n\n      var init = function(state) {\n        if (instructions !== undefined && instructions.length > 0) {\n          var firstInstruction = instructions[0].index;\n          update(state, \"$pc\", firstInstruction);\n          if (cb) {\n            return {\n              state: state,\n              step: function(state) {\n                return step(state, firstInstruction);\n              }\n            };\n          } else {\n            return step(state, firstInstruction);          \n          }\n        } else {\n          return null;\n        }\n      };\n\n      return init;\n    };\n\n    var start = function() {\n      if (instructions === undefined || instructions.length === 0) {\n        return {\n          type: \"state\",\n          table: {},\n          running: false\n        };\n      }\n      var jumps = makeJumps(instructions);\n      var state = newState(jumps, input, output);\n\n      hashed = {};\n      for (var i = 0; i < instructions.length; i++) {\n        var inst = instructions[i];\n        hashed[inst.index] = inst;\n      }\n\n      return runMachine()(state);\n    };\n\n    return start();\n  };\n\n  var makeJumps = function(instructions) {\n    if (instructions === undefined || instructions.length === 1) {\n      return [];\n    } else {\n      var i = concat([\"next\", instructions[0].index]);\n      var j = instructions[1].index;\n      var jumps = makeJumps(instructions.slice(1));\n      jumps.unshift([i, j]);\n      return jumps;\n    }\n  };\n\n  return {\n    run: run\n  };\n}());\n\n\n//# sourceURL=webpack:///./lib/machine.js?");

/***/ }),

/***/ "./lib/parse.js":
/*!**********************!*\
  !*** ./lib/parse.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = (function() {\n  'use strict';\n\n  var Parse = {};\n\n  var Tokens = Parse.Tokens = {\n    NEWLINE: \"NEWLINE\",\n    LBR: \"LEFT BRACKET\",\n    RBR: \"RIGHT BRACKET\",\n    EQ: \"EQUALS\",\n    COMMENT: \"COMMENT\",\n    ID: \"IDENTIFIER\",\n    STRINGLIT: \"STRING LITERAL\",\n    EOF: \"EOF\"\n  };\n\n  // Given an input string, return a generator of tokens Will continue\n  // to generate EOF after the input is fully lexed.\n  Parse.lexer = function(input) {\n    var len = input.length;\n    var currentPos = 0;\n\n    var peek = function(i) {\n      if (i >= len) {\n        return Tokens.EOF;\n      } else {\n        return input[i];\n      }\n    };\n\n    var escapeChars = function(s) {\n      if (s.length === 0) {\n        return s;\n      } else if (s[0] === '\\\\') {\n        if (s[1] === 'n') {\n          return '\\n' + escapeChars(s.substring(2));\n        } else if (s[1] === 't') {\n          return '\\t' + escapeChars(s.substring(2));\n        } else if (s[1] === '\"' || s[1] === '\\\\') {\n          return s[1] + escapeChars(s.substring(2));\n        } else {\n          return s[0] + escapeChars(s.substring(1));\n        }\n      } else {\n        return s[0] + escapeChars(s.substring(1));\n      }\n    };\n\n    var getStringLiteral = function() {\n      var escaping = false;\n      currentPos++;\n      var start = currentPos;\n      var p = peek(currentPos);\n      while (p !== Tokens.EOF && !(p === '\"' && !escaping)) {\n        escaping = (p === '\\\\');\n        currentPos++;\n        p = peek(currentPos);\n      }\n      if (p === Tokens.EOF) {\n        throw \"Syntax error\";\n      }\n      currentPos++;\n      var s = input.substring(start, currentPos - 1);\n      return escapeChars(s);\n    };\n\n    var getIdentifier = function() {\n      var start = currentPos;\n      var p = peek(currentPos);\n      var excluded = ['\\n', '\\t', ' ', '[', ']', '=', Tokens.EOF];\n      while (excluded.indexOf(p) === -1) {\n        currentPos++;\n        p = peek(currentPos);\n      }\n      return input.substring(start, currentPos);\n    };\n\n    var getToken = function() {\n      switch (peek(currentPos)) {\n      case Tokens.EOF:\n        return Tokens.EOF;\n      case '\\t':\n        currentPos++;\n        return getToken();\n      case ' ':\n        currentPos++;\n        return getToken();\n      case '\\n':\n        currentPos++;\n        return Tokens.NEWLINE;\n      case '[':\n        currentPos++;\n        return Tokens.LBR;\n      case ']':\n        currentPos++;\n        return Tokens.RBR;\n      case '=':\n        currentPos++;\n        return Tokens.EQ;\n      case ';':\n        var p = peek(currentPos);\n        while (p != '\\n') {\n          if (p === Tokens.EOF) {\n            throw \"Expected newline\";\n          } else {\n            currentPos++;\n            p = peek(currentPos);\n          }\n        }\n        currentPos++;\n        return Tokens.COMMENT;\n      case '\"':\n        var lit = getStringLiteral();\n        return [Tokens.STRINGLIT, lit];\n      default:\n        var id = getIdentifier();\n        return [Tokens.ID, id];\n      }\n    };\n    return getToken;\n  };\n\n  // Given a token generator (made via lexer()), returns a function of\n  // no arguments that, when called, returns a valid parse (a list of\n  // parsed expressions), if there is one\n  Parse.parser = function(getToken) {\n    var currentToken = getToken();\n    var currentLine = 1;\n\n    var nextToken = function() {\n      currentToken = getToken();\n    };\n\n    // program: null | line program\n    var program = function() {\n      if (currentToken !== Tokens.EOF) {\n        var nextLine = line();\n        return nextLine.concat(program());\n      } else {\n        return [];\n      }\n    };\n\n    // line: comment | newline | stmt newline | stmt comment\n    var line = function() {\n      if (currentToken === Tokens.COMMENT) {\n        nextToken();\n        currentLine++;\n        return [];\n      } else if (currentToken === Tokens.NEWLINE) {\n        nextToken();\n        currentLine++;\n        return [];\n      } else {\n        var nextStmt = stmt();\n        if (currentToken === Tokens.COMMENT ||\n            currentToken === Tokens.NEWLINE)\n        {\n          nextToken();\n          currentLine++;\n          return [nextStmt];\n        } else {\n          throw \"Parse error -- line expected a COMMENT or NEWLINE\";\n        }\n      }\n    };\n\n    // stmt: lookup EQ expr\n    var stmt = function() {\n      if (currentToken === Tokens.LBR) {\n        var nextLookup = lookup();\n        if (currentToken === Tokens.EQ) {\n          nextToken();\n          var nextExpr = expr();\n          return {\n            type: \"instruction\",\n            index: currentLine.toString(),\n            key: nextLookup,\n            val: nextExpr\n          };\n        } else {\n          throw \"Parse error -- stmt expected EQ\";\n        }\n      } else {\n        throw \"Parse error -- stmt expected LBR\";\n      }\n    };\n\n    // expr: null | ID expr | lookup expr | stringlit expr\n    var expr = function() {\n      if (currentToken[0] === Tokens.ID) {\n        var id = [currentToken[1]];\n        nextToken();\n        if (currentToken[0] === Tokens.ID ||\n            currentToken === Tokens.LBR ||\n            currentToken[0] === Tokens.STRINGLIT)\n        {\n          return id.concat(expr());\n        } else {\n          return id;\n        }\n      } else if (currentToken === Tokens.LBR) {\n        var nextLookup = lookup();\n        if (currentToken[0] === Tokens.ID ||\n            currentToken === Tokens.LBR ||\n            currentToken[0] === Tokens.STRINGLIT)\n        {\n          return nextLookup.concat(expr());\n        } else {\n          return nextLookup;\n        }\n      } else if (currentToken[0] === Tokens.STRINGLIT) {\n        var lit = [currentToken[1]];\n        nextToken();\n        if (currentToken[0] === Tokens.ID ||\n            currentToken === Tokens.LBR ||\n            currentToken[0] === Tokens.STRINGLIT)\n        {\n          return lit.concat(expr());\n        } else {\n          return lit;\n        }\n      } else {\n        throw \"Parse error -- expr expected an ID, LBR, or STRINGLIT\";\n      }\n    };\n\n    // lookup: [ expr ]\n    var lookup = function() {\n      if (currentToken === Tokens.LBR) {\n        nextToken();\n        var nextExpr = expr();\n        if (currentToken === Tokens.RBR) {\n          nextToken();\n          return [{\n            type: \"reference\",\n            key: nextExpr\n          }];\n        } else if (currentToken[0] === Tokens.ID) {\n          var res = nextExpr.concat(expr());\n          if (currentToken === Tokens.RBR) {\n            nextToken();\n            return res;\n          } else {\n            throw \"Parse error -- lookup expected a RBR\";\n          }\n        } else {\n          throw \"Parse error -- lookup expected a RBR or ID\";\n        }\n      } else {\n        throw \"Parse error -- lookup expected a LBR\";\n      }\n    };\n\n    return program;\n  };\n\n  return Parse;\n}());\n\n\n//# sourceURL=webpack:///./lib/parse.js?");

/***/ }),

/***/ "./lib/presenter.js":
/*!**************************!*\
  !*** ./lib/presenter.js ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("var Parse = __webpack_require__(/*! ./parse.js */ \"./lib/parse.js\");\nvar Machine = __webpack_require__(/*! ./machine.js */ \"./lib/machine.js\");\n\nmodule.exports = (function() {\n  'use strict';\n\n  return {\n    Create: function(view) {\n      var m = null;\n      var delay = 0;\n      var breaks = {};\n      var running = false;\n      return {\n        start: function() {\n          view.clear();\n          var code = view.getCode();\n          var parsed = Parse.parser(Parse.lexer(code))();\n          m = Machine.run(parsed, view.getInput(), view.getOutput(), view.update);\n          if (m.state !== undefined) {\n            var table = m.state.table;\n            for (var key in table) {\n              view.update(key, table[key]);\n            }\n          }\n        },\n        step: function() {\n          if (!view.isLocked()) {\n            this.start();\n          }\n          view.update(\"$pc\", m.state.table.$pc);\n          m = m.step(m.state);\n        },\n        run: function() {\n          if (!view.isLocked()) {\n            this.start();\n          }\n          this.running = true;\n          this.continue();\n        },\n        continue: function() {\n          if (this.running) {\n            if (delay) {\n              if (m.state.running && !(m.state.table.$pc in breaks)) {\n                this.step();\n              }\n              if (!m.state.running || m.state.table.$pc in breaks) {\n                this.running = false;\n              } else {\n                setTimeout(this.continue.bind(this), delay);\n              }\n              delete breaks[m.state.table.$pc];\n            } else {\n              while (m.state.running && !(m.state.table.$pc in breaks)) {\n                this.step();\n              }\n              delete breaks[m.state.table.$pc];\n              this.running = false;\n            }\n          }\n        },\n        stop: function() {\n          this.running = false;\n        },\n        addBreakpoint: function(inst) {\n          breaks[inst] = true;\n        },\n        removeBreakpoint: function(inst) {\n          delete breaks[inst];\n        },\n        setDelay: function(d) {\n          delay = d;\n        }\n      };\n    },\n    Bind: function(view, presenter) {\n      view.bind(presenter);\n    }\n  };\n}());\n\n\n//# sourceURL=webpack:///./lib/presenter.js?");

/***/ }),

/***/ "./lib/view.js":
/*!*********************!*\
  !*** ./lib/view.js ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("module.exports = (function() {\n  'use strict';\n\n  var IO = __webpack_require__(/*! ./io */ \"./lib/io.js\");\n  var Editable = __webpack_require__(/*! ./editable */ \"./lib/editable.js\");\n\n  var updateEntry = function(key, val) {\n    var old = document.getElementById(\"table-\" + key);\n    if (old !== null) {\n      old.parentNode.removeChild(old);\n    }\n    var result = document.getElementById(\"result\");\n    var div = document.createElement(\"div\");\n    div.className = \"row\";\n    div.setAttribute(\"id\", \"table-\" + key);\n    var k = document.createElement(\"input\");\n    k.setAttribute(\"type\", \"text\");\n    k.value = key;\n    var v = document.createElement(\"input\");\n    v.setAttribute(\"type\", \"text\");\n    v.value = val;\n    div.appendChild(k);\n    div.appendChild(v);\n    result.insertBefore(div, result.querySelector(\".row\"));\n  };\n\n  var updatePC = function(val) {\n    document.getElementById(\"pc\").value = val;\n  };\n\n  var deleteChildren = function(root) {\n    while (root.firstChild) {\n      root.removeChild(root.firstChild);\n    }\n  };\n\n  return {\n    Create: function(root) {\n      var locked = false;\n      var edit = Editable.create(root.querySelector(\"#code\"));\n      var outputElem = root.querySelector(\"#output\");\n      var _lastLine = document.createElement(\"pre\");\n      var inputText;\n      outputElem.appendChild(_lastLine);\n\n      return {\n        bind: function(presenter) {\n          root.querySelector(\"#restart\").onclick = presenter.start.bind(presenter);\n          root.querySelector(\"#step\").onclick = presenter.step.bind(presenter);\n          root.querySelector(\"#run\").onclick = presenter.run.bind(presenter);\n          root.querySelector(\"#edit\").onclick = this.unlock;\n          root.querySelector(\"#stop\").onclick = presenter.stop.bind(presenter);\n        },\n        clear: function() {\n          var rows = root.querySelectorAll(\".row\");\n          for (var i = 0; i < rows.length; i++) {\n            rows[i].parentNode.removeChild(rows[i]);\n          }\n          while (outputElem.firstChild) {\n            outputElem.removeChild(outputElem.firstChild);\n          }\n          _lastLine = document.createElement(\"pre\");\n          outputElem.appendChild(_lastLine);\n        },\n        update: function(key, val) {\n          if (key === \"$pc\") {\n            updatePC(val);\n          } else {\n            updateEntry(key, val);\n          }\n        },\n        getCode: function() {\n          if (!this.isLocked()) {\n            this.lock();\n          }\n          return edit.code;\n        },\n        isLocked: function() {\n          return locked;\n        },\n        lock: function() {\n          root.querySelector(\"#code\").setAttribute(\"contentEditable\", \"false\");\n          root.querySelector(\"#input\").setAttribute(\"contentEditable\", \"false\");\n          edit.format();\n          this.getInput();\n          locked = true;\n        },\n        unlock: function() {\n          root.querySelector(\"#code\").setAttribute(\"contentEditable\", \"true\");\n          root.querySelector(\"#input\").setAttribute(\"contentEditable\", \"true\");\n          locked = false;\n        },\n        getInput: function() {\n          if (!this.locked) {\n            inputText = IO.openInputString(root.querySelector(\"#input\").innerText);\n          };\n          return inputText;\n        },\n        getOutput: function() {\n          return {\n            output: function() {\n              return outputElem.innerText;\n            },\n            write: function(s) {\n              var lines = s.split('\\n');\n              if (lines.length === 0) return;\n              _lastLine.innerText += lines[0];\n              for (var i = 1; i < lines.length; i++) {\n                _lastLine = document.createElement(\"pre\");\n                outputElem.appendChild(_lastLine);\n                _lastLine.innerText = lines[i];\n              }\n              outputElem.scrollTop = outputElem.scrollHeight;\n            }\n          };\n        }\n      };\n    }\n  };\n}());\n\n\n//# sourceURL=webpack:///./lib/view.js?");

/***/ }),

/***/ "./main.js":
/*!*****************!*\
  !*** ./main.js ***!
  \*****************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("var IO = __webpack_require__(/*! ./lib/io.js */ \"./lib/io.js\");\nvar Parse = __webpack_require__(/*! ./lib/parse.js */ \"./lib/parse.js\");\nvar Machine = __webpack_require__(/*! ./lib/machine.js */ \"./lib/machine.js\");\nvar Presenter = __webpack_require__(/*! ./lib/presenter.js */ \"./lib/presenter.js\");\nvar View = __webpack_require__(/*! ./lib/view.js */ \"./lib/view.js\");\n\nvar root = document.getElementById(\"root\");\nvar v = View.Create(root);\nvar p = Presenter.Create(v);\np.setDelay(10);\nPresenter.Bind(v, p);\n\n\n\n//# sourceURL=webpack:///./main.js?");

/***/ })

/******/ });