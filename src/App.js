import React from 'react';
import './App.css';
import useSavedState from './useSavedState';
import Database from './database';

const API_ROOT = "https://lz4.overpass-api.de/api/interpreter"

function App() {
  const [ style, setStyle ] = useSavedState("USER_STYLE", "node[amenity=post_box] {\n\tfill: black;\n\tsize: 2;\n}");
  const [ query, setQuery ] = React.useState("[out:json][bbox];\nnode[amenity=post_box];\nout;");
  const [ bbox, setBbox ] = React.useState("7.0,50.6,7.3,50.8");
  const [ result, setResult ] = React.useState(null);
  /** @type {React.MutableRefObject<HTMLCanvasElement>} */
  const canvasRef = React.useRef();
  /** @type {React.MutableRefObject<Database>} */
  const databaseRef = React.useRef();

  if (!databaseRef.current) {
    databaseRef.current = new Database("OverlayElements");
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

/**
 * @param {{ rules: StyleRule[]; }} style
 */
function rulesToQuery(style) {
  const q = style.rules.length > 1 ?
    `(\n${style.rules.map(r => `${r.selector}${r.selector.type==="way"?";\n>":""}`).join(";\n")};\n);\n`
    : (
      style.rules.length > 0 ?
        style.rules[0].selector + ";\n"
        : ""
    );
  return `[out:json][bbox];\n${q}out;`;
}

/**
 * @param {string} bbox
 * @param {{ elements: OverpassElement[]; }} result
 * @param {React.MutableRefObject<HTMLCanvasElement>} canvasRef
 * @param {{ rules: StyleRule[]; }} style
 */
function renderMap(bbox, result, canvasRef, style, database) {
  const [minLon, minLat, maxLon, maxLat] = bbox.split(",").map(parseFloat);
  if (result && canvasRef.current && !isNaN(minLon) && !isNaN(minLat) && !isNaN(maxLon) && !isNaN(maxLat)) {
    const ctx = canvasRef.current.getContext("2d");
    const { clientWidth, clientHeight } = canvasRef.current;

    const width = clientWidth * devicePixelRatio;
    const height = clientHeight * devicePixelRatio;

    canvasRef.current.width = width;
    canvasRef.current.height = height;

    const xScale = width / (maxLon - minLon);
    const yScale = height / (maxLat - minLat);
    /** @type {(lon: number, lat: number) => [number, number]} */
    const pos = ((lon, lat) => [(lon - minLon) * xScale, height - (lat - minLat) * yScale]);

    for (const el of result.elements) {
      const rule = matchRule(style, el);
      
      if (rule) {
        if (el.type === "node") {
          ctx.fillStyle = rule.declarations["fill"];
          ctx.strokeStyle = rule.declarations["stroke"];
          ctx.lineWidth = +rule.declarations["stroke-width"];
            const r = +rule.declarations["size"];
            
            ctx.beginPath();
            ctx.ellipse(...pos(el.lon, el.lat), r, r, 0, 0, Math.PI * 2);
            rule.declarations["fill"] && ctx.fill();
            rule.declarations["stroke"] && ctx.stroke();
          }
          else if (el.type === "way") {
            database.getNodes(el.nodes).then(nodes => {
              ctx.strokeStyle = rule.declarations["stroke"];
              ctx.lineWidth = +rule.declarations["stroke-width"];
              ctx.beginPath();
              ctx.moveTo(...pos(nodes[0].lon, nodes[0].lat));
              for (let i = 1; i < nodes.length; i++) {
                ctx.lineTo(...pos(nodes[i].lon, nodes[i].lat));
              }
              ctx.stroke();
            });
          }
        }
    }

  }
}

/**
 * 
 * @param {{ rules: StyleRule[] }} style 
 * @param {OverpassElement} element 
 * @returns {StyleRule}
 */
function matchRule (style, element) {
  for (const rule of style.rules) {
    if (element.type !== rule.selector.type) continue;

    let match = true;

    for (const [key, value] of Object.entries(rule.selector.tags)) {
      if (!element.tags || element.tags[key] !== value) {
        match = false;
        break;
      }
    }

    if (match)  return rule;
  }
}

function runQuery(query, bbox) {
  const url = `${API_ROOT}?data=${query.replace(/\n/,"")}&bbox=${bbox}`;
  return fetch(url.toString()).then(r => r.json());
}

/**
 * @param {string} styleText
 * @returns {{ rules: StyleRule[] }}
 */
function parseStyle (styleText) {
  const re = /([^\s{}]+)\s*{([^{}]*)}/g;
  let match;
  const out = { rules: [] };

    while(match = re.exec(styleText)) {
    const declarations = {};
    
    match[2].split(";").map(s => s.trim()).filter(s => s).forEach(s => {
      const [ property, value ] = s.split(":").map(s => s.trim());
      declarations[property] = value;
    });

    out.rules.push({
      selector: StyleSelector.parse(match[1]),
      declarations,
    });
  }

  return out;
}

/**
 * @typedef {OverpassNodeElement|OverpassWayElement} OverpassElement
 */

/**
 * @typedef OverpassNodeElement
 * @property {number} id
 * @property {"node"} type
 * @property {number} lon
 * @property {number} lat
 * @property {{ [key: string]: string }} [tags]
 */

/**
 * @typedef OverpassWayElement
 * @property {number} id
 * @property {"way"} type
 * @property {number[]} nodes
 * @property {{ [key: string]: string }} [tags]
 */

/** 
 * @typedef StyleRule
 * @property {StyleSelector} selector
 * @property {{ [key: string]: string }} declarations
 */

class StyleSelector {
  /**
   * @param {string} type
   * @param {{ [key: string]: string }} tags
   */
  constructor (type, tags) {
    this.type = type;
    this.tags = tags;
  }

  toString () {
    return `${this.type}${Object.entries(this.tags).map(([k,v]) => `[${k}=${v}]`).join("")}`;
  }
}

StyleSelector.parse = function (text) {
  const re = /^(node|way|relation|area)/;
  const m = re.exec(text);

  if (!m) return null;

  const type = m[1];
  /** @type {{ [key: string]: string }} */
  const tags = {};

  text = text.substring(type.length);

  const re2 = /\[([^[\]=]+)=([^[\]=]+)\]/g;

  let m2;

  while (m2 = re2.exec(text)) {
    tags[m2[1]] = m2[2];
  }

  return new StyleSelector(type, tags);
}