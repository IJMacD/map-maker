import React from 'react';
import './App.css';
import useSavedState from './useSavedState';
import { parseStyle, expandRules } from './Style';
import CanvasRender from './canvas-render';
import SVGRender from './svg-render';
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
  const [ downloading, setDownloading ] = React.useState(false);
  const [ progress, setProgress ] = React.useState(0);

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
    let currentEffect = true;

    async function run () {
      setStatus("Fetching...");
      setError("");

      try {
        const count = await overpassRef.current.preLoadElements(rules.map(r => r.selector));

        if (!currentEffect) return;

        // Check if we're already preloading something
        if (count < 0) return;

        if (count === 0)
          setStatus(`Rendering...`);
        else
          setStatus(`Rendering ${count} elements...`);

        const map = rules.map(rule => {
          return {
            rule,
            promise: overpassRef.current.getElements(rule.selector),
          }
        });

        CollisionSystem.getCollisionSystem().clear();

        if (canvasRef.current) {
          if (!currentEffect) return;

          const renderer = new CanvasRender(canvasRef.current);

          renderer.clear(context);

          let count = 0;

          for (const item of map) {
            const prefix = `${count++}/${map.length}`;
            setProgress(count/map.length);

            console.debug(`${prefix} Loading elements for ${item.rule.selector}`);
            const elements = await item.promise;

            if (!currentEffect) return;

            console.debug(`${prefix} Rendering ${item.rule.selector}`);

            renderer.renderRule(context, item.rule, elements);
          }
          setProgress(0);

          console.debug(`Rendered!`);
        }

        setStatus(null);
      } catch (e) {
        setError("Error Fetching");
        setStatus(null);
        console.log(e);
      }
    }

    run();

    return () => { currentEffect = false; };
  }, [debouncedCentre, debouncedZoom, rules, context]);

  function move (dX, dY) {
    /** @type {[number, number]} */
    const centrePoint = (debouncedCentre.split(",").map(p => +p));
    const bb = bbox.split(",").map(p => +p);
    const stepSizeX = (bb[2] - bb[0]) / 2;
    const stepSizeY = (bb[3] - bb[1]) / 2;
    const newCentre = [ cleanup(centrePoint[0] + dX * stepSizeX), cleanup(centrePoint[1] + dY * stepSizeY) ];
    setCentre(newCentre.join(","));
  }

  function handleDownload () {
    if (!downloading) {
      setDownloading(true);
      downloadSVG(context, parsedStyle, overpassRef.current, () => setDownloading(false));
    }
  }

  return (
    <div className="App">
      <div className="sidebar">
        <div className="controls">
          <button onClick={() => move(-1,0)}>⏴</button>
          <button onClick={() => move(1,0)}>⏵</button>
          <button onClick={() => move(0,1)}>⏶</button>
          <button onClick={() => move(0,-1)}>⏷</button>
          <button onClick={() => setZoom(+cleanup(zoom + 1))}>➕</button>
          <button onClick={() => setZoom(+cleanup(zoom - 1))}>➖</button>
          { current && <button onClick={() => setCentre(`${current.coords.longitude},${current.coords.latitude}`)}>📍</button> }
          <button onClick={handleDownload} disabled={downloading}>⭳</button>
        </div>
        <label>Centre <input value={centre} onChange={e => setCentre(e.target.value)} /></label>
        <label>Zoom <input type="number" value={zoom} onChange={e => setZoom(+e.target.value)} /></label>
        <Textarea value={style} onChange={setStyle} style={{flex:1}} spellCheck={false} />
        <div className="status-area">
          { status && <p>{status}</p> }
          { progress > 0 && <progress value={progress} />}
          { error && <p style={{color:"red"}}>{error}</p> }
        </div>
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default App;

async function downloadSVG (context, style, overpass, callback=null) {
  const rules = expandRules(style.rules, context);

  const map = rules.map(rule => {
    return {
      rule,
      promise: overpass.getElements(rule.selector),
    }
  });

  CollisionSystem.getCollisionSystem().clear();

  const svgRender = new SVGRender(context.width, context.height);

  for (const item of map) {
    const elements = await item.promise;
    svgRender.renderRule(context, item.rule, elements);
  }

  const blob = svgRender.toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.download = "map.svg";
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (callback) callback();
}

/**
 * @param {number} n
 */
function cleanup (n) {
  return n.toFixed(5).replace(/^0+|0+$/g, "");
}