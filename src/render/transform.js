/** @typedef {import("../Style").StyleRule} StyleRule */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {StyleRule} rule
 */
export function applyTransform(ctx, rule) {
    if (rule.declarations["transform"]) {
        const m = /matrix\(([-\d,.\s]*)\)/.exec(rule.declarations["transform"]);
        if (m) {
            const p = m[1].split(",");
            ctx.transform(+p[0], +p[1], +p[2], +p[3], +p[4], +p[5]);
        }
    }
}
