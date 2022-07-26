import { StyleSelector } from "../Classes/Style";
import { timeout } from '../util/util';
import { clampBBox, extractElements, isOverpassType, mapSelectorForQuery, optimiseDuplicates, optimiseWildcardTags } from "../util/overpass";

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

        const extractedElements = extractElements(selectors, elements);

        return selectors.map((selector, i) => ({ selector, bbox, elements: extractedElements[i] }));
    }

    /**
     * @param {StyleSelector[]} selectors
     * @param {string} bbox
     * @returns {Promise<OverpassElement[]>}
     */
    #query (selectors, bbox) {
        if (bbox.split(",").map(p => +p).some(isNaN)) throw Error("Invalid BBox");

        // Remove non-overpass types
        selectors = selectors.filter(isOverpassType);

        // Optimisation:
        // Filter duplicates
        selectors = optimiseDuplicates(selectors);

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
            .then(r => r.ok ? /** @type {Promise<{ elements: OverpassElement[] }>} */(r.json()) : Promise.reject(r.status))
            .then(r => r.elements)
            .finally(() => {
                delete this.#inProgress[url];
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
        const retryErrors = [ 429, 504 ];

        return this.#query(selectors, bbox).catch(e => {
            if (!retryErrors.includes(e)) throw Error("Bad Response");

            if (tries > 0) {
                return timeout(10000).then(() => this.#tryQuery(selectors, bbox, tries - 1));
            }

            throw Error("Too many retries fetching data");
        });
    }

}
