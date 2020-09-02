import { isSelfClosing } from "../geometry";
import { getCentrePoint } from "./util";
import { renderAreaLine } from "./renderAreaLine";

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

    if (!isSelfClosing(points)) {
        points = [ ...points, points[0] ];
    }

    renderAreaLine(ctx, rule, points, getCentrePoint, element);
}
