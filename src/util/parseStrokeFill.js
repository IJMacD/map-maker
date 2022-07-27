import { evaluateColour } from "./evaluate";

/**
 * @param {{ [property: string]: string }} declarations
 * @param {OverpassElement?} element
 * @param {MapContext} context
 */
export function parseStrokeFill(declarations, element, context) {
    const fillStyle = evaluateColour(declarations["fill"], element, context);
    let lineWidth;
    let strokeStyle = evaluateColour(declarations["stroke"], element, context);
    /** @type {number[]} */
    let lineDash;

    const { scale } = context;

    if (declarations["stroke-width"]) {
        lineWidth = +declarations["stroke-width"] * scale;
    }
    else {
        lineWidth = scale;
    }

    if (declarations["stroke-dash"]) {
        lineDash = declarations["stroke-dash"].split(" ").map(s => +s * scale);
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