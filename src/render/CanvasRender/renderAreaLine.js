import { renderPoint } from "./renderPoint";
import { applyTransform } from "./transform";
import { setStrokeFill } from "./setStrokeFill";
import { handleCollisionProperties, hasPointProperties } from "../util";

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {StyleRule} rule
 * @param {Point[]} points
 * @param {Point|((points: Point[]) => Point)} origin Can be a function for lazy evaluation
 * @param {OverpassElement?} element
 * @param {MapContext} context
 */
export function renderAreaLine(ctx, rule, points, origin, element = null, context) {
    if (points.length === 0)
        return;

    if (!handleCollisionProperties(rule, points)) {
        return;
    }

    ctx.save();

    setStrokeFill(ctx, rule, element, context);

    ctx.lineCap = "square";

    let offsetX = 0;
    let offsetY = 0;

    const { scale } = context;

    if (rule.declarations["transform"]) {
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
        applyTransform(ctx, rule, scale);
    }

    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
        let x = points[i][0] - offsetX;
        let y = points[i][1] - offsetY;
        ctx.lineTo(x * scale, y * scale);
    }

    rule.declarations["fill"] && ctx.fill();
    rule.declarations["stroke"] && ctx.stroke();

    ctx.restore();

    // Text Handling, Icons etc.
    if (hasPointProperties(rule)) {
        ctx.save();
        if (origin instanceof Function) {
            origin = origin(points);
        }
        renderPoint(ctx, rule, origin, element, context);
        ctx.restore();
    }
}
