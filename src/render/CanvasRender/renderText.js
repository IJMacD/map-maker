import { setStrokeFill } from "./setStrokeFill";
import { getContent } from "../../util/getContent";

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ [property: string]: string }} declarations
 * @param {[number, number]} param2
 * @param {OverpassElement?} element
 * @param {MapContext} context
 */
export function renderText(ctx, declarations, [x, y], element = null, context) {
    setStrokeFill(ctx, declarations, element, context);

    let content = getContent(declarations, element, context);

    setFont(ctx, declarations, context.scale);

    for (const line of content.split("\n")) {
        y += renderLine(ctx, declarations, line, x, y, context);
    }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ [property: string]: string }} declarations
 * @param {string} content
 * @param {number} x
 * @param {number} y
 * @param {MapContext} context
 */
function renderLine(ctx, declarations, content, x, y, context) {
    const size = ctx.measureText(content);

    if (declarations["text-align"]) {
        const textWidth = size.width;

        if (declarations["text-align"] === "center" || declarations["text-align"] === "centre") {
            x -= textWidth / 2;
        }
        else if (declarations["text-align"] === "right") {
            x -= textWidth;
        }
    }

    if (declarations["stroke-width"]) {
        ctx.lineWidth = parseFloat(declarations["stroke-width"]) * context.scale;
    }

    if (declarations["text-stroke"]) {
        // Todo: parse `2px red`
        ctx.strokeStyle = declarations["text-stroke"];
        ctx.strokeText(content, x, y);
    }

    if (declarations["text-color"] || !declarations["text-stroke"]) {
        ctx.fillStyle = declarations["text-color"];
        ctx.fillText(content, x, y);
    }

    const height = size.actualBoundingBoxAscent + size.actualBoundingBoxDescent;
    return height;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ [property: string]: string }} declarations
 * @param {number} scale
 */
export function setFont(ctx, declarations, scale) {
    let fontSize = `${10 * scale}px`;
    let fontWeight = "normal";
    let fontFamily = "sans-serif";

    if (declarations["font"]) {
        // It would be nice for the specific properties to override the
        // shorthand, but it would complicate things a bit.
        ctx.font = declarations["font"].replace(/\d+(?:\.\d+)?/, s => `${+s * scale}`);
    }
    else {
        if (declarations["font-size"]) {
            fontSize = declarations["font-size"].replace(/^\d[\d.]*/, m => `${+m * scale}`);
        }

        if (declarations["font-weight"]) {
            fontWeight = declarations["font-weight"];
        }

        if (declarations["font-family"]) {
            fontFamily = declarations["font-family"];
        }

        ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;
    }
}
