import { getArea, isConvex, isAntiClockwise, getLength } from "./geometry";
import { testPredicate } from "../Classes/Style";
import { getBoundingBox } from "./util";

/**
 * @param {StyleRule} rule
 * @param {[number, number][]} points
 * @param {OverpassElement} [element]
 * @param {OverpassElement[]} [nodes]
 */
export function matchPseudoClasses(rule, points, element, nodes) {
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
        if (nodes && nodes[0] !== nodes[points.length - 1])
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
 * @param {StyleSelector} selector
 * @param {string} name
 * @param  {...string} params
 */
function includesPseudoClass (selector, name, ...params) {
    return selector.pseudoClasses.some(c => c.name === name && c.params[0] === params[0]);
}