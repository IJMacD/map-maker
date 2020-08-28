import React from 'react';
import './App.css';
import useSavedState from './useSavedState';
import { parseStyle, expandRules } from './Style';
import { renderMap, clearMap } from './render';
import { Overpass } from './Overpass';
import { useDebounce } from './useDebounce';
import { isValid } from './bbox';

function App() {
  const [ style, setStyle ] = useSavedState("USER_STYLE", "node[amenity=post_box] {\n\tfill: black;\n\tsize: 2;\n}");
  const [ bbox, setBbox ] = useSavedState("USER_BBOX", "7.0,50.6,7.3,50.8");
  /** @type {React.MutableRefObject<HTMLCanvasElement>} */
  const canvasRef = React.useRef();
  /** @type {React.MutableRefObject<Overpass>} */
  const overpassRef = React.useRef();
  const [ fetching, setFetching ] = React.useState(false);
  const [ error, setError ] = React.useState("");

  if (!overpassRef.current) {
    overpassRef.current = new Overpass(bbox);
  }

  const debouncedBBox = useDebounce(bbox, 500);
  
  const debouncedStyle = useDebounce(style, 500);
  
  const parsedStyle = React.useMemo(() => parseStyle(debouncedStyle), [debouncedStyle]);

  React.useEffect(() => overpassRef.current.setBBox(debouncedBBox), [debouncedBBox]);
  
  // Refetch/Render map when bbox, or style change
  React.useEffect(() => {
    async function run () {
      if (!isValid(debouncedBBox)) return;

      setFetching(true);
      setError("");

      try {
        const rules = expandRules(parsedStyle.rules);
        const map = rules.map(rule => {
          return {
            rule,
            promise: overpassRef.current.getElements(rule.selector),
          }
        });

        clearMap(canvasRef);

        for (const item of map) {
          const elements = await item.promise;
          renderMap(debouncedBBox, elements, canvasRef, item.rule);
        }
      } catch (e) {
        setError("Error Fetching");
      } finally {
        setFetching(false);
      }
    }

    run();
  }, [debouncedBBox, parsedStyle]);

  return (
    <div className="App">
      <div className="sidebar">
        <label>Bounding Box <input value={bbox} onChange={e => setBbox(e.target.value)} /></label>
        <label>Style <textarea value={style} onChange={e => setStyle(e.target.value)} /></label>
        { fetching && <p>Fetching...</p> }
        { error && <p style={{color:"red"}}>{error}</p> }
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default App;
