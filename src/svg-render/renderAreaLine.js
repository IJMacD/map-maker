// import { renderPoint } from "./renderPoint";
// import { applyTransform } from "./transform";
import { parseStrokeFill } from "../parseStrokeFill";
import { getBoundingBox } from "../util";
import CollisionSystem from "../CollisionSystem";

/** @typedef {import("../Style").StyleRule} StyleRule */
/** @typedef {import("../Overpass").OverpassElement} OverpassElement */

/**
 * @param {{ elements: { type: string, [key: string]: string }[] }} layer
 * @param {StyleRule} rule
 * @param {[number, number][]} points
 * @param {(points: [number, number][]) => [number, number]} getPoint
 * @param {OverpassElement} element
 */
export function renderAreaLine(layer, rule, points, getPoint, element = null, context = {}) {
    if (points.length === 0)
        return;


    if (rule.declarations["collision-set"]) {
        const box = getBoundingBox(points);

        const collisionSystem = CollisionSystem.getCollisionSystem();

        if (!collisionSystem.add(rule.declarations["collision-set"], box)) {
            const policy = rule.declarations["collision-policy"] || "hide";

            if (policy === "hide") {
                return;
            }
        }
    }

    // ctx.save();

    const path = { type: "path" };

    const colours = parseStrokeFill(rule);

    path.stroke = colours.strokeStyle;
    path.fill = colours.fillStyle || "none";

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
        // ctx.translate(offsetX, offsetY);

        // Apply the transformation
        // applyTransform(path, rule);

        path.transform = rule.declarations["transform"];
    }

    const d = [];

    d.push(`M ${(points[0][0] - offsetX).toFixed(2)} ${(points[0][1] - offsetY).toFixed(2)}`);
    for (let i = 1; i < points.length; i++) {
        d.push(`L ${(points[i][0] - offsetX).toFixed(2)} ${(points[i][1] - offsetY).toFixed(2)}`);
    }

    path.d = d.join(" ");

    layer.elements.push(path);

    // Text Handling, Icons etc.
    if (rule.declarations["content"] || rule.declarations["size"] || rule.declarations["path"] || rule.declarations["icon"]) {
        this.renderPoint(context, rule, getPoint(points), element);
    }
}


