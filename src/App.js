import React from 'react';
import './App.css';
import useSavedState from './useSavedState';
import { parseStyle, expandRules } from './Style';
import { renderMap, clearMap } from './render';
import { Overpass } from './Overpass';
import { useDebounce } from './useDebounce';
import { makeBBox } from './bbox';
import useGeolocation from './useGeolocation';
import Textarea from './Textarea';
import useDeepCompareEffect from 'use-deep-compare-effect';

function App() {
  const [ style, setStyle ] = useSavedState("USER_STYLE", "node[amenity=post_box] {\n\tfill: black;\n\tsize: 2;\n}");
  const [ centre, setCentre ] = useSavedState("USER_CENTRE", "7.1,50.7");
  const [ scale, setScale ] = useSavedState("USER_SCALE", 14);
  const current = useGeolocation();
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
  useDeepCompareEffect(() => {
    async function run () {
      setFetching(true);
      setError("");

      try {
        const context = { zoom: debouncedScale, current, width, height };
        const rules = expandRules(parsedStyle.rules, context);
        await overpassRef.current.preLoadElements(rules.map(r => r.selector));

        const map = rules.map(rule => {
          return {
            rule,
            promise: overpassRef.current.getElements(rule.selector),
          }
        });

        if (canvasRef.current) {
          clearMap(canvasRef.current);

          /** @type {[number, number]} */
          const centrePoint = (debouncedCentre.split(",").map(p => +p));

          for (const item of map) {
            const elements = await item.promise;
            renderMap(centrePoint, debouncedScale, elements, canvasRef.current, item.rule, context);
          }
        }
      } catch (e) {
        setError("Error Fetching");
        console.log(e);
      } finally {
        setFetching(false);
      }
    }

    run();
  }, [debouncedCentre, debouncedScale, parsedStyle, current]);

  function move (dX, dY) {
    /** @type {[number, number]} */
    const centrePoint = (debouncedCentre.split(",").map(p => +p));
    const stepSize = 360 / Math.pow(2, scale);
    const newCentre = [ centrePoint[0] + dX * stepSize, centrePoint[1] + dY * stepSize ];
    setCentre(newCentre.join(","));
  }

  return (
    <div className="App">
      <div className="sidebar">
        <div className="controls">
          <button onClick={() => move(-1,0)}>⏴</button>
          <button onClick={() => move(1,0)}>⏵</button>
          <button onClick={() => move(0,1)}>⏶</button>
          <button onClick={() => move(0,-1)}>⏷</button>
          <button onClick={() => setScale(scale + 1)}>➕</button>
          <button onClick={() => setScale(scale - 1)}>➖</button>
          { current && <button onClick={() => setCentre(`${current.coords.longitude},${current.coords.latitude}`)}>📍</button> }
        </div>
        <label>Centre <input value={centre} onChange={e => setCentre(e.target.value)} /></label>
        <label>Zoom <input type="number" value={scale} onChange={e => setScale(+e.target.value)} /></label>
        <Textarea value={style} onChange={setStyle} style={{flex:1}} spellCheck={false} />
        { fetching && <p>Loading...</p> }
        { error && <p style={{color:"red"}}>{error}</p> }
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default App;
