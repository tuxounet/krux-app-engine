import React, { useState } from "react";
 
export default function App(props) {
  const [plop, setPlop] = useState(false);
  return (
    <div className="box">
      <div className="content">
        <h1>Hello world ^^ {plop ? <span>hello</span> : <span>world</span>} </h1>
        <p>{props.date}</p>
       
        <button onClick={(e) => setPlop(!plop)}>Plop</button>
      </div>
    </div>
  );
}
