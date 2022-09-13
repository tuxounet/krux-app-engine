import React, { useState } from "react";
import "../plop.css";
export default function App(props) {
  const [plop, setPlop] = useState(false);
  return (
    <div className="box">
      <div className="content">
        <h1>Hello world {plop ? <span>':('</span> : <span>':)'</span>} </h1>
        <p>{props.date}</p>

        <button className="button" onClick={(e) => setPlop(!plop)}>UP</button>
      </div>
    </div>
  );
}
