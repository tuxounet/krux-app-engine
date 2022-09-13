import React, { useState } from "react";
import ReactRouterDOM from "react-router-dom";
import "../plop.css";
import { PageA, PageB, PageIndex } from "./pages/pages";
export default function App(props) {
  const [plop, setPlop] = useState(false);
  return (
    <ReactRouterDOM.HashRouter>
      <div className="box">
        <div className="content">
          <h1>Hello world {plop ? <span>':('</span> : <span>':)'</span>} </h1>
          <p>{props.date}</p>

          <button className="button" onClick={(e) => setPlop(!plop)}>
            UP
          </button>

          <ReactRouterDOM.Switch>
            <ReactRouterDOM.Route path={`/a`}>
              <PageA />
            </ReactRouterDOM.Route>
            <ReactRouterDOM.Route path={`/b`}>
              <PageB />
            </ReactRouterDOM.Route>
            <ReactRouterDOM.Route path={`/`}>
              <PageIndex />
            </ReactRouterDOM.Route>
          </ReactRouterDOM.Switch>
        </div>
      </div>
    </ReactRouterDOM.HashRouter>
  );
}
