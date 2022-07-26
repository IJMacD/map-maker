import { mergeWays } from "../util/overpass";

/**
 * A sort of middleware to intercept coastline ways and merge them
 * @note Coastlines seem to work much better with very large areas covered
 * @implements {ElementSource}
 */
export class CoastlineSource {

    /** @type {ElementSource} */
    #source;

    /**
     * @param {ElementSource} source
     */
    constructor (source) {
        this.#source = source;
    }

    /**
     * @param {StyleSelector[]} selectors
     * @param {string} bbox
     */
    async fetch (selectors, bbox) {
        const results = await this.#source.fetch(selectors, bbox);

        return results.map((result, i) => {
            const selector = selectors[i];

            // Special coastline processing
            if (selector.type === "way" && selector.tags["natural"] === "coastline") {
                return { ...result, elements: mergeWays(result.elements) };
            }

            return result;
        });
    }
}