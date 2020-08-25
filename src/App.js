import React from 'react';
import './App.css';
import useSavedState from './useSavedState';
import HashMapDatabase from './database.hashmap.js';
import { parseStyle } from './Style';
import { renderMap } from './render';
import { rulesToQuery, runQuery } from './Overpass';
import { useDebounce } from './useDebounce';

/** @typedef {import("./Overpass").NodeDatabase} NodeDatabase */

function App() {
  const [ style, setStyle ] = useSavedState("USER_STYLE", "node[amenity=post_box] {\n\tfill: black;\n\tsize: 2;\n}");
  const debouncedStyle = useDebounce(style, 1000);
  const [ query, setQuery ] = React.useState("");
  const debouncedQuery = useDebounce(query, 5000);
  const [ bbox, setBbox ] = useSavedState("USER_BBOX", "7.0,50.6,7.3,50.8");
  const [ result, setResult ] = React.useState(null);
  /** @type {React.MutableRefObject<HTMLCanvasElement>} */
  const canvasRef = React.useRef();
  /** @type {React.MutableRefObject<NodeDatabase>} */
  const databaseRef = React.useRef();
  const [ fetching, setFetching ] = React.useState(false);

  if (!databaseRef.current) {
    databaseRef.current = new HashMapDatabase();
  }
  
  const parsedStyle = React.useMemo(() => parseStyle(debouncedStyle), [debouncedStyle]);
  
  // Render map when bbox, result or style change
  React.useEffect(() => {
    renderMap(bbox, result, canvasRef, parsedStyle, databaseRef.current);
  }, [bbox, result, parsedStyle]);
  
  // Update query when style changes
  React.useEffect(() => {
    const query = rulesToQuery(parsedStyle);
    setQuery(query);
  }, [parsedStyle]);

  // Auto render
  React.useEffect(fetchHandler, [debouncedQuery, bbox]);

  function fetchHandler () {
    if (debouncedQuery) {
      setFetching(true);
      runQuery(debouncedQuery, bbox).then(r => {
        setResult(r);
        
        databaseRef.current.saveNodes(r.elements.filter(r => r.type === "node"));
      }, console.log).then(() => setFetching(false));
    }
  }

  return (
    <div className="App">
      <div className="sidebar">
        <label>Bounding Box <input value={bbox} onChange={e => setBbox(e.target.value)} /></label>
        <label>Style <textarea value={style} onChange={e => setStyle(e.target.value)} /></label>
        { fetching ? 
          <p>Fetching...</p> :
          <button onClick={fetchHandler}>Fetch</button>
        }
        { result && <p>{result.elements.length} Elements</p> }  
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default App;
