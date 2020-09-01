import { renderText } from "./renderText";

/** @typedef {import("../Style").StyleRule} StyleRule */
/** @typedef {import("../Overpass").OverpassElement} OverpassElement */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {StyleRule} rule
 * @param {[number, number]} position
 * @param {OverpassElement} element
 */
export function renderPoint(ctx, rule, [x, y], element = null) {
    ctx.fillStyle = rule.declarations["fill"];
    ctx.strokeStyle = rule.declarations["stroke"];
    ctx.lineWidth = +rule.declarations["stroke-width"] * devicePixelRatio;

    ctx.beginPath();

    const r = +rule.declarations["size"] * devicePixelRatio;

    ctx.ellipse(x, y, r, r, 0, 0, Math.PI * 2);

    rule.declarations["fill"] && ctx.fill();
    rule.declarations["stroke"] && ctx.stroke();

    if (rule.declarations["content"]) {
        renderText(ctx, rule, [x, y], element);
    }
}
