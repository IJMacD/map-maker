import { renderPoint } from "./renderPoint";
import { applyTransform } from "./transform";
import { setStrokeFill } from "./setStrokeFill";
import { handleCollisionProperties, hasPointProperties } from "../util";
import { rectToPoints } from "../../util/geometry";
import { roundedRect } from "./roundedRect";

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ [property: string]: string }} declarations
 * @param {BoundingBox} bounding [x, y, width, height] [x, y] is top left
 * @param {Point|((points: Point[]) => Point)} origin Can be a function for lazy evaluation
 * @param {OverpassElement?} element
 * @param {MapContext} context
 */
export function renderRect(ctx, declarations, bounding, origin, element = null, context) {
    let [x, y, width, height] = bounding;
    const { scale } = context;

    const padding = declarations["padding"] ? parseFloat(declarations["padding"]) * scale : 0;

    x -= padding;
    y -= padding;
    width += padding * 2;
    height += padding * 2;

    if (!handleCollisionProperties(declarations, [x, y, width, height])) {
        return;
    }

    ctx.save();

    setStrokeFill(ctx, declarations, element, context);

    let offsetX = 0;
    let offsetY = 0;

    if (declarations["transform"]) {
        // Extra work required if we're transforming

        // First get transform origin;
        if (origin instanceof Function) {
            const points = rectToPoints(x, y, width, height);
            origin = origin(points);
        }

        // Set offset to adjust all points later
        offsetX = origin[0];
        offsetY = origin[1];

        // Translate the canvas
        ctx.translate(offsetX, offsetY);

        // Apply the transformation
        applyTransform(ctx, declarations, scale);
    }

    if (declarations["corner-radius"]) {
        roundedRect(ctx, (x - offsetX) * scale, (y - offsetY) * scale, width * scale, height * scale, +declarations["corner-radius"] * scale);
    }
    else {
        ctx.beginPath();
        ctx.rect((x - offsetX) * scale, (y - offsetY) * scale, width * scale, height * scale);
    }

    declarations["fill"] && ctx.fill();
    declarations["stroke"] && ctx.stroke();

    ctx.restore();

    // Text Handling, Icons etc.
    if (hasPointProperties(declarations)) {
        ctx.save();
        if (origin instanceof Function) {
            const points = rectToPoints(x, y, width, height);
            origin = origin(points);
        }
        renderPoint(ctx, declarations, origin, element, context);
        ctx.restore();
    }
}
