import { matchSelector } from "../Classes/Style";

/**
 * @param {StyleSelector[]} selectors
 */
export function getSelectors (selectors) {
    /** @type {{ [key: string]: StyleSelector }} */
    const set = {};

    selectors.forEach(s => set[mapSelector(s)] = s);

    console.debug(`getSelectors: ${selectors.length} requested (${Object.keys(set).length} unique)`);

    // Remove non-overpass selectors
    for (const [key, selector] of Object.entries(set)) {
        if (!isOverpassType(selector))
            delete set[key];
    }

    return set;
}

/** @param {StyleSelector} selector */
export function mapSelectorForQuery (selector) {
    const recur = /^(way|rel(?:ation)?|area)/.test(selector.type) ? ">;" : "";
    return `${mapSelector(selector)};${recur}`;
}

/** @param {StyleSelector} selector */
export function mapSelector (selector) {
    const type = selector.type === "area" ? "way" : selector.type;
    const tags = Object.entries(selector.tags).map(([k,v]) => {
        if (k.includes(":")) k = `"${k}"`;
        return (/^[<=>]+/.test(v) || v === "*") ? `[${k}]` : `[${k}=${v}]`;
    });
    return `${type}${tags.join("")}`;
}

export function clampBBox (bbox) {
    let [ lon1, lat1, lon2, lat2 ] = bbox.split(",").map(p => +p);

    if (lon1 > lon2) {
        [ lon1, lon2 ] = [ lon2, lon1 ];
    }

    if (lat1 > lat2) {
        [ lat1, lat2 ] = [ lat2, lat1 ];
    }

    return `${clamp(lon1, -180, 180)},${clamp(lat1, -90, 90)},${clamp(lon2, -180, 180)},${clamp(lat2, -90, 90)}`;
}

export function clamp (v, min, max) {
    return Math.max(min, Math.min(v, max));
}

/**
 * Given a list of elements and a list of selectors; for each selector extract
 * the matching elements (including dependent elements e.g. nodes for ways)
 * @param {StyleSelector[]} selectors
 * @param {OverpassElement[]} elements
 */
export function extractElements (selectors, elements) {
    // Optimisation:
    // Hopefully safe. If there's only one selector then we might assume the
    // elements are already correct (an not over supplied)
    if (selectors.length === 1) {
        console.debug("[Overpass] Assumption: elements are already matching")
        return [elements];
    }

    // Prepare node map
    /** @type {{ [id: number]: OverpassNodeElement }} */
    const nodeMap = {};

    // Only need node map if way have any rels or ways
    if (selectors.some(s => s?.type === "relation" || s?.type === "way" || s?.type === "area")) {
        elements.forEach(n => n.type === "node" && (nodeMap[n.id] = n));
    }

    // Prepare way map
    /** @type {{ [id: number]: OverpassWayElement }} */
    const wayMap = {};

    // Only need way map if way have any rels
    if (selectors.some(s => s?.type === "relation")) {
        elements.forEach(n => n.type === "way" && (wayMap[n.id] = n));
    }

    return selectors.map(selector => extractElementsBySelector(selector, elements, nodeMap, wayMap));
}

/**
 * @param {import("../Classes/Style").StyleSelector?} selector
 * @param {OverpassElement[]} elements
 * @param {{ [id: number]: OverpassNodeElement}} nodeMap
 * @param {{ [id: number]: OverpassWayElement}} wayMap
 */
export function extractElementsBySelector(selector, elements, nodeMap, wayMap) {
    if (!selector) {
        return [];
    }

    const out = elements.filter(el => matchSelector(selector, el, false));

    if (selector.type === "relation") {
        const rels = /** @type {OverpassRelElement[]} */(out.slice());

        /** @type {OverpassWayElement[]} */
        const ways = [];

        for (const rel of rels) {
            const refs = rel.members.map(m => m.ref);
            ways.push(...refs.map(id => wayMap[id]));
        }

        out.push(...ways);

        for (const way of ways) {
            if (!way) {
                throw Error("[Overpass] missing way from waymap");
            }
            out.push(...way.nodes.map(id => nodeMap[id]));
        }

    } else if (selector.type === "way" || selector.type === "area") {
        const ways = /** @type {OverpassWayElement[]} */(out.slice());

        for (const way of ways) {
            out.push(...way.nodes.map(id => nodeMap[id]));
        }
    }
    return out;
}

/**
 * @param {StyleSelector[]} selectors
 */
export function optimiseDuplicates (selectors) {
    const map = {};

    for (const selector of selectors) {
        map[selector.toString()] = selector;
    }

    return Object.values(map);
}

/**
 * @param {StyleSelector[]} selectors
 */
export function optimiseWildcardTags (selectors) {
    /** @type {StyleSelector[]} */
    const out = [];

    for (const selector of selectors) {
        const keys = Object.keys(selector.tags);

        // Only consider selectors with exactly one tag
        if (keys.length !== 1) {
            out.push(selector);
        }

        // Include the one with the wildcard
        if (selector.tags[keys[0]] === "*") {
            out.push(selector);
        }

        if (!selectors.some(s => isWildcardMatch(s, selector)))
        {
            out.push(selector);
        }
    }

    return out;
}

function isWildcardMatch(selector, testSelector) {
    const keys = Object.keys(selector.tags);

    if (keys.length !== 1)
        return false;

    const key = keys[0];

    if (!(key in testSelector.tags))
        return false;

    return selector.tags[key] === "*";
}

/**
 * Checks if selector is for real Overpass element (e.g. node, way, relation,
 * or area [which is still OK]); or another type of selector (e.g. map,
 * current, gridlines, dummy, etc.)
 * Returns `true` for Overpass elements
 * @note Can be used in `.filter()` so don't add other parameters
 * @param {StyleSelector} selector
 */
export function isOverpassType(selector) {
    return /^(node|way|rel(?:ation)?|area)/.test(selector.type);
}