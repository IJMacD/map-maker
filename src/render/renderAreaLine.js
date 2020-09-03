import { isSelfClosing } from "../geometry";
import { getCentrePoint } from "./util";
import { renderPoint } from "./renderPoint";
import { applyTransform } from "./transform";

/** @typedef {import("../Style").StyleRule} StyleRule */
/** @typedef {import("../Overpass").OverpassElement} OverpassElement */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {StyleRule} rule
 * @param {[number, number][]} points
 * @param {(points: [number, number][]) => [number, number]} getPoint
 * @param {OverpassElement} element
 */
export function renderAreaLine(ctx, rule, points, getPoint, element = null) {
    if (points.length === 0)
        return;

    ctx.save();

    const { fillStyle, strokeStyle, lineWidth } = parseStrokeFill(rule);

    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;

    let offsetX = 0;
    let offsetY = 0;

    if (rule.declarations["transform"]) {
        // Extra work required if we're transforming

        // First get transform origin;
        const cp = getPoint(points);

        // Set offset to adjust all points later
        offsetX = cp[0];
        offsetY = cp[1];

        // Translate the canvas
        ctx.translate(offsetX, offsetY);

        // Apply the transformation
        applyTransform(ctx, rule);
    }

    ctx.beginPath();
    ctx.moveTo(points[0][0] - offsetX, points[0][1] - offsetY);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0] - offsetX, points[i][1] - offsetY);
    }

    rule.declarations["fill"] && ctx.fill();
    rule.declarations["stroke"] && ctx.stroke();

    ctx.restore();

    // Text Handling, Icons etc.
    if (rule.declarations["content"] || rule.declarations["size"] || rule.declarations["path"] || rule.declarations["icon"]) {
        ctx.save();
        renderPoint(ctx, rule, getPoint(points), element);
        ctx.restore();
    }
}

function parseStrokeFill(rule) {
    const fillStyle = rule.declarations["fill"];
    let strokeStyle = rule.declarations["stroke"];
    let lineWidth;

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

    if (rule.declarations["stroke-width"]) {
        lineWidth = +rule.declarations["stroke-width"] * devicePixelRatio;
    }

    return {
        fillStyle,
        strokeStyle,
        lineWidth,
    };
}

