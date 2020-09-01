import { isSelfClosing } from "../geometry";
import { renderLine } from "./renderLine";

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
    const p = isSelfClosing(points) ? points : [...points, points[0]];
    renderLine(ctx, rule, p, element);
}
