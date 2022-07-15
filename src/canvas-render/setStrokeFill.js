import { parseStrokeFill } from '../parseStrokeFill';

/**
 * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} ctx
 * @param {import("../Style").StyleRule} rule
 * @param {import('.').OverpassElement} element
 * @param {import('../MapRenderer').MapContext} context
 */
export function setStrokeFill (ctx, rule, element, context) {
    const { fillStyle, strokeStyle, lineWidth, lineDash } = parseStrokeFill(rule, element, context);

    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    if (lineDash) {
        ctx.setLineDash(lineDash);
    }
}