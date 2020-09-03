import { rectToPoints } from "../geometry";
import { renderPoint } from "./renderPoint";
import { renderArea } from "./renderArea";
import { getCentrePoint, getMidPoint, getAveragePoint, getBoundingBox } from "./util";
import { setFont, getContent } from "./renderText";
import { renderAreaLine } from "./renderAreaLine";

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {import("../Style").StyleRule} rule
 * @param {import("../Overpass").OverpassElement} element
 * @param {import("../Overpass").OverpassNodeElement[]} nodes
 * @param {[number, number][]} points
 */
export function renderPsuedoElement(ctx, rule, element, nodes, points) {
    if (rule.selector.pseudoElement === "centre" || rule.selector.pseudoElement === "center") {
        // Centre of bounding box
        const centrePoint = getCentrePoint(points);
        renderPoint(ctx, rule, centrePoint, element);
    }
    else if (rule.selector.pseudoElement === "mid-point") {
        // N/2th point (median point)
        const midPoint = getMidPoint(points);
        renderPoint(ctx, rule, midPoint, element);
    }
    else if (rule.selector.pseudoElement === "average-point") {
        // Average of all points
        const avgPoint = getAveragePoint(points);
        renderPoint(ctx, rule, avgPoint, element);
    }
    else if (rule.selector.pseudoElement === "start") {
        // First point
        renderPoint(ctx, rule, points[0], element);
    }
    else if (rule.selector.pseudoElement === "end") {
        // Last point
        renderPoint(ctx, rule, points[points.length - 1], element);
    }
    else if (rule.selector.pseudoElement === "centre-of-mass") {
        // TODO: calculate centre-of-mass
        // const avgPoint = getCOMPoint(points);
        // renderPoint(ctx, rule, avgPoint, element);
    }
    else if (rule.selector.pseudoElement === "bounding-box") {
        const bounding = getBoundingBox(points);

        const boundingPoints = rectToPoints(...bounding);

        renderArea(ctx, rule, boundingPoints, element);
    }
    else if (rule.selector.pseudoElement === "content-box") {
        setFont(ctx, rule);
        const content = getContent(rule, element);
        const size = ctx.measureText(content);
        let [ x, y ] = points[0];
        const { width, actualBoundingBoxDescent: desc, actualBoundingBoxAscent: asc } = size;
        const padding = rule.declarations["padding"] ? parseFloat(rule.declarations["padding"]) * devicePixelRatio : 0;

        if (rule.declarations["text-align"] === "center" || rule.declarations["text-align"] === "centre") {
            x -= width / 2;
        }
        else if (rule.declarations["text-align"] === "right") {
            x -= width;
        }

        /** @type {[number, number][]} */
        const boundPoints = [
            [ x - padding,           y - asc - padding ],     // Top Left
            [ x - padding,           y + desc + padding ],    // Bottom left
            [ x + width + padding,   y + desc + padding ],    // Bottom right
            [ x + width + padding,   y - asc - padding ],     // Top Right
        ];

        // Close self
        boundPoints.push(boundPoints[0]);

        renderAreaLine(ctx, rule, boundPoints, () => points[0], element);
    }
}
