import { evaluateValue } from "./evaluate";

/**
 * @param {import("./Style").StyleRule} rule
 * @param {import("./Overpass").OverpassElement} element
 * @param {import("./MapRenderer").MapContext} context
 */
export function parseStrokeFill(rule, element, context) {
    const fillStyle = evaluateValue(rule.declarations["fill"], element, context);
    let strokeStyle = evaluateValue(rule.declarations["stroke"], element, context);
    let lineWidth;
    /** @type {number[]} */
    let lineDash;

    const { scale } = context;

    if (strokeStyle) {
        // Numbers in e.g. rgba(128,64,0,0.2) confuse it
        let mutedStyle = strokeStyle.replace(/\([^)]*\)/g, ss => " ".repeat(ss.length));

        // So would hex colour strings
        mutedStyle = mutedStyle.replace(/#[0-9a-f]{3}/i, "    ");
        mutedStyle = mutedStyle.replace(/#[0-9a-f]{6}/i, "       ");

        /**
         * @todo A better parser would probably be nice
         */
        const swRe = /(\d+(?:\.\d+)?)\s*(?:px)?/;
        const sm = swRe.exec(mutedStyle);
        if (sm) {
            lineWidth = +sm[1] * scale;
            strokeStyle = strokeStyle.replace(sm[0], "");
        }
    }

    if (rule.declarations["stroke-width"]) {
        lineWidth = +rule.declarations["stroke-width"] * scale;
    }

    if (rule.declarations["stroke-dash"]) {
        lineDash = rule.declarations["stroke-dash"].split(" ").map(s => +s * scale);
    }

    return {
        fillStyle,
        strokeStyle,
        lineWidth,
        lineDash,
    };
}