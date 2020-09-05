import React from 'react';
import './App.css';
import useSavedState from './useSavedState';
import { parseStyle, expandRules } from './Style';
import CanvasRender from './canvas-render';
import { Overpass } from './Overpass';
import { useDebounce } from './useDebounce';
import { makeBBox } from './bbox';
import useGeolocation from './useGeolocation';
import Textarea from './Textarea';
import useDeepCompareEffect from 'use-deep-compare-effect';
import CollisionSystem from './CollisionSystem';

function App() {
  const [ style, setStyle ] = useSavedState("USER_STYLE", "node[amenity=post_box] {\n\tfill: black;\n\tsize: 2;\n}");
  const [ centre, setCentre ] = useSavedState("USER_CENTRE", "7.1,50.7");
  const [ zoom, setZoom ] = useSavedState("USER_SCALE", 14);
  const current = useGeolocation();
  /** @type {React.MutableRefObject<HTMLCanvasElement>} */
  const canvasRef = React.useRef();
  /** @type {React.MutableRefObject<Overpass>} */
  const overpassRef = React.useRef();
  /** @type {[ string, (string) => void ]} */
  const [ status, setStatus ] = React.useState(null);
  const [ error, setError ] = React.useState("");

  const { clientWidth, clientHeight } = canvasRef.current || { clientWidth: 1000, clientHeight: 1000 };

  const width = clientWidth * devicePixelRatio;
  const height = clientHeight * devicePixelRatio;

  const debouncedCentre = useDebounce(centre, 500);
  const debouncedZoom = useDebounce(zoom, 500);

  const bbox = React.useMemo(() => makeBBox(debouncedCentre.split(",").map(p => +p), debouncedZoom, [clientWidth, clientHeight]), [debouncedCentre, debouncedZoom, clientWidth, clientHeight]);

  if (!overpassRef.current) {
    overpassRef.current = new Overpass(bbox);
  }

  const debouncedStyle = useDebounce(style, 500);

  const parsedStyle = React.useMemo(() => parseStyle(debouncedStyle), [debouncedStyle]);

  React.useEffect(() => overpassRef.current.setBBox(bbox), [bbox]);

  /** @type {[number, number]} */
  const centrePoint = (debouncedCentre.split(",").map(p => +p));

  const context = { centre: centrePoint, zoom: debouncedZoom, scale: devicePixelRatio, width, height };
  const rules = expandRules(parsedStyle.rules, context);

  if (rules.some(r => r.selector.type === "current")) {
    context.current = current;
  }

  // Refetch/Render map when bbox, or style change
  useDeepCompareEffect(() => {
    async function run () {
      setStatus("Fetching...");
      setError("");

      try {
        await overpassRef.current.preLoadElements(rules.map(r => r.selector));

        const map = rules.map(rule => {
          return {
            rule,
            promise: overpassRef.current.getElements(rule.selector),
          }
        });

        CollisionSystem.getCollisionSystem().clear();

        if (canvasRef.current) {

          const renderer = new CanvasRender(canvasRef.current);

          renderer.clear(context);

          for (const item of map) {
            const elements = await item.promise;
            renderer.renderRule(context, item.rule, elements);
          }
        }

        setStatus(null);
      } catch (e) {
        setError("Error Fetching");
        setStatus(null);
        console.log(e);
      }
    }

    run();
  }, [debouncedCentre, debouncedZoom, rules, context]);

  function move (dX, dY) {
    /** @type {[number, number]} */
    const centrePoint = (debouncedCentre.split(",").map(p => +p));
    const bb = bbox.split(",").map(p => +p);
    const stepSizeX = (bb[2] - bb[0]) / 2;
    const stepSizeY = (bb[3] - bb[1]) / 2;
    const newCentre = [ centrePoint[0] + dX * stepSizeX, centrePoint[1] + dY * stepSizeY ];
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
          <button onClick={() => setZoom(zoom + 1)}>➕</button>
          <button onClick={() => setZoom(zoom - 1)}>➖</button>
          { current && <button onClick={() => setCentre(`${current.coords.longitude},${current.coords.latitude}`)}>📍</button> }
        </div>
        <label>Centre <input value={centre} onChange={e => setCentre(e.target.value)} /></label>
        <label>Zoom <input type="number" value={zoom} onChange={e => setZoom(+e.target.value)} /></label>
        <Textarea value={style} onChange={setStyle} style={{flex:1}} spellCheck={false} />
        { status && <p>{status}</p> }
        { error && <p style={{color:"red"}}>{error}</p> }
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default App;
