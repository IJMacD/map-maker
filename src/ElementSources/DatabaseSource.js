import IDBElementDatabase from "../data/database.idb";
import { isOverpassType } from "../util/overpass";

/**
 * @implements {ElementSource}
 */
export class DatabaseSource {
    #database = new IDBElementDatabase();

    /** @type {ElementSource} */
    #source;

    /**
     * @param {ElementSource} source
     */
    constructor (source) {
        this.#source = source;
    }

    /**
     *
     * @param {StyleSelector[]} selectors
     * @param {string} bbox
     * @returns {Promise<ElementSourceResult[]>}
     */
    async fetch (selectors, bbox) {
        console.debug(`[DatabaseSource] Fetching ${selectors.map(s => s.toString()).join(";")};`);

        // Remove non-overpass types
        const filteredSelectors = selectors.filter(isOverpassType);

        const dbResults = await Promise.all(filteredSelectors.map(s => this.#getElements(s, bbox)));

        // Make list of selectors to fetch from source
        const pendingList = [];

        dbResults.forEach((result, i) => {
            if (!result) {
                pendingList.push(selectors[i]);
            }
        });

        let fetched = [];

        if (pendingList.length > 0) {
            fetched = await this.#source.fetch(pendingList, bbox);

            // Save fetched results back to database
            for (const result of fetched) {
                this.#database.saveElements(bbox, result.selector.toString(), { elements: result.elements, cached: Date.now() });
            }
        }

        // Construct result objects
        let dbIndex = 0;
        let fetchedIndex = 0;
        return selectors.map(selector => {
            // No elements for non-overpass types
            if (!isOverpassType(selector)) {
                return { selector, bbox, elements: [] };
            }

            const dbResult = dbResults[dbIndex++];

            if (dbResult) {
                return { selector, bbox, elements: dbResult };
            }

            return fetched[fetchedIndex++];
        });
    }

    /**
     * Wrap underlying database API
     * @param {StyleSelector} selector
     * @param {string} bbox
     */
    async #getElements (selector, bbox) {
        const dbResult = await this.#database.getElements(bbox, selector.toString());

        if (dbResult) {
            const { elements } = dbResult;
            return elements;
        }

        const dbSearchResult = await this.#database.searchElements(bbox, selector.toString());

        if (dbSearchResult) {
            return this.#database.getElementsByKey(dbSearchResult).then(r => r?.elements);
        }
    }
}