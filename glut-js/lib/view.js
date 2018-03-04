module.exports = (function() {
  'use strict';

  var IO = require('./io');
  var Editable = require('./editable');

  var updateEntry = function(key, val) {
    var old = document.getElementById("table-" + key);
    if (old !== null) {
      old.parentNode.removeChild(old);
    }
    var result = document.getElementById("result");
    var div = document.createElement("div");
    div.className = "row";
    div.setAttribute("id", "table-" + key);
    var k = document.createElement("input");
    k.setAttribute("type", "text");
    k.value = key;
    var v = document.createElement("input");
    v.setAttribute("type", "text");
    v.value = val;
    div.appendChild(k);
    div.appendChild(v);
    result.insertBefore(div, result.querySelector(".row"));
  };

  var updatePC = function(val) {
    document.getElementById("pc").value = val;
  };

  var deleteChildren = function(root) {
    while (root.firstChild) {
      root.removeChild(root.firstChild);
    }
  };

  return {
    Create: function(root) {
      var locked = false;
      var edit = Editable.create(root.querySelector("#code"));
      var outputElem = root.querySelector("#output");
      var _lastLine = document.createElement("pre");
      var inputText;
      outputElem.appendChild(_lastLine);

      return {
        bind: function(presenter) {
          root.querySelector("#restart").onclick = presenter.start.bind(presenter);
          root.querySelector("#step").onclick = presenter.step.bind(presenter);
          root.querySelector("#run").onclick = presenter.run.bind(presenter);
          root.querySelector("#edit").onclick = this.unlock;
          root.querySelector("#stop").onclick = presenter.stop.bind(presenter);
        },
        clear: function() {
          var rows = root.querySelectorAll(".row");
          for (var i = 0; i < rows.length; i++) {
            rows[i].parentNode.removeChild(rows[i]);
          }
          while (outputElem.firstChild) {
            outputElem.removeChild(outputElem.firstChild);
          }
          _lastLine = document.createElement("pre");
          outputElem.appendChild(_lastLine);
        },
        update: function(key, val) {
          if (key === "$pc") {
            updatePC(val);
          } else {
            updateEntry(key, val);
          }
        },
        getCode: function() {
          if (!this.isLocked()) {
            this.lock();
          }
          return edit.code;
        },
        isLocked: function() {
          return locked;
        },
        lock: function() {
          root.querySelector("#code").setAttribute("contentEditable", "false");
          root.querySelector("#input").setAttribute("contentEditable", "false");
          edit.format();
          this.getInput();
          locked = true;
        },
        unlock: function() {
          root.querySelector("#code").setAttribute("contentEditable", "true");
          root.querySelector("#input").setAttribute("contentEditable", "true");
          locked = false;
        },
        getInput: function() {
          if (!this.locked) {
            inputText = IO.openInputString(root.querySelector("#input").innerText);
          };
          return inputText;
        },
        getOutput: function() {
          return {
            output: function() {
              return outputElem.innerText;
            },
            write: function(s) {
              var lines = s.split('\n');
              if (lines.length === 0) return;
              _lastLine.innerText += lines[0];
              for (var i = 1; i < lines.length; i++) {
                _lastLine = document.createElement("pre");
                outputElem.appendChild(_lastLine);
                _lastLine.innerText = lines[i];
              }
              outputElem.scrollTop = outputElem.scrollHeight;
            }
          };
        }
      };
    }
  };
}());
