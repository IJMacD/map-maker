import IDBElementDatabase from "./database.idb";
import { contains } from "./bbox";

const API_ROOT = require("./const").API_ROOT;

const recurRe = /(way|rel(?:ation)?|area)/;

export class Overpass {
    constructor (bbox) {
        /** @type {Map<string, Promise<OverpassElement[]>>} */
        this.elements = new Map();
        this.bbox = bbox;
        this.database = new IDBElementDatabase();
    }

    setBBox (bbox) {
        // If the new bbox is completely contained within the
        // old one then we don't need to clear our cache
        if (!contains(this.bbox, bbox)) {
            this.elements.clear();
            this.bbox = bbox;
        }
    }

    query (selector) {
        let query;
        if (recurRe.test(selector.type)) {
            query = `[out:json][bbox];\n(\n\t${selector};\n\t>;\n);\nout;`;
        } else {
            query = `[out:json][bbox];\n${selector};\nout;`;
        }
        const url = `${API_ROOT}?data=${query.replace(/\s/,"")}&bbox=${this.bbox}`;
        return fetch(url.toString()).then(r => r.ok ? r.json() : Promise.reject(r.status));
    }

    tryElements (selector, tries=10) {
        return new Promise ((resolve, reject) => {
            this.query(selector).then(d => {
                resolve(d.elements);
            }, e => {
                if (e !== 429) reject("Bad Response");
                else if (tries > 0) {
                    setTimeout(() => {
                        this.tryElements(selector, tries - 1).then(resolve, reject);
                    }, 10000);
                }
                else reject(e);
            });
        });
    }

    /**
     * @param {import("./Style").StyleSelector} selector
     * @returns {Promise<OverpassElement[]>}
     */
    async getElements (selector) {
        const s = selector.toString();
        if (this.elements.has(s)) return this.elements.get(s);

        const dbResult = await this.database.getElements(this.bbox, selector.toString());

        if (dbResult) {
            const { elements } = dbResult;
            this.elements.set(s, Promise.resolve(elements));
            return elements;
        }

        const dbSearchResult = await this.database.searchElements(this.bbox, selector.toString());

        if (dbSearchResult) {
            const { elements } = dbSearchResult;
            this.elements.set(s, Promise.resolve(elements));
            return elements;
        }

        const p = this.tryElements(selector);
        
        this.elements.set(s, p);
        
        p.catch(() => this.elements.delete(s));

        p.then(elements => {
            this.database.saveElements(this.bbox, selector.toString(), { elements, cached: Date.now() });
        });

        return p;
    }
}

/** @typedef {import('./Style.js').StyleRule} StyleRule */

/**
 * @typedef {OverpassNodeElement|OverpassWayElement|OverpassAreaElement|OverpassRelElement} OverpassElement
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
 * @typedef OverpassRelElement
 * @property {number} id
 * @property {"relation"} type
 * @property {{ ref: number, role: "inner"|"outer", type: "node"|"way"|"relation" }[]} members
 * @property {{ [key: string]: string }} [tags]
 */
