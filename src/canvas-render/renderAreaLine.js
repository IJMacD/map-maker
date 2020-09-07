import { renderPoint } from "./renderPoint";
import { applyTransform } from "./transform";
import { setStrokeFill } from "./setStrokeFill";
import { getBoundingBox } from "../util";
import CollisionSystem from "../CollisionSystem";

/** @typedef {import("../Style").StyleRule} StyleRule */
/** @typedef {import("../Overpass").OverpassElement} OverpassElement */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {StyleRule} rule
 * @param {[number, number][]} points
 * @param {(points: [number, number][]) => [number, number]} getPoint
 * @param {OverpassElement} element
 */
export function renderAreaLine(ctx, rule, points, getPoint, element = null, context = {}) {
    if (points.length === 0)
        return;


    if (rule.declarations["collision-set"]) {
        const box = getBoundingBox(points);

        if (rule.declarations["collision-size"]) {
            const s = /(\d+\.?\d*)%/.exec(rule.declarations["collision-size"]);

            const scaleFactor = +s[1] / 100;
            const w = box[2];
            const h = box[3];

            box[0] += (1 - scaleFactor) * w / 2;
            box[1] += (1 - scaleFactor) * h / 2;
            box[2] = w * scaleFactor;
            box[3] = h * scaleFactor;
        }

        const collisionSystem = CollisionSystem.getCollisionSystem();

        if (!collisionSystem.add(rule.declarations["collision-set"], box)) {
            const policy = rule.declarations["collision-policy"] || "hide";

            if (policy === "hide") {
                return;
            }
        }
    }

    ctx.save();

    setStrokeFill(ctx, rule, context.scale);

    let offsetX = 0;
    let offsetY = 0;

    if (rule.declarations["transform"]) {
        // Extra work required if we're transforming

        // First get transform origin;
        const cp = getPoint(points);

        // Set offset to adjust all points later
        offsetX = cp[0];
        offsetY = cp[1];

        // Translate the canvas
        ctx.translate(offsetX, offsetY);

        // Apply the transformation
        applyTransform(ctx, rule, context.scale);
    }

    ctx.beginPath();
    ctx.moveTo(points[0][0] - offsetX, points[0][1] - offsetY);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0] - offsetX, points[i][1] - offsetY);
    }

    rule.declarations["fill"] && ctx.fill();
    rule.declarations["stroke"] && ctx.stroke();

    ctx.restore();

    // Text Handling, Icons etc.
    if (rule.declarations["content"] || rule.declarations["size"] || rule.declarations["path"] || rule.declarations["icon"]) {
        ctx.save();
        renderPoint(ctx, rule, getPoint(points), element, context);
        ctx.restore();
    }
}


