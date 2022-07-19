import { StyleSelector } from "../Classes/Style";
import { timeout } from '../util/util';
import { clampBBox, extractElements, mapSelectorForQuery, optimiseWildcardTags } from "../util/overpass";

const API_ROOT = require("../conf").API_ROOT;

/**
 * @implements {ElementSource}
 */
export class OverpassSource {
    /** @type {Promise<ElementSourceResult[]>[]} */
    #inProgress = [];

    /**
     *
     * @param {StyleSelector[]} selectors
     * @param {string} bbox
     * @returns {Promise<ElementSourceResult[]>}
     */
    async fetch (selectors, bbox) {
        console.debug(`[OverpassSource] Fetching ${selectors.map(s => s.toString()).join(";")};`);

        const elements = await this.#tryQuery(selectors, bbox);

        const extracted = extractElements(selectors, elements);

        return selectors.map((selector, i) => ({ selector, bbox, elements: extracted[i] }));
    }

    /**
     * @param {StyleSelector[]} selectors
     * @param {string} bbox
     * @returns {Promise<OverpassElement[]>}
     */
    #query (selectors, bbox) {
        if (bbox.split(",").map(p => +p).some(isNaN)) throw Error("Invalid BBox");

        // Remove non-overpass types
        selectors = selectors.filter(s => /^(node|way|rel(?:ation)?|area)/.test(s.type));

        // Optimisation:
        // No need to fetch specific value if wildcard tag is already selected
        // e.g. [highway=primary] when [highway] or [highway=*] is already selected
        selectors = optimiseWildcardTags(selectors);

        const selectorListString = selectors.map(mapSelectorForQuery).join("");

        console.debug(`[Overpass] Querying: ${selectorListString}`)

        const query = `[out:json][bbox];\n(${selectorListString}\n);\nout;`

        const url = `${API_ROOT}?data=${query.replace(/\s/,"")}&bbox=${clampBBox(bbox)}`;

        if (url in this.#inProgress) {
            return this.#inProgress[url];
        }

        this.#inProgress[url] = fetch(url.toString())
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(r => {
                delete this.#inProgress[url];

                return r.elements;
            });

        return this.#inProgress[url];
    }

    /**
     *
     * @param {StyleSelector[]} selectors
     * @param {string} bbox
     * @param {number} tries
     * @returns {Promise<OverpassElement[]>}
     */
    #tryQuery (selectors, bbox, tries=10) {
        return this.#query(selectors, bbox).catch(e => {
            if (e !== 429) throw Error("Bad Response");

            if (tries > 0) {
                return timeout(10000).then(() => this.#tryQuery(selectors, bbox, tries - 1));
            }

            throw Error("Too many retries fetching data");
        });
    }

}
