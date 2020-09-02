import { getMidPoint } from "./util";
import { renderAreaLine } from "./renderAreaLine";

/** @typedef {import("../Style").StyleRule} StyleRule */
/** @typedef {import("../Overpass").OverpassElement} OverpassElement */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {StyleRule} rule
 * @param {[number, number][]} points
 * @param {OverpassElement} element
 */
export function renderLine(ctx, rule, points, element = null) {
    renderAreaLine(ctx, rule, points, getMidPoint, element);
}
