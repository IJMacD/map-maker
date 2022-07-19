import { contains } from "../util/bbox";

/**
 * @implements {ElementSource}
 */
export class MemorySource {
    /** @type {{ [selector: string]: { [bbox: string]: OverpassElement[] }}} */
    #cache = {};

    /** @type {ElementSource} */
    #source;

    /**
     * @param {ElementSource} source
     */
    constructor (source) {
        this.#source = source;
    }

    /**
     * @param {string} selector
     * @param {string} bbox
     */
    #getElementsFromCache (selector, bbox) {
        if (!this.#cache[selector]) {
            throw Error("Selector not cached: " + selector);
        }

        for (const _bbox in this.#cache[selector]) {
            // TODO: find smallest area, rather than first match
            if (contains(_bbox, bbox)) {
                return this.#cache[selector][_bbox];
            }
        }

        throw Error(`BBox not cached: ${bbox} (${selector})`);
    }

    /**
     * @param {string} selector
     * @param {string} bbox
     * @param {OverpassElement[]} elements
     */
    #addToCache (selector, bbox, elements) {
        if (!this.#cache[selector]) {
            this.#cache[selector] = {};
        }

        this.#cache[selector][bbox] = elements;
    }

    /**
     * @param {string} selector
     * @param {string} bbox
     */
    #isAvailable (selector, bbox) {
        if (!this.#cache[selector]) {
            return false;
        }

        // TODO: find smallest area, rather than first match
        for (const _bbox in this.#cache[selector]) {
            if (contains(_bbox, bbox)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param {StyleSelector[]} selectors
     * @param {string} bbox
     */
    async fetch (selectors, bbox) {
        console.debug(`[MemorySource] Fetching ${selectors.map(s => s.toString()).join(";")};`);

        const pendingList = [];

        // TODO: optimisation - don't send selectors which aren't cached
        // directly but are cached as a wildcard down to source

        for (const selector of selectors) {
            if (!this.#isAvailable(selector.toString(), bbox)) {
                pendingList.push(selector);
            }
        }

        if (pendingList.length > 0) {
            const results = await this.#source.fetch(pendingList, bbox);

            for (const result of results) {
                this.#addToCache(result.selector.toString(), result.bbox, result.elements);
            }
        }

        return selectors.map(selector => ({ selector, bbox, elements: this.#getElementsFromCache(selector.toString(), bbox) }));
    }
}
