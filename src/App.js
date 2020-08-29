import React from 'react';
import './App.css';
import useSavedState from './useSavedState';
import { parseStyle, expandRules } from './Style';
import { renderMap, clearMap } from './render';
import { Overpass } from './Overpass';
import { useDebounce } from './useDebounce';
import { makeBBox } from './bbox';

function App() {
  const [ style, setStyle ] = useSavedState("USER_STYLE", "node[amenity=post_box] {\n\tfill: black;\n\tsize: 2;\n}");
  const [ centre, setCentre ] = useSavedState("USER_CENTRE", "7.1,50.7");
  const [ scale, setScale ] = useSavedState("USER_SCALE", 14);
  /** @type {React.MutableRefObject<HTMLCanvasElement>} */
  const canvasRef = React.useRef();
  /** @type {React.MutableRefObject<Overpass>} */
  const overpassRef = React.useRef();
  const [ fetching, setFetching ] = React.useState(false);
  const [ error, setError ] = React.useState("");

  const { clientWidth: width, clientHeight: height } = canvasRef.current || { clientWidth: 1000, clientHeight: 1000 };

  const debouncedCentre = useDebounce(centre, 500);
  const debouncedScale = useDebounce(scale, 500);

  const bbox = React.useMemo(() => makeBBox(debouncedCentre.split(",").map(p => +p), debouncedScale, [width, height]), [debouncedCentre, debouncedScale, width, height]);

  if (!overpassRef.current) {
    overpassRef.current = new Overpass(bbox);
  }
  
  const debouncedStyle = useDebounce(style, 500);
  
  const parsedStyle = React.useMemo(() => parseStyle(debouncedStyle), [debouncedStyle]);

  React.useEffect(() => overpassRef.current.setBBox(bbox), [bbox]);
  
  // Refetch/Render map when bbox, or style change
  React.useEffect(() => {
    async function run () {
      setFetching(true);
      setError("");

      try {
        const rules = expandRules(parsedStyle.rules);
        await overpassRef.current.preLoadElements(rules.map(r => r.selector));
        
        const map = rules.map(rule => {
          return {
            rule,
            promise: overpassRef.current.getElements(rule.selector),
          }
        });

        clearMap(canvasRef);

        /** @type {[number, number]} */
        const centrePoint = (debouncedCentre.split(",").map(p => +p));

        for (const item of map) {
          const elements = await item.promise;
          renderMap(centrePoint, debouncedScale, elements, canvasRef, item.rule);
        }
      } catch (e) {
        setError("Error Fetching");
      } finally {
        setFetching(false);
      }
    }

    run();
  }, [debouncedCentre, debouncedScale, parsedStyle]);

  return (
    <div className="App">
      <div className="sidebar">
        <label>Centre <input value={centre} onChange={e => setCentre(e.target.value)} /></label>
        <label>Scale <input type="number" value={scale} onChange={e => setScale(+e.target.value)} /></label>
        <label>Bounding Box <input value={bbox} readOnly /></label>
        <label>Style <textarea value={style} onChange={e => setStyle(e.target.value)} /></label>
        { fetching && <p>Loading...</p> }
        { error && <p style={{color:"red"}}>{error}</p> }
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default App;
