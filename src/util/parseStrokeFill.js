import { evaluateColour, evaluateDimension } from "./evaluate";

/**
 * Examples:
 *  fill: red;
 *  fill: #F00;
 *  fill: rgba(255, 0, 0, 1);
 *  fill: tag(colour);
 *  fill: random;
 *  stroke: blue;
 *  stroke: 10px blue;
 *  stroke-width: 15px;
 *  stroke: 10 tag(building:colour);
 *  stroke: 10 random;
 *
 * @param {{ [property: string]: string }} declarations
 * @param {OverpassElement?} element
 * @param {MapContext} context
 */
export function parseStrokeFill(declarations, element, context) {
    const { scale } = context;

    const fillStyle = evaluateColour(declarations["fill"], element, context);

    /** @type {number} */
    let lineWidth = 1 * scale;
    let strokeColour = declarations["stroke"];
    const dimenMatch = /^\s*\d+(?:\s*px)?/.exec(strokeColour);
    if (dimenMatch) {
        lineWidth = parseFloat(dimenMatch[0]);
        strokeColour = strokeColour.substring(dimenMatch[0].length).trim();
    }
    let strokeStyle = evaluateColour(strokeColour, element, context);


    if (declarations["stroke-width"]) {
        lineWidth = +evaluateDimension(declarations["stroke-width"], element, context) * scale;
    }

    /** @type {number[]} */
    let lineDash;
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