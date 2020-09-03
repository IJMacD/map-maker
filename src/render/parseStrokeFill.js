export function parseStrokeFill(rule) {
    const fillStyle = rule.declarations["fill"];
    let strokeStyle = rule.declarations["stroke"];
    let lineWidth;

    if (strokeStyle) {
        // Numbers in e.g. rgba(128,64,0,0.2) confuse it
        let mutedStyle = strokeStyle.replace(/\([^)]*\)/g, ss => " ".repeat(ss.length));

        // So would hex colour strings
        mutedStyle = mutedStyle.replace(/#[0-9a-f]{3}/, "    ");
        mutedStyle = mutedStyle.replace(/#[0-9a-f]{6}/, "       ");

        /**
         * @todo A better parser would probably be nice
         */
        const swRe = /(\d+(?:\.\d+)?)\s*(?:px)?/;
        const sm = swRe.exec(mutedStyle);
        if (sm) {
            lineWidth = +sm[1] * devicePixelRatio;
            strokeStyle = strokeStyle.replace(sm[0], "");
        }
    }

    if (rule.declarations["stroke-width"]) {
        lineWidth = +rule.declarations["stroke-width"] * devicePixelRatio;
    }

    return {
        fillStyle,
        strokeStyle,
        lineWidth,
    };
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {import("../Style").StyleRule} rule
 */
export function setStrokeFill (ctx, rule) {
    const { fillStyle, strokeStyle, lineWidth } = parseStrokeFill(rule);

    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
}