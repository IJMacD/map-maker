const API_ROOT = require("./const").API_ROOT;

export class Overpass {
    constructor (bbox) {
        /** @type {Map<string, Promise<OverpassElement[]>>} */
        this.elements = new Map();
        this.bbox = bbox;
    }

    setBBox (bbox) {
        this.bbox = bbox;
    }

    query (selector) {
        let query;
        if (selector.type==="way"||selector.type==="area") {
            query = `[out:json][bbox];\n(\n\t${selector};\n\t>;\n);\nout;`;
        } else {
            query = `[out:json][bbox];\n${selector};\nout;`;
        }
        const url = `${API_ROOT}?data=${query.replace(/\s/,"")}&bbox=${this.bbox}`;
        return fetch(url.toString()).then(r => r.ok ? r.json() : Promise.reject(r.status));
    }

    tryElements (selector) {
        return new Promise ((resolve, reject) => {
            this.query(selector).then(d => {
                resolve(d.elements);
            }, e => {
                if (e !== 429) reject("Bad Response");
                // Retry 1
                else setTimeout(() => {
                    this.query(selector).then(d => {
                        resolve(d.elements);
                    }, e => {
                        if (e !== 429) reject("Bad Response");
                        // Retry 2
                        else setTimeout(() => {
                            this.query(selector).then(d => {
                                resolve(d.elements);
                            }, reject);
                        }, 5000);
                    });
                }, 5000);
            });
        });
    }

    /**
     * @param {import("./Style").StyleSelector} selector
     * @returns {Promise<OverpassElement[]>}
     */
    getElements (selector) {
        const s = selector.toString();
        if (this.elements.has(s)) return this.elements.get(s);

        const p = this.tryElements(selector);
        
        this.elements.set(s, p);
        
        p.catch(() => this.elements.delete(s));

        return p;
    }
}

/** @typedef {import('./Style.js').StyleRule} StyleRule */

/**
 * @typedef {OverpassNodeElement|OverpassWayElement|OverpassAreaElement} OverpassElement
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
 * @typedef OverpassAreaElement
 * @property {number} id
 * @property {"area"} type
 * @property {number[]} nodes
 * @property {{ [key: string]: string }} [tags]
 */

/**
 * @typedef NodeDatabase
 * @property {(nodes: object[]) => void} saveNodes
 * @property {(id: number) => object} getNode
 * @property {(ids: number[]) => Promise<object[]>} getNodes
 */
