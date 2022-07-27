
/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {MapContext} context
 * @param {{ [property: string]: string }} declarations
 */
export function commonProperties (ctx, { scale }, declarations) {
    if (declarations["opacity"])
        ctx.globalAlpha = +declarations["opacity"];

    if (declarations["position"] === "relative") {
        const top = (parseFloat(declarations["top"]) || 0) * scale;
        const left = (parseFloat(declarations["left"]) || 0) * scale;

        ctx.translate(left, top);
    }
}