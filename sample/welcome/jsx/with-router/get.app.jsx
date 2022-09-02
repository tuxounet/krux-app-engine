import React, { useState } from "react";
import ReactRouterDOM from "react-router-dom";
import "../plop.css";
export default function App(props) {
  const [plop, setPlop] = useState(false);
  return (
    <div className="box">
      <div className="content">
        <h1>Hello world {plop ? <span>':('</span> : <span>':)'</span>} </h1>
        <p>{props.date}</p>

        <button className="button" onClick={(e) => setPlop(!plop)}>
          UP
        </button>

        <ReactRouterDOM.HashRouter>
          <ul>
            <li>
              <ReactRouterDOM.Link to="/">Home</ReactRouterDOM.Link>
            </li>
            <li>
              <ReactRouterDOM.Link to="/login">Login</ReactRouterDOM.Link>
            </li>
            <li>
              <ReactRouterDOM.Link to="/register">Register</ReactRouterDOM.Link>
            </li>
          </ul>
        </ReactRouterDOM.HashRouter>
      </div>
    </div>
  );
}
