import React from 'react';
import './App.css';
import useSavedState from './useSavedState';
import HashMapDatabase from './database.hashmap.js';
import { parseStyle } from './Style';
import { renderMap } from './render';
import { rulesToQuery, runQuery } from './Overpass';

/** @typedef {import("./Overpass").NodeDatabase} NodeDatabase */

function App() {
  const [ style, setStyle ] = useSavedState("USER_STYLE", "node[amenity=post_box] {\n\tfill: black;\n\tsize: 2;\n}");
  const [ query, setQuery ] = React.useState("[out:json][bbox];\nnode[amenity=post_box];\nout;");
  const [ bbox, setBbox ] = React.useState("7.0,50.6,7.3,50.8");
  const [ result, setResult ] = React.useState(null);
  /** @type {React.MutableRefObject<HTMLCanvasElement>} */
  const canvasRef = React.useRef();
  /** @type {React.MutableRefObject<NodeDatabase>} */
  const databaseRef = React.useRef();

  if (!databaseRef.current) {
    databaseRef.current = new HashMapDatabase();
  }
  
  const parsedStyle = React.useMemo(() => parseStyle(style), [style]);
  
  // Render map when bbox, result or style change
  React.useEffect(() => {
    renderMap(bbox, result, canvasRef, parsedStyle, databaseRef.current);
  }, [bbox, result, parsedStyle]);
  
  // Update query when style changes
  React.useEffect(() => {
    const query = rulesToQuery(parsedStyle);
    setQuery(query);
  }, [parsedStyle]);

  function fetchHandler () {
    runQuery(query, bbox).then(r => {
      setResult(r);
      
      databaseRef.current.saveNodes(r.elements.filter(r => r.type === "node"));
    });
  }

  return (
    <div className="App">
      <div className="sidebar">
        <label>Bounding Box <input value={bbox} onChange={e => setBbox(e.target.value)} /></label>
        <label>Style <textarea value={style} onChange={e => setStyle(e.target.value)} /></label>
        <label>Query <textarea value={query} onChange={e => setQuery(e.target.value)} /></label>
        <button onClick={fetchHandler}>Fetch</button>
        { result && <p>{result.elements.length} Elements</p> }  
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default App;
