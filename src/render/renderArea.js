import { isSelfClosing } from "../geometry";
import { renderText } from "./renderText";
import { getCentrePoint } from "./util";

/** @typedef {import("../Style").StyleRule} StyleRule */
/** @typedef {import("../Overpass").OverpassElement} OverpassElement */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {StyleRule} rule
 * @param {[number, number][]} points
 * @param {OverpassElement} element
 */
export function renderArea(ctx, rule, points, element = null) {
    if (points.length === 0)
        return;

    ctx.fillStyle = rule.declarations["fill"];
    ctx.strokeStyle = rule.declarations["stroke"];
    ctx.lineWidth = +rule.declarations["stroke-width"] * devicePixelRatio;

    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(...points[i]);
    }

    if (!isSelfClosing(points)) {
        ctx.lineTo(...points[0]);
    }

    rule.declarations["fill"] && ctx.fill();
    rule.declarations["stroke"] && ctx.stroke();

    // Text Handling
    if (rule.declarations["content"]) {
        // for area find centre-point
        renderText(ctx, rule, getCentrePoint(points), element);
    }
}
