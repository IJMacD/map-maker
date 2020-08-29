import IDBElementDatabase from "./database.idb";
import { contains } from "./bbox";
import { matchSelector } from "./Style";

/** @typedef {import("./Style").StyleSelector} StyleSelector */

const API_ROOT = require("./const").API_ROOT;

const overpassRe = /(node|way|rel(?:ation)?|area)/;
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
        }
        this.bbox = bbox;
    }

    /**
     * 
     * @param {StyleSelector[]} selectors 
     */
    async preLoadElements (selectors) {
        const { bbox } = this;

        // Create set of selectors
        /** @type {{ [key: string]: StyleSelector }} */
        const set = {};
        selectors.forEach(s => set[s.toString()] = s);

        console.debug(`Preloading Elements: ${selectors.length} requested (${Object.keys(set).length} unique)`);

        // Remove non-overpass selectors
        for (const [key, selector] of Object.entries(set)) {
            if (!overpassRe.test(selector.type)) delete set[key];
        }
        console.debug(`Preloading Elements: ${Object.keys(set).length} are Overpass Elements`); 

        // Remove selectors in local hash map cache
        for (const key of Object.keys(set)) {
            if (this.elements.has(key)) delete set[key];
        }
        console.debug(`Preloading Elements: ${Object.keys(set).length} not in HashMap`); 
        
        // Remove selectors in database
        await Promise.all(Object.keys(set).map(s => {
            return this.database.searchElements(bbox, s)
                .then(els => {
                    if (els) delete set[s];
                });
        }));
        console.debug(`Preloading Elements: ${Object.keys(set).length} not in Database`);

        if (Object.keys(set).length === 0) return;

        const { elements } = await this.query(Object.values(set));

        console.log(`Preloading Elements: Fetched ${elements.length} elements from Server`);

        // Prepare node map
        /** @type {{ [id: number]: import("./Overpass").OverpassNodeElement }} */
        const nodeMap = {};
        elements.forEach(n => n.type === "node" && (nodeMap[n.id] = n));
        // Prepare way map
        /** @type {{ [id: number]: import("./Overpass").OverpassWayElement }} */
        const wayMap = {};
        elements.forEach(n => n.type === "way" && (wayMap[n.id] = n));

        return Promise.all(Object.values(set).map(selector => {
            const out = elements.filter(el => matchSelector(selector, el));

            if (selector.type === "relation") {
                /** @type {OverpassRelElement[]} */
                const rels = (out.slice());

                /** @type {OverpassWayElement[]} */
                const ways = [];

                for (const rel of rels) {
                    const refs = rel.members.map(m => m.ref);
                    ways.push(...refs.map(id => wayMap[id]));
                }

                out.push(...ways);

                for (const way of ways) {
                    out.push(...way.nodes.map(id => nodeMap[id]));
                }

            } else if (selector.type === "way") {
                /** @type {OverpassWayElement[]} */
                const ways = (out.slice());

                for (const way of ways) {
                    out.push(...way.nodes.map(id => nodeMap[id]));
                }
            }

            this.elements.set(selector.toString(), Promise.resolve(out));
            return this.database.saveElements(bbox, selector.toString(), { elements: out, cached: Date.now() });
        }));
        }

    /**
     * 
     * @param {StyleSelector[]} selectors 
     * @returns {Promise<{ elements: OverpassElement[] }>}
     */
    query (selectors) {
        const sMap = selectors.map(s => recurRe.test(s.type) ? `\n\t${s};\n\t>;` : s.toString() + ";");
        const query = `[out:json][bbox];\n(${sMap.join("")}\n);\nout;`
        const url = `${API_ROOT}?data=${query.replace(/\s/,"")}&bbox=${this.bbox}`;
        return fetch(url.toString()).then(r => r.ok ? r.json() : Promise.reject(r.status));
    }

    tryElements (selector, tries=10) {
        return new Promise ((resolve, reject) => {
            this.query([selector]).then(d => {
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
        if (!overpassRe.test(selector.type)) return;

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
            const elements = this.database.getElementsByKey(dbSearchResult).then(r => r.elements);
            this.elements.set(s, elements);
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
