const makeLine = (line, index) => {
  const lineDiv = document.createElement("div");
  lineDiv.setAttribute("id", "line-" + (index + 1));
  lineDiv.innerText = line;
  return lineDiv;
};

export const create = function(e) {
  return {
    elem: e,
    code: "",
    format: function() {
      this.code = this.elem.innerText;
      if (this.code[this.code.length - 1] !== "\n") {
        this.code += "\n";
      }
      const lines = this.code.split("\n").map(makeLine);
      this.elem.innerHTML = "";
      for (let i = 0; i < lines.length; i++) {
        this.elem.appendChild(lines[i]);
      }
    },
  };
}
