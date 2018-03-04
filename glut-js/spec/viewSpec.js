var View = require("../lib/view.js");

module.exports = function() {
  describe("View", function() {
    var html = document.getElementsByTagName("html")[0];

    beforeEach(function() {
      document.body.innerHTML = __html__['index.html'];
    });

    it("should add rows", function() {
      var v = View.Create(html);
      v.update("1", "2");
      expect(document.getElementById("table-1").childNodes[0].value).toEqual("1");
      expect(document.getElementById("table-1").childNodes[1].value).toEqual("2");
      v.update("3", "4");
      expect(document.getElementById("table-3").childNodes[0].value).toEqual("3");
      expect(document.getElementById("table-3").childNodes[1].value).toEqual("4");
    });

    it("should add new rows to the top", function() {
      var v = View.Create(html);
      v.update("1", "2");
      v.update("3", "4");
      var rows = document.querySelectorAll(".row");
      expect(rows[0].childNodes[0].value).toEqual("3");
    });

    it("should clear rows", function() {
      var v = View.Create(html);
      v.update("1", "2");
      v.update("3", "4");
      v.clear();
      expect(document.querySelectorAll(".row").length).toEqual(0);
    });
  });
};
