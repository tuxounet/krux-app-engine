import React, { useState } from "react";
import { Test } from "./Test";
export function App() {
  const [plop, setPlop] = useState(false);
  return (
    <div className="box">
      <div className="content">
        <h1>Hello world ^^ {plop ? <span>hello</span> : <span>world</span>} </h1>
        <p></p>
        <Test />
        <button onClick={(e) => setPlop(!plop)}>Plop</button>
      </div>
    </div>
  );
} 