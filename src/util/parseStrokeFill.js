import { evaluateValue } from "./evaluate";

/**
 * @param {StyleRule} rule
 * @param {OverpassElement?} element
 * @param {MapContext} context
 */
export function parseStrokeFill(rule, element, context) {
    const fillStyle = evaluateValue(rule.declarations["fill"], element, context);
    let lineWidth;
    let strokeStyle = evaluateValue(rule.declarations["stroke"], element, context);
    /** @type {number[]} */
    let lineDash;

    const { scale } = context;

    if (rule.declarations["stroke-width"]) {
        lineWidth = +rule.declarations["stroke-width"] * scale;
    }
    else {
        lineWidth = scale;
    }

    if (rule.declarations["stroke-dash"]) {
        lineDash = rule.declarations["stroke-dash"].split(" ").map(s => +s * scale);
    }
    else {
        lineDash = [];
    }

    return {
        fillStyle,
        strokeStyle,
        lineWidth,
        lineDash,
    };
}