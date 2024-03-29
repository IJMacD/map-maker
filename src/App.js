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
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import { Console } from 'app-console';
import { OverpassStatus } from './Components/OverpassStatus';

import 'app-console/dist/index.css';
import 'prismjs/themes/prism.css';
import { MemorySource } from './ElementSources/MemorySource';
import { OverpassSource } from './ElementSources/OverpassSource';
import { DatabaseSource } from './ElementSources/DatabaseSource';
import { useForceRender } from './hooks/useForceRender';
import { numberToStableString, pointToStableString, reverseMercatorProjection } from './util/util';
import { MapCanvas } from './Components/MapCanvas';
import { CoastlineSource } from './ElementSources/CoastlineSource';

const defaultStyle = `way[natural=coastline] {
  stroke: grey;
}

way[highway] {
  stroke: black;
}`;

function App() {
  const [ style, setStyle ] = useSavedState("USER_STYLE", defaultStyle);
  const [ centre, setCentre ] = useSavedState("USER_CENTRE", "7.1,50.7");
  const [ zoom, setZoom ] = useSavedState("USER_SCALE", 14);

  const current = useGeolocation();

  /** @type {React.MutableRefObject<HTMLDivElement?>} */
  const containerRef = React.useRef(null);

  // /** @type {React.MutableRefObject<Overpass>} */
  // const overpassRef = React.useRef(new Overpass());

  /** @type {React.MutableRefObject<ElementSource>} */
  // @ts-ignore
  const elementSourceRef = React.useRef();

  if (!elementSourceRef.current) {
    const overpassSource = new OverpassSource();
    const coastlineSource = new CoastlineSource(overpassSource);
    const databaseSource = new DatabaseSource(coastlineSource);
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

  const { clientWidth: width, clientHeight: height } = containerRef.current || { clientWidth: 1100, clientHeight: 800 };

  const debouncedCentre = useDebounce(centre, 500);
  const debouncedZoom = useDebounce(zoom, 500);

  const debouncedStyle = useDebounce(style, 1000);

  const parsedStyle = React.useMemo(() => parseStyle(debouncedStyle), [debouncedStyle]);

  // React.useEffect(() => overpassRef.current.setBBox(bbox), [bbox]);

  /** @type {Point} */
  const centrePoint = (debouncedCentre.split(",").map(p => +p));

  /** @type {MapContext} */
  const context = { centre: centrePoint, zoom: debouncedZoom, scale: devicePixelRatio, width, height };

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

    const reverseprojection = reverseMercatorProjection(centrePoint, zoom, width, height);
    const [lon, lat] = reverseprojection(x, y);

    setCentre(pointToStableString(lon, lat));

    const dz = altKey ? 3 : 1;
    if (ctrlKey) setZoom(zoom + dz);
    else if (shiftKey) setZoom(zoom - dz);
  }

  // debounce in the morning!!!
  //
  //
  //
  // if (rules.some(r => r.selector.type === "current")) {
  //   const { coords: { longitude, latitude } } = current || { coords: {} };
  //   context.current = { longitude, latitude };
  // }


  /**
   * @param {number} dX
   * @param {number} dY
   */
  function move (dX, dY) {
    /** @type {[number, number]} */
    const centrePoint = (debouncedCentre.split(",").map(p => +p));
    const bbox = makeBBox(centrePoint, zoom, [width, height]);
    const bb = bbox.split(",").map(p => +p);
    const stepSizeX = (bb[2] - bb[0]) / 2;
    const stepSizeY = (bb[3] - bb[1]) / 2;
    const newCentre = pointToStableString(centrePoint[0] + dX * stepSizeX, centrePoint[1] + dY * stepSizeY);
    setCentre(newCentre);
  }

  /**
   * @param {string} type
   */
  function handleDownload (type) {
    // if (!downloading) {
    //   setDownloading(true);
    //   const cb = () => setDownloading(false);
    //   if (type === "png") {
    //     if (canvasRef.current) {
    //       downloadPNG(canvasRef.current, cb);
    //     }
    //   } else {
    //     // downloadSVG(context, parsedStyle, overpassRef.current, cb);
    //   }
    // }
  }

  return (
    <div className="App">
      <div className="sidebar">
        <div className="controls">
          <button onClick={() => move(-1,0)}>⏴</button>
          <button onClick={() => move(1,0)}>⏵</button>
          <button onClick={() => move(0,1)}>⏶</button>
          <button onClick={() => move(0,-1)}>⏷</button>
          <button onClick={() => setZoom(+numberToStableString(zoom + 1))}>➕</button>
          <button onClick={() => setZoom(+numberToStableString(zoom - 1))}>➖</button>
          { current && <button onClick={() => setCentre(`${current.coords.longitude},${current.coords.latitude}`)}>📍</button> }
          <button onClick={() => handleDownload("png")} disabled={downloading}>⭳ PNG</button>
          <button onClick={() => handleDownload("svg")} disabled={downloading}>⭳ SVG</button>
        </div>
        {/* { zoom >= 16 && <a href={`https://www.openstreetmap.org/edit?editor=id#map=${zoom}/${centrePoint[1]}/${centrePoint[0]}`} target="_blank">iD Editor</a> } */}
        <label>Centre <input value={centre} onChange={e => setCentre(e.target.value)} /></label>
        <label>Zoom <input type="number" value={zoom} onChange={e => setZoom(+e.target.value)} /></label>
        <div style={{flex:1,overflowY:"auto",width:400}}>
          <Editor value={style} onValueChange={setStyle} highlight={v => Prism.highlight(v, Prism.languages.css, "css")} padding={10} />
        </div>
        <div className="status-area">
          {/* <OverpassStatus overpass={overpassRef.current} rules={rules} /> */}
          { status && <p>{status}</p> }
          { progress > 0 && <progress value={progress} />}
          { error && <p style={{color:"red"}}>{error}</p> }
        </div>
        { consoleVisible && <Console context={shellContextRef.current} style={{ maxHeight: 200 }} /> }
      </div>
      <div ref={containerRef} className="MapContainer">
        <MapCanvas
          rules={rules}
          elementSource={elementSourceRef.current}
          centre={debouncedCentre}
          zoom={debouncedZoom}
          width={width}
          height={height}
          scale={devicePixelRatio}
          setStatus={setStatus}
          setProgress={setProgress}
          setError={setError}
          onDoubleClick={handleDoubleClick}
        />
      </div>
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
