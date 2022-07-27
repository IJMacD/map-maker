import { getBoundingBox } from "../../util/util";
import CollisionSystem from "../../Classes/CollisionSystem";


/**
 * @param {{ elements: { type: string, [key: string]: string }[] }} layer
 * @param {{ [property: string]: string }} declarations
 * @param {[number, number][]} points
 * @param {(points: [number, number][]) => [number, number]} getPoint
 * @param {OverpassElement?} element
 */
export function renderAreaLine(layer, declarations, points, getPoint, element = null, context = {}) {
    if (points.length === 0)
        return;


    if (declarations["collision-set"]) {
        const box = getBoundingBox(points);

        const collisionSystem = CollisionSystem.getCollisionSystem();

        if (!collisionSystem.add(declarations["collision-set"], box)) {
            const policy = declarations["collision-policy"] || "hide";

            if (policy === "hide") {
                return;
            }
        }
    }

    const path = { type: "path" };

    let offsetX = 0;
    let offsetY = 0;

    if (declarations["transform"]) {
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

        path.transform = declarations["transform"];
    }

    const d = [];

    d.push(`M ${(points[0][0] - offsetX).toFixed(2)} ${(points[0][1] - offsetY).toFixed(2)}`);
    for (let i = 1; i < points.length; i++) {
        d.push(`L ${(points[i][0] - offsetX).toFixed(2)} ${(points[i][1] - offsetY).toFixed(2)}`);
    }

    path.d = d.join(" ");

    layer.elements.push(path);

    // Text Handling, Icons etc.
    if (declarations["content"] || declarations["size"] || declarations["path"] || declarations["icon"]) {
        // this.renderPoint(context, rule, getPoint(points), element);
    }
}


