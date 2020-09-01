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

    if (rule.declarations["position"] === "absolute") {
        x = (parseFloat(rule.declarations["top"]) || 0) * devicePixelRatio;
        y = (parseFloat(rule.declarations["left"]) || 0) * devicePixelRatio;
    }

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

        // Because the image is drawn in a callback the render context state is lost
        // We need to readjust realitve moves ourselves here
        let offsetLeft = 0;
        let offsetTop = 0;
        if (rule.declarations["position"] === "relative") {
            offsetTop = (parseFloat(rule.declarations["top"]) || 0) * devicePixelRatio;
            offsetLeft = (parseFloat(rule.declarations["left"]) || 0) * devicePixelRatio;
        }

        img.addEventListener("load", () => {
            const dpr = devicePixelRatio;
            if (h) {
                ctx.drawImage(img, x + offsetLeft, y + offsetTop, w * dpr, h * dpr);
            } else if (w) {
                const h2 = img.height * (w / img.width);
                ctx.drawImage(img, x + offsetLeft, y + offsetTop, w * dpr, h2 * dpr);
            }
            else {
                ctx.drawImage(img, x + offsetLeft, y + offsetTop);
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
    const segs = /([MLQCVHZ])\s*(-?\d+(?:\.\d+)?)?\s*(-?\d+(?:\.\d+)?)?\s*(-?\d+(?:\.\d+)?)?\s*(-?\d+(?:\.\d+)?)?\s*(-?\d+(?:\.\d+)?)?\s*(-?\d+(?:\.\d+)?)?/ig;
    let match;
    /** @type {[number, number]} */
    let first;
    /** @type {[number, number]} */
    let prev;

    while (match = segs.exec(pathSpec)) {
        const x = parseFloat(match[2]) * devicePixelRatio;
        const y = parseFloat(match[3]) * devicePixelRatio;
        const x2 = parseFloat(match[4]) * devicePixelRatio;
        const y2 = parseFloat(match[5]) * devicePixelRatio;
        const x3 = parseFloat(match[6]) * devicePixelRatio;
        const y3 = parseFloat(match[7]) * devicePixelRatio;

        if (!first) first = [x,y];

        if (match[1] === "M") {
            prev = [x,y];
            ctx.moveTo(x, y);
        }
        else if (match[1] === "L") {
            prev = [x,y];
            ctx.lineTo(x, y);
        }
        else if (match[1] === "Q") {
            prev = [x2,y2];
            ctx.quadraticCurveTo(x, y, x2, y2);
        }
        else if (match[1] === "C") {
            prev = [x3,y3];
            ctx.bezierCurveTo(x, y, x2, y2, x3, y3);
        }
        else if (match[1] === "Z") {
            prev = first;
            ctx.lineTo(...prev);
        }
        else if (match[1] === "V") {
            prev = [prev[0], x];
            ctx.lineTo(...prev);
        }
        else if (match[1] === "H") {
            prev = [x, prev[1]];
            ctx.lineTo(...prev);
        }
        else if (match[1] === "m") {
            prev = [prev[0] + x, prev[1] + y];
            ctx.moveTo(...prev);
        }
        else if (match[1] === "l") {
            prev = [prev[0] + x, prev[1] + y];
            ctx.lineTo(...prev);
        }
        else if (match[1] === "q") {
            ctx.quadraticCurveTo(prev[0] + x, prev[1] + y, prev[0] + x2, prev[1] + y2);
            prev = [prev[0] + x2, prev[1] + y2];
        }
        else if (match[1] === "c") {
            prev = [x3,y3];
            ctx.bezierCurveTo(prev[0] + x, prev[1] + y, prev[0] + x2, prev[1] + y2, prev[0] + x3, prev[1] + y3);
            prev = [prev[0] + x3, prev[1] + y3];
        }
        else if (match[1] === "z") {
            prev = first;
            ctx.lineTo(...first);
        }
        else if (match[1] === "v") {
            prev = [prev[0], prev[1] + x];
            ctx.lineTo(...prev);
        }
        else if (match[1] === "h") {
            prev = [prev[0] + x, prev[1]];
            ctx.lineTo(...prev);
        }
    }
}