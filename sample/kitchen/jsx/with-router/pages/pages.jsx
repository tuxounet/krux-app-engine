import * as ReactRouterDOM from "react-router-dom";
export function PageA() {
  return (
    <div>
      <h1>A</h1>
      <ReactRouterDOM.Link to="/b">Go B</ReactRouterDOM.Link>
      <ReactRouterDOM.Link to="/b/sub 1">Go B sub</ReactRouterDOM.Link>
      <ReactRouterDOM.Link to="/b/sub 2">Go B sub</ReactRouterDOM.Link>
      <ReactRouterDOM.Link to="/">Go index</ReactRouterDOM.Link>
    </div>
  );
}

export function PageB(props) {
  const history = ReactRouterDOM.useHistory();

  return (
    <div>
      <h1>B {location.pathname}</h1>
      <ReactRouterDOM.Link to="/a">Go A</ReactRouterDOM.Link>
      <ReactRouterDOM.Link to="/">Go index</ReactRouterDOM.Link>
      <button
        onClick={() => {
          history.push("/a");
        }}
      >
        Code nav
      </button>
    </div>
  );
}

export function PageIndex() {
  return (
    <div>
      <h1>Index</h1>
      <ReactRouterDOM.Link to="/a">Go A</ReactRouterDOM.Link>
    </div>
  );
}
