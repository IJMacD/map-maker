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

/**
 * Given a list of elements, take all ways in the list and try to joing them
 * into one long way by matching start/end nodes.
 * This is designed to join coastlines into one continuous line so they can be
 * rendered correctly.
 * The result is an array of elements containing all continuous ways which can
 * be found as well as all nodes. The ways will have an arbritary set of tags.
 * @note not optimal but seems to work
 * @param {OverpassElement[]} elements
 * @returns {OverpassElement[]}
 */
export function mergeWays (elements) {
    const ways = /** @type {OverpassWayElement[]} */(elements.filter(e => e.type === "way"));
    const nodes = elements.filter(e => e.type === "node");

    /** @type {OverpassWayElement[]} */
    const selfClosedWays = [];

    /** @type {OverpassWayElement[]} */
    let toProcess = [];

    // Prepare way hashmaps
    for (const way of ways) {
        if (isSelfClosingWay(way)) {
            // For self closing ways don't even bother further processing
            selfClosedWays.push(way);
        }
        else {
            toProcess.push(way);
        }
    }

    let prevCount = 0;

    // Iteratively process list until two successive iterations result in the
    // same number of ways
    while (prevCount !== toProcess.length) {
        prevCount = toProcess.length;

        /** @type {{ [lastNodeID: number ]: OverpassWayElement[] }} */
        toProcess = _mergeIteration(toProcess);

        toProcess.reverse();

        toProcess = _mergeIteration(toProcess);
    }

    console.log(`Found ${selfClosedWays.length} self-closed; ${toProcess.length} connected; `);

    return [ ...selfClosedWays, ...toProcess, ...nodes ];
}

function _mergeIteration(toProcess) {
    console.debug(`Starting with ${toProcess.length} open ways`);

    const heads = {};

    for (const way of toProcess) {
        const firstNode = way.nodes[0];
        const lastNode = way.nodes[way.nodes.length - 1];

        // Check if our first node matches the last node of a head chain
        if (heads[firstNode]) {
            // If there is a match then append ourself to that chain
            const chain = heads[firstNode];
            chain.push(way);

            // We need to update the location of the chain since it has a
            // new last node.
            delete heads[firstNode];
            heads[lastNode] = chain;
        }
        else {
            heads[lastNode] = [way];
        }
    }

    return Object.values(heads).map(chain => ({ ...chain[0], nodes: chain.map(w => w.nodes).flat() }));
}

/**
 * @param {OverpassWayElement} way
 */
function isSelfClosingWay (way) {
    return way.nodes[0] === way.nodes[way.nodes.length - 1];
}