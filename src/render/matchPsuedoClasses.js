import { getArea, isConvex, isAntiClockwise, getLength } from "../geometry";
import { testPredicate } from "../Style";
import { getBoundingBox } from "./util";

/** @typedef {import("../Style").StyleRule} StyleRule */
/** @typedef {import("../Overpass").OverpassElement} OverpassElement */


/**
 * @param {StyleRule} rule
 * @param {import("../Overpass").OverpassElement} element
 */
export function matchPsuedoClasses(rule, element, nodes = null, points = null) {

    if (rule.selector.pseudoClasses.some(c => c.name === "is" && c.params[0] === "convex")) {
        if (!isConvex(points))
            return false;
    }
    else if (rule.selector.pseudoClasses.some(c => c.name === "is" && c.params[0] === "concave")) {
        if (isConvex(points))
            return false;
    }

    if (rule.selector.pseudoClasses.some(c => c.name === "is" && c.params[0] === "clockwise")) {
        if (isAntiClockwise(points))
            return false;
    }
    else if (rule.selector.pseudoClasses.some(c => c.name === "is" && c.params[0] === "anti-clockwise")) {
        if (!isAntiClockwise(points))
            return false;
    }

    if (rule.selector.pseudoClasses.some(c => c.name === "is" && c.params[0] === "self-closing")) {
        if (nodes[0] !== nodes[points.length - 1])
            return false;
    }

    const hasPseudoClasses = rule.selector.pseudoClasses.filter(c => c.name === "has");

    let match = true;
    for (const pc of hasPseudoClasses) {
        if (typeof pc.params[0] === "string")
            return false;

        const predicate = pc.params[0];

        // Functions for lazy evaluation
        const context = {
            area: () => getArea(points),
            length: () => getLength(points),
            width: () => getBoundingBox(points)[2],
            height: () => getBoundingBox(points)[3],
        };

        match = testPredicate(predicate, context);

        // Break from other pseudo classes
        if (!match)
            break;
    }

    return match;
}
