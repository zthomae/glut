import * as IO from "./io";
import * as Parse from "./parse";
import * as Machine from "./machine";
import * as Presenter from "./presenter";
import * as View from "./view";

const root = document.getElementById("root");
const v = View.Create(root);
const p = Presenter.Create(v);
p.setDelay(10);
Presenter.Bind(v, p);
