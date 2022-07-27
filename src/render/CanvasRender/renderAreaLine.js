import { renderPoint } from "./renderPoint";
import { applyTransform } from "./transform";
import { setStrokeFill } from "./setStrokeFill";
import { handleCollisionProperties, hasPointProperties } from "../util";

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ [property: string]: string }} declarations
 * @param {Point[]} points
 * @param {Point|((points: Point[]) => Point)} origin Can be a function for lazy evaluation
 * @param {OverpassElement?} element
 * @param {MapContext} context
 */
export function renderAreaLine(ctx, declarations, points, origin, element = null, context) {
    if (points.length === 0)
        return;

    if (!handleCollisionProperties(declarations, points)) {
        return;
    }

    ctx.save();

    setStrokeFill(ctx, declarations, element, context);

    ctx.lineCap = "square";

    let offsetX = 0;
    let offsetY = 0;

    const { scale } = context;

    if (declarations["transform"]) {
        // Extra work required if we're transforming

        // First get transform origin;
        if (origin instanceof Function) {
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


    if (declarations["stroke"] === "rainbow") {
        for (let i = 1; i < points.length; i++) {
            ctx.beginPath();
            let x1 = points[i-1][0] - offsetX;
            let y1 = points[i-1][1] - offsetY;
            ctx.moveTo(x1 * scale, y1 * scale);
            let x2 = points[i][0] - offsetX;
            let y2 = points[i][1] - offsetY;
            ctx.lineTo(x2 * scale, y2 * scale);

            ctx.strokeStyle = `hsl(${i%360}, 100%, 50%)`;
            ctx.stroke();
        }
    }
    else if (declarations["fill"] || declarations["stroke"]) {
        ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
            let x = points[i][0] - offsetX;
            let y = points[i][1] - offsetY;
            ctx.lineTo(x * scale, y * scale);
        }

        declarations["fill"] && ctx.fill(/** @type {CanvasFillRule} */(declarations["fill-rule"] ?? "evenodd"));
        declarations["stroke"] && ctx.stroke();
    }

    ctx.restore();

    // Text Handling, Icons etc.
    if (hasPointProperties(declarations)) {
        ctx.save();
        if (origin instanceof Function) {
            origin = origin(points);
        }
        renderPoint(ctx, declarations, origin, element, context);
        ctx.restore();
    }
}
