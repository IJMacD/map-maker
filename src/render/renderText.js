/** @typedef {import("../Style").StyleRule} StyleRule */
/** @typedef {import("../Overpass").OverpassElement} OverpassElement */

import { setStrokeFill } from "./parseStrokeFill";

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {StyleRule} rule
 * @param {[number, number]} param2
 * @param {OverpassElement} [element]
 */
export function renderText(ctx, rule, [x, y], element = null) {
    setStrokeFill(ctx, rule);

    let content = getContent(rule, element);

    setFont(ctx, rule);

    if (rule.declarations["text-align"]) {
        const textWidth = ctx.measureText(content).width;

        if (rule.declarations["text-align"] === "center" || rule.declarations["text-align"] === "centre") {
            x -= textWidth / 2;
        }
        else if (rule.declarations["text-align"] === "right") {
            x -= textWidth;
        }
    }

    if (rule.declarations["text-color"]) {
        ctx.fillStyle = rule.declarations["text-color"];
        ctx.fillText(content, x, y);
    }
    else {
        if (rule.declarations["stroke"])
            ctx.strokeText(content, x, y);
        if (rule.declarations["fill"] || !rule.declarations["stroke"])
            ctx.fillText(content, x, y);
    }
}

export function setFont(ctx, rule) {
    let fontSize = `${10 * devicePixelRatio}px`;
    let fontWeight = "normal";
    let fontFamily = "sans-serif";

    if (rule.declarations["font-size"]) {
        fontSize = rule.declarations["font-size"].replace(/^\d[\d.]*/, m => `${+m * devicePixelRatio}`);
    }

    if (rule.declarations["font-weight"]) {
        fontWeight = rule.declarations["font-weight"];
    }

    if (rule.declarations["font-family"]) {
        fontFamily = rule.declarations["font-family"];
    }

    ctx.font = rule.declarations["font"] || `${fontWeight} ${fontSize} ${fontFamily}`;
}

/**
 * @param {StyleRule} rule
 * @param {import("../Overpass").OverpassElement} element
 */
export function getContent(rule, element) {
    let content = rule.declarations["content"];

    if (!content) return "";

    if (content.match(/^".*"$/g)) {
        content = content.replace(/^"|"$/g, "");
    }
    else if (content.match(/tag\(([^)]+)\)/)) {
        const m = content.match(/tag\(([^)]+)\)/);
        content = element.tags[m[1]] || "";
    }
    else {
        content = "?";
    }
    return content;
}

