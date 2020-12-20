import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import * as Presenter from "./glut/presenter";
import * as View from "./glut/view";

const root = document.getElementById("legacy_root");
const v = View.Create(root);
const p = Presenter.Create(v);
p.setDelay(10);
Presenter.Bind(v, p);

console.log(v);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
