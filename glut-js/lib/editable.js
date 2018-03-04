module.exports = (function() {
  'use strict';

  var makeLine = function(line, index) {
    var lineDiv = document.createElement("div");
    lineDiv.setAttribute("id", "line-" + (index + 1));
    lineDiv.innerText = line;
    return lineDiv;
  };

  return {
    create: function(e) {
      return {
        elem: e,
        code: "",
        format: function() {
          this.code = this.elem.innerText;
          if (this.code[this.code.length - 1] != '\n') this.code += '\n';
          var lines = this.code.split('\n').map(makeLine);
          this.elem.innerHTML = "";
          for (var i = 0; i < lines.length; i++) {
            this.elem.appendChild(lines[i]);
          }
        }   
      };
    }
  };
}());
