import React from 'react';
import './App.css';
import useSavedState from './hooks/useSavedState';
import useGeolocation from './hooks/useGeolocation';
import { useDebounce } from './hooks/useDebounce';
import { parseStyle, filterRules } from './Classes/Style';
import { Overpass } from './Classes/Overpass';
import CollisionSystem from './Classes/CollisionSystem';
import CanvasRender from './render/CanvasRender';
import SVGRender from './render/SVGRender';
import { makeBBox } from './util/bbox';
import Textarea from './Components/Textarea';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { Console } from 'app-console';
import { OverpassStatus } from './Components/OverpassStatus';

import 'app-console/dist/index.css';
import { MemorySource } from './ElementSources/MemorySource';
import { OverpassSource } from './ElementSources/OverpassSource';
import { DatabaseSource } from './ElementSources/DatabaseSource';
import { render } from './render/render';
import { useForceRender } from './hooks/useForceRender';
import { cleanup, cleanupPoint, interpolateBox, parseBBox } from './util/util';

function App() {
  const [ style, setStyle ] = useSavedState("USER_STYLE", "node[amenity=post_box] {\n\tfill: black;\n\tsize: 2;\n}");
  const [ centre, setCentre ] = useSavedState("USER_CENTRE", "7.1,50.7");
  const [ zoom, setZoom ] = useSavedState("USER_SCALE", 14);

  const current = useGeolocation();

  /** @type {React.MutableRefObject<HTMLCanvasElement?>} */
  const canvasRef = React.useRef(null);

  // /** @type {React.MutableRefObject<Overpass>} */
  // const overpassRef = React.useRef(new Overpass());

  /** @type {React.MutableRefObject<ElementSource>} */
  // @ts-ignore
  const elementSourceRef = React.useRef();

  if (!elementSourceRef.current) {
    const overpassSource = new OverpassSource();
    const databaseSource = new DatabaseSource(overpassSource);
    elementSourceRef.current = new MemorySource(databaseSource);
  }

  const [ status, setStatus ] = React.useState(/** @type {string?} */(null));
  const [ error, setError ] = React.useState("");
  const [ downloading, setDownloading ] = React.useState(false);
  const [ progress, setProgress ] = React.useState(0);

  const shellContextRef = React.useRef({
    executables: {
      "clear-cache": () => {
        // if (overpassRef.current) {
        //   overpassRef.current.clearCache(true);
        // }
      },
    },
  });
  const [ renderPending, forceRender ] = useForceRender();

  // Console side effects
  React.useEffect(() => {
    const { current: { executables } } = shellContextRef;
    executables.render = forceRender;
    executables.get = name => {
      if (name === "centre") return centre;
      if (name === "zoom") return zoom;
      if (name === "myPos") return `${current.coords.longitude},${current.coords.latitude}`;
      return void 0;
    };
    executables.set = (name, value) => {
      if (name === "centre") { setCentre(value); return true; }
      if (name === "zoom") { setZoom(value); return true; }
      return false;
    };
  }, [ forceRender, centre, zoom, setCentre, setZoom, current ]);

  const [ consoleVisible, showConsole ] = React.useState(false);

  const { clientWidth, clientHeight } = canvasRef.current || { clientWidth: 1100, clientHeight: 800 };

  const width = clientWidth;
  const height = clientHeight;

  const debouncedCentre = useDebounce(centre, 500);
  const debouncedZoom = useDebounce(zoom, 500);

  const bbox = React.useMemo(() => makeBBox(debouncedCentre.split(",").map(p => +p), debouncedZoom, [clientWidth, clientHeight]), [debouncedCentre, debouncedZoom, clientWidth, clientHeight]);

  const debouncedStyle = useDebounce(style, 500);

  const parsedStyle = React.useMemo(() => parseStyle(debouncedStyle), [debouncedStyle]);

  // React.useEffect(() => overpassRef.current.setBBox(bbox), [bbox]);

  /** @type {[number, number]} */
  const centrePoint = (debouncedCentre.split(",").map(p => +p));

  /** @type {MapContext} */
  const context = { centre: centrePoint, zoom: debouncedZoom, bbox, scale: devicePixelRatio, width, height };
  const rules = filterRules(parsedStyle.rules, context);

  React.useEffect(() => {
    /** @type {(e: KeyboardEvent) => void} */
    const callback = e => { e.key === "k" && e.ctrlKey && e.altKey && showConsole(!consoleVisible); }

    document.addEventListener("keyup", callback);

    return () => document.removeEventListener("keyup", callback);
  }, [consoleVisible]);

  /**
   * @param {React.MouseEvent<HTMLCanvasElement, MouseEvent>} e
   */
  function handleDoubleClick (e) {
    const { offsetX: x, offsetY: y, ctrlKey, shiftKey, altKey } = e.nativeEvent;

    // Flip client height so y-axis is negative
    // @ts-ignore
    const { x: lon, y: lat } = interpolateBox({ x, y }, [0, clientHeight, clientWidth, 0], parseBBox(bbox));
    setCentre(cleanupPoint(lon, lat));

    const dz = altKey ? 3 : 1;
    if (ctrlKey) setZoom(zoom + dz);
    else if (shiftKey) setZoom(zoom - dz);
  }

  if (rules.some(r => r.selector.type === "current")) {
    const { coords: { longitude, latitude } } = current || { coords: {} };
    context.current = { longitude, latitude };
  }

  // Refetch/Render map when bbox, or style change
  useDeepCompareEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const renderer = new CanvasRender(canvas);

    // Double pointer to update inside render function scope
    let current = { currentEffect: true };

    render(rules, elementSourceRef.current, renderer, context, setStatus, setError, setProgress, current);

    return () => { current.currentEffect = false; };
  }, [debouncedCentre, debouncedZoom, rules, context, renderPending]);

  /**
   * @param {number} dX
   * @param {number} dY
   */
  function move (dX, dY) {
    /** @type {[number, number]} */
    const centrePoint = (debouncedCentre.split(",").map(p => +p));
    const bb = bbox.split(",").map(p => +p);
    const stepSizeX = (bb[2] - bb[0]) / 2;
    const stepSizeY = (bb[3] - bb[1]) / 2;
    const newCentre = cleanupPoint(centrePoint[0] + dX * stepSizeX, centrePoint[1] + dY * stepSizeY);
    setCentre(newCentre);
  }

  /**
   * @param {string} type
   */
  function handleDownload (type) {
    if (!downloading) {
      setDownloading(true);
      const cb = () => setDownloading(false);
      if (type === "png") {
        if (canvasRef.current) {
          downloadPNG(canvasRef.current, cb);
        }
      } else {
        // downloadSVG(context, parsedStyle, overpassRef.current, cb);
      }
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
          <button onClick={() => handleDownload("png")} disabled={downloading}>⭳ PNG</button>
          <button onClick={() => handleDownload("svg")} disabled={downloading}>⭳ SVG</button>
        </div>
        <label>Centre <input value={centre} onChange={e => setCentre(e.target.value)} /></label>
        <label>Zoom <input type="number" value={zoom} onChange={e => setZoom(+e.target.value)} /></label>
        <Textarea value={style} onChange={setStyle} style={{flex:1}} spellCheck={false} />
        <div className="status-area">
          {/* <OverpassStatus overpass={overpassRef.current} rules={rules} /> */}
          { status && <p>{status}</p> }
          { progress > 0 && <progress value={progress} />}
          { error && <p style={{color:"red"}}>{error}</p> }
        </div>
        { consoleVisible && <Console context={shellContextRef.current} style={{ maxHeight: 200 }} /> }
      </div>
      <canvas ref={canvasRef} onDoubleClick={handleDoubleClick} />
    </div>
  );
}

export default App;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {() => void} [callback]
 */
function downloadPNG (canvas, callback) {
  canvas.toBlob(blob => {
    blobDownload(blob, "map.png");
    if (callback) callback();
  });
}

/**
 * @param {MapContext} context
 * @param {{ rules: (StyleRule|MediaQuery)[] }} style
 * @param {Overpass} overpass
 * @param {() => void} [callback]
 */
async function downloadSVG (context, style, overpass, callback) {
  const rules = filterRules(style.rules, context);

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
  blobDownload(blob, "map.svg");

  if (callback) callback();
}

function blobDownload (blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.download = filename;
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
