/** @typedef {import("../Style").StyleRule} StyleRule */
/** @typedef {import("../Overpass").OverpassElement} OverpassElement */

import { setStrokeFill } from "./setStrokeFill";
import { getContent } from "../getContent";

/**
 * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} ctx
 * @param {StyleRule} rule
 * @param {[number, number]} param2
 * @param {OverpassElement} [element]
 * @param {import("../MapRenderer").MapContext} context
 */
export function renderText(ctx, rule, [x, y], element = null, context) {
    setStrokeFill(ctx, rule, context.scale);

    let content = getContent(rule, element, context);

    setFont(ctx, rule, context.scale);

    for (const line of content.split("\n")) {
        y += renderLine(ctx, rule, line, x, y, context);
    }
}

/**
 * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} ctx
 * @param {StyleRule} rule
 * @param {string} content
 * @param {number} x
 * @param {number} y
 * @param {import("../MapRenderer").MapContext} context
 */
function renderLine(ctx, rule, content, x, y, context) {
    const size = ctx.measureText(content);

    if (rule.declarations["text-align"]) {
        const textWidth = size.width;

        if (rule.declarations["text-align"] === "center" || rule.declarations["text-align"] === "centre") {
            x -= textWidth / 2;
        }
        else if (rule.declarations["text-align"] === "right") {
            x -= textWidth;
        }
    }

    if (rule.declarations["stroke-width"]) {
        ctx.lineWidth = parseFloat(rule.declarations["stroke-width"]) * context.scale;
    }

    if (rule.declarations["text-stroke"]) {
        // Todo: parse `2px red`
        ctx.strokeStyle = rule.declarations["text-stroke"];
        ctx.strokeText(content, x, y);
    }

    if (rule.declarations["text-color"] || !rule.declarations["text-stroke"]) {
        ctx.fillStyle = rule.declarations["text-color"];
        ctx.fillText(content, x, y);
    }

    const height = size.actualBoundingBoxAscent + size.actualBoundingBoxDescent;
    return height;
}

/**
 * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} ctx
 * @param {StyleRule} rule
 * @param {number} scale
 */
export function setFont(ctx, rule, scale) {
    let fontSize = `${10 * scale}px`;
    let fontWeight = "normal";
    let fontFamily = "sans-serif";

    if (rule.declarations["font"]) {
        // It would be nice for the specific properties to override the
        // shorthand, but it would complicate things a bit.
        ctx.font = rule.declarations["font"].replace(/\d+(?:\.\d+)?/, s => `${+s * scale}`);
    }
    else {
        if (rule.declarations["font-size"]) {
            fontSize = rule.declarations["font-size"].replace(/^\d[\d.]*/, m => `${+m * scale}`);
        }

        if (rule.declarations["font-weight"]) {
            fontWeight = rule.declarations["font-weight"];
        }

        if (rule.declarations["font-family"]) {
            fontFamily = rule.declarations["font-family"];
        }

        ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;
    }
}
