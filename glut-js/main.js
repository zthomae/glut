var IO = require("./lib/io.js");
var Parse = require("./lib/parse.js");
var Machine = require("./lib/machine.js");
var Presenter = require("./lib/presenter.js");
var View = require("./lib/view.js");

var root = document.getElementById("root");
var v = View.Create(root);
var p = Presenter.Create(v);
p.setDelay(10);
Presenter.Bind(v, p);

