import { parseStrokeFill } from '../parseStrokeFill';

/**
 * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} ctx
 * @param {import("../Style").StyleRule} rule
 */
export function setStrokeFill (ctx, rule, scale) {
    const { fillStyle, strokeStyle, lineWidth, lineDash } = parseStrokeFill(rule, scale);

    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    if (lineDash) {
        ctx.setLineDash(lineDash);
    }
}