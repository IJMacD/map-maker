import { parseStrokeFill } from '../../util/parseStrokeFill';

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ [property: string]: string }} declarations
 * @param {OverpassElement?} element
 * @param {MapContext} context
 */
export function setStrokeFill (ctx, declarations, element, context) {
    const { fillStyle, strokeStyle, lineWidth, lineDash } = parseStrokeFill(declarations, element, context);

    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    if (lineDash) {
        ctx.setLineDash(lineDash);
    }
}