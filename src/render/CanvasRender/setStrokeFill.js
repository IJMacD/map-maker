import { parseStrokeFill } from '../../util/parseStrokeFill';

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {StyleRule} rule
 * @param {OverpassElement?} element
 * @param {MapContext} context
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