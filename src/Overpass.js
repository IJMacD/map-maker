import IDBElementDatabase from "./database.idb";
import { contains } from "./bbox";
import { matchSelector } from "./Style";
import { timeout } from './util';

/** @typedef {import("./Style").StyleSelector} StyleSelector */

const API_ROOT = require("./const").API_ROOT;

const overpassRe = /^(node|way|rel(?:ation)?|area)/;
const recurRe = /^(way|rel(?:ation)?|area)/;

export class Overpass {
    /** @param {string} bbox */
    constructor (bbox=null) {
        /** @type {Map<string, Promise<OverpassElement[]>>} */
        this.elements = new Map();
        this.bbox = bbox;
        this.database = new IDBElementDatabase();
        /** @type {{ [url: string]: Promise<OverpassElement[]> }} */
        this.fetchMap = {};
        /** @type {Promise<any>} */
        this.currentJob = Promise.resolve();
    }

    setBBox (bbox) {
        // If the new bbox is completely contained within the
        // old one then we don't need to clear our cache
        if (this.bbox && !contains(this.bbox, bbox)) {
            this.elements.clear();
        }
        this.bbox = bbox;
    }

    /**
     *
     * @param {StyleSelector[]} selectors
     */
    async preLoadElements (selectors) {
        return this.jobs(async () => {
            const { bbox } = this;

            if (!this.bbox) {
                throw Error("No bounding box specified");
            }

            // Create set of selectors
            /** @type {{ [key: string]: StyleSelector }} */
            const set = {};
            selectors.forEach(s => set[mapSelector(s)] = s);

            console.debug(`Preloading Elements: ${selectors.length} requested (${Object.keys(set).length} unique)`);

            // Remove non-overpass selectors
            for (const [key, selector] of Object.entries(set)) {
                if (!overpassRe.test(selector.type)) delete set[key];
            }
            console.debug(`Preloading Elements: ${Object.keys(set).length} are Overpass Elements`);

            // Remove selectors found in local hash map cache
            for (const key of Object.keys(set)) {
                if (this.elements.has(key)) delete set[key];
            }
            console.debug(`Preloading Elements: ${Object.keys(set).length} not in HashMap`);

            // Remove selectors which were found in database
            await Promise.all(Object.keys(set).map(s => {
                return this.database.searchElements(bbox, s)
                    .then(els => {
                        if (els) delete set[s];
                    });
            }));
            console.debug(`Preloading Elements: ${Object.keys(set).length} not in Database`);

            if (Object.keys(set).length === 0) return 0;

            const elements = await this.tryQuery(Object.values(set));

            console.log(`Preloading Elements: Fetched ${elements.length} elements from Server`);

            // Prepare node map
            /** @type {{ [id: number]: import("./Overpass").OverpassNodeElement }} */
            const nodeMap = {};
            elements.forEach(n => n.type === "node" && (nodeMap[n.id] = n));
            // Prepare way map
            /** @type {{ [id: number]: import("./Overpass").OverpassWayElement }} */
            const wayMap = {};
            elements.forEach(n => n.type === "way" && (wayMap[n.id] = n));

            await Promise.all(Object.values(set).map(selector => {
                const out = elements.filter(el => matchSelector(selector, el, false));

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

                } else if (selector.type === "way" || selector.type === "area") {
                    /** @type {OverpassWayElement[]} */
                    const ways = (out.slice());

                    for (const way of ways) {
                        out.push(...way.nodes.map(id => nodeMap[id]));
                    }
                }

                this.elements.set(mapSelector(selector), Promise.resolve(out));
                return this.database.saveElements(bbox, mapSelector(selector), { elements: out, cached: Date.now() });
            }));

            return elements.length;
        });
    }

    /**
     *
     * @param {StyleSelector[]} selectors
     * @returns {Promise<OverpassElement[]>}
     */
    query (selectors) {
        if (this.bbox.split(",").map(p => +p).some(isNaN)) throw Error("Invalid BBox");

        const sMap = selectors.map(mapSelectorForQuery);
        const query = `[out:json][bbox];\n(${sMap.join("")}\n);\nout;`
        const url = `${API_ROOT}?data=${query.replace(/\s/,"")}&bbox=${clampBBox(this.bbox)}`;

        if (!this.fetchMap[url]) {;
            this.fetchMap[url] = fetch(url.toString()).then(r => r.ok ? r.json() : Promise.reject(r.status)).then(r => r.elements);

            this.fetchMap[url].finally(() => delete this.fetchMap[url]);
        }

        return this.fetchMap[url];
    }

    /**
     *
     * @param {StyleSelector[]} selectors
     * @param {number} tries
     * @returns {Promise<OverpassElement[]>}
     */
    tryQuery (selectors, tries=10) {
        return this.query(selectors).catch(e => {
            if (e !== 429) throw Error("Bad Response");

            if (tries > 0) {
                return timeout(10000).then(() => this.tryQuery(selectors, tries - 1))
            }

            throw Error("Too many retries fetching data");
        });
    }

    /**
     * @param {import("./Style").StyleSelector} selector
     * @returns {Promise<OverpassElement[]>}
     */
    async getElements (selector) {
        if (!overpassRe.test(selector.type)) return;

        const s = mapSelector(selector);
        if (this.elements.has(s)) return this.elements.get(s);

        const dbResult = await this.database.getElements(this.bbox, s);

        if (dbResult) {
            const { elements } = dbResult;
            this.elements.set(s, Promise.resolve(elements));
            return elements;
        }

        const dbSearchResult = await this.database.searchElements(this.bbox, s);

        if (dbSearchResult) {
            const elements = this.database.getElementsByKey(dbSearchResult).then(r => r.elements);
            this.elements.set(s, elements);
            return elements;
        }

        const p = this.tryQuery([selector]);

        this.elements.set(s, p);

        p.catch(() => this.elements.delete(s));

        p.then(elements => {
            this.database.saveElements(this.bbox, s, { elements, cached: Date.now() });
        });

        return p;
    }

    jobs (fn) {
        this.currentJob = this.currentJob.then(() => fn());

        return this.currentJob;
    }

    // Delete everything from cache
    clearCache (database = false) {
        this.elements.clear();
        if (database)
            return this.database.clear();
    }
}

/** @param {StyleSelector} selector */
function mapSelectorForQuery (selector) {
    const recur = recurRe.test(selector.type) ? ">;" : "";
    return `${mapSelector(selector)};${recur}`;
}

/** @param {StyleSelector} selector */
function mapSelector (selector) {
    const type = selector.type === "area" ? "way" : selector.type;
    const tags = Object.entries(selector.tags).map(([k,v]) => {
        return (/^[<=>]+/.test(v) || v === "*") ? `[${k}]` : `[${k}=${v}]`;
    });
    return `${type}${tags.join("")}`;
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

function clampBBox (bbox) {
    const p = bbox.split(",").map(p => +p);
    return `${clamp(p[0], -180, 180)},${clamp(p[1], -90, 90)},${clamp(p[2], -180, 180)},${clamp(p[3], -90, 90)}`;
}

function clamp (v, min, max) {
    return Math.max(min, Math.min(v, max));
}