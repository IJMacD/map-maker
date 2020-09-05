import { getArea, isConvex, isAntiClockwise, getLength } from "./geometry";
import { testPredicate } from "./Style";
import { getBoundingBox } from "./util";

/** @typedef {import("./Style").StyleRule} StyleRule */
/** @typedef {import("./Overpass").OverpassElement} OverpassElement */


/**
 * @param {StyleRule} rule
 * @param {[number, number][]} points
 * @param {import("./Overpass").OverpassElement} element
 * @param {import("./Overpass").OverpassElement[]} nodes
 */
export function matchPseudoClasses(rule, points, element=null, nodes = null) {
    const { selector } = rule;

    if (includesPseudoClass(selector, "is", "convex")) {
        if (!isConvex(points))
            return false;
    }

    if (includesPseudoClass(selector, "is", "concave")) {
        if (isConvex(points))
            return false;
    }

    if (includesPseudoClass(selector, "is", "clockwise")) {
        if (isAntiClockwise(points))
            return false;
    }

    if (includesPseudoClass(selector, "is", "anti-clockwise")) {
        if (!isAntiClockwise(points))
            return false;
    }

    if (includesPseudoClass(selector, "is", "self-closing")) {
        if (nodes[0] !== nodes[points.length - 1])
            return false;
    }

    const hasPseudoClasses = selector.pseudoClasses.filter(c => c.name === "has");

    for (const pc of hasPseudoClasses) {
        if (typeof pc.params[0] === "string")
            return false;

        const predicate = pc.params[0];

        // Functions for lazy evaluation
        const elementContext = {
            area: () => getArea(points),
            length: () => getLength(points),
            width: () => getBoundingBox(points)[2],
            height: () => getBoundingBox(points)[3],
        };

        const match = testPredicate(predicate, elementContext);

        if (!match) return false;
    }

    return true;
}

/**
 * @todo Add support for more than one paramater
 * @param {import("./Overpass").StyleSelector} selector
 * @param {string} name
 * @param  {...string} params
 */
function includesPseudoClass (selector, name, ...params) {
    return selector.pseudoClasses.some(c => c.name === name && c.params[0] === params[0]);
}