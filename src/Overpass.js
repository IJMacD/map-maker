const API_ROOT = require("./const").API_ROOT;

/**
 * @param {{ rules: StyleRule[]; }} style
 */
export function rulesToQuery(style) {
    const q =
      `(\n${style.rules.map(r => r.selectors.map(s => 
        `${s}${s.type==="way"?";\n>":""}`
      )).flat().join(";\n")};\n);\n`;
    return `[out:json][bbox];\n${q}out;`;
}

export function runQuery(query, bbox) {
    const url = `${API_ROOT}?data=${query.replace(/\n/,"")}&bbox=${bbox}`;
    return fetch(url.toString()).then(r => r.ok ? r.json() : Promise.reject("Bad response"));
}

/** @typedef {import('./Style.js').StyleRule} StyleRule */

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
 * @typedef NodeDatabase
 * @property {(nodes: object[]) => void} saveNodes
 * @property {(id: number) => object} getNode
 * @property {(ids: number[]) => Promise<object[]>} getNodes
 */