import { renderText } from "./renderText";

/** @typedef {import("../Style").StyleRule} StyleRule */
/** @typedef {import("../Overpass").OverpassElement} OverpassElement */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {StyleRule} rule
 * @param {[number, number]} position
 * @param {OverpassElement} element
 */
export function renderPoint(ctx, rule, [x, y], element = null) {
    ctx.fillStyle = rule.declarations["fill"];
    ctx.strokeStyle = rule.declarations["stroke"];
    ctx.lineWidth = +rule.declarations["stroke-width"] * devicePixelRatio;

    if (rule.declarations["size"]) {
        ctx.beginPath();

        const r = +rule.declarations["size"] * devicePixelRatio;

        ctx.ellipse(x, y, r, r, 0, 0, Math.PI * 2);

        rule.declarations["fill"] && ctx.fill();
        rule.declarations["stroke"] && ctx.stroke();
    }

    if (rule.declarations["path"]) {
        ctx.save();

        ctx.translate(x, y);

        ctx.beginPath();

        drawPath(ctx, rule.declarations["path"]);

        rule.declarations["fill"] && ctx.fill();
        rule.declarations["stroke"] && ctx.stroke();

        ctx.restore();
    }

    // Syntax:
    //  url(<URL>) [<width> [<height>]]
    //  url(https://ijmacd.github.io/map-maker/logo192.png) 90px 120px;
    const urlRe = /url\(([^)]+)\)(?:\s+([^\s]+)(?:\s+([^\s]+))?)?/;
    if (urlRe.test(rule.declarations["icon"])) {
        const m = urlRe.exec(rule.declarations["icon"]);
        const url = m[1];
        const img = new Image();
        img.src = url;
        const w = parseFloat(m[2]);
        const h = parseFloat(m[3]);
        img.addEventListener("load", () => {
            const dpr = devicePixelRatio;
            if (h) {
                ctx.drawImage(img, x, y, w * dpr, h * dpr);
            } else if (w) {
                const h2 = img.height * (w / img.width);
                ctx.drawImage(img, x, y, w * dpr, h2 * dpr);
            }
            else {
                ctx.drawImage(img, x, y);
            }
        });
    }

    if (rule.declarations["content"]) {
        renderText(ctx, rule, [x, y], element);
    }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} pathSpec
 */
function drawPath (ctx, pathSpec) {
    const segs = /([ML])\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g;
    let match;

    while (match = segs.exec(pathSpec)) {
        const x = parseFloat(match[2]) * devicePixelRatio;
        const y = parseFloat(match[3]) * devicePixelRatio;

        if (match[1] === "M") ctx.moveTo(x, y);
        else if (match[1] === "L") ctx.lineTo(x, y);
    }
}