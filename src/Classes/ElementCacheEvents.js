/** @typedef {"status"|"progress"} ElementCacheEventType */
/** @typedef {ElementCache.STATUS_READY|ElementCache.STATUS_LOADING|ElementCache.STATUS_ERROR} ElementCacheStatus */

import { contains } from "../util/bbox";
import { getSelectors } from "../util/overpass";

export class ElementCacheEvents {
    /** @type {string?} */
    #bbox = null;

    /** @type {string[]} */
    #selectors = [];

    /** @type {{ [selector: string]: { [bbox: string]: OverpassElement[] }}} */
    #cache = {};

    /** @type {string[]} */
    #pendingList = [];

    /** @type {{ status: ((status: ElementCacheStatus) => void)[], progress: ((progress: number) => void)[] }} */
    #listeners = {
        status: [],
        progress: [],
    };

    #status = ElementCache.STATUS_READY;

    /** @type {{ fetch: (selectors: string[], bbox: string) => Promise<{ selector: string, bbox: string, elements: OverpassElement[] }[]>}} */
    #source;

    constructor (source) {
        this.#source = source;
    }

    getStatus () {
        return this.#status;
    }

    /**
     * @param {symbol} status
     */
    #setStatus (status) {
        if (status !== this.#status) {
            this.#status = status;
            this.#notify("status", status);
        }
    }

    /**
     * @param {string} bbox
     */
    setBBox (bbox) {
        this.#bbox = bbox;
        this.#updatePendingList();
    }

    /**
     * @param {string[]} selectors
     */
    setSelectors (selectors) {
        this.#selectors = selectors;
        this.#updatePendingList();
    }

    /**
     * @param {StyleRule[]} rules
     */
    setRules (rules) {
        this.setSelectors(Object.keys(getSelectors(rules.map(r => r.selector))));
    }

    /**
     * @param {string} selector
     * @param {string} bbox
     */
    getElementsFromCache (selector, bbox) {
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
    isAvailable (selector, bbox) {
        if (!this.#cache[selector]) {
            false;
        }

        // TODO: find smallest area, rather than first match
        for (const _bbox in this.#cache[selector]) {
            if (contains(_bbox, bbox)) {
                return true;
            }
        }

        return false;
    }

    #updatePendingList () {
        this.#pendingList = [];

        if (this.#bbox) {
            for (const selector of this.#selectors) {
                if (!this.isAvailable(selector, this.#bbox)) {
                    this.#pendingList.push(selector);
                }
            }
        }

        this.#setStatus(this.#pendingList.length === 0 ? ElementCache.STATUS_READY : ElementCache.STATUS_STALE);
    }

    fetchPending () {
        if (this.#bbox) {
            this.#source.fetch(this.#pendingList, this.#bbox).then(results => {
                for (const result of results) {
                    this.#addToCache(result.selector, result.bbox, result.elements);
                }
            });
        }
    }

    /**
     * @param {ElementCacheEventType} event
     * @param {() => void} listener
     */
    addEventListener (event, listener) {
        this.#listeners[event].push(listener);
    }

    /**
     * @param {ElementCacheEventType} event
     * @param {() => void} listener
     */
    removeEventListener (event, listener) {
        // @ts-ignore
        this.#listeners[event] = this.#listeners[event].filter(l => l !== listener);
    }

    /**
     * @param {ElementCacheEventType} event
     * @param {ElementCacheStatus|number} param
     */
    #notify (event, param) {
        for (const fn of this.#listeners[event]) {
            // @ts-ignore
            fn(param);
        }
    }
}

ElementCache.STATUS_STALE = Symbol("STALE");
ElementCache.STATUS_READY = Symbol("READY");
ElementCache.STATUS_LOADING = Symbol("LOADING");
ElementCache.STATUS_ERROR = Symbol("ERROR");
