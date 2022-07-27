import { evaluateDimension } from "../../util/evaluate";
import { renderText } from "./renderText";
import { setStrokeFill } from "./setStrokeFill";
import { applyTransform } from "./transform";

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ [property: string]: string }} declarations
 * @param {[number, number]} position
 * @param {OverpassElement?} element
 * @param {MapContext} context
 */
export function renderPoint(ctx, declarations, [x, y], element, context) {
    ctx.save();

    const { scale } = context;

    setStrokeFill(ctx, declarations, element, context);

    if (declarations["position"] === "absolute") {
        x = parseFloat(declarations["left"]) || 0;
        y = parseFloat(declarations["top"]) || 0;
    }

    ctx.translate(x * scale, y * scale);

    applyTransform(ctx, declarations, scale);

    if (declarations["size"]) {
        const shape = declarations["shape"] ?? "circle";

        ctx.beginPath();

        const r = +evaluateDimension(declarations["size"], element, context) * scale;

        if (shape === "square") {
            ctx.moveTo(-r, -r);
            ctx.lineTo(r, -r);
            ctx.lineTo(r, r);
            ctx.lineTo(-r, r);
            ctx.closePath();
        }
        else if (shape === "triangle") {
            const t = Math.cos(30/180*Math.PI);
            ctx.moveTo(-r, r*t*0.5);
            ctx.lineTo(0, -r/t);
            ctx.lineTo(r, r*t*0.5);
            ctx.closePath();
        }
        else if (shape === "ellipse") {
            ctx.ellipse(0, 0, 2 * r, r, 0, 0, Math.PI * 2);
        }
        else {
            ctx.ellipse(0, 0, r, r, 0, 0, Math.PI * 2);
        }

        declarations["fill"] && ctx.fill();
        declarations["stroke"] && ctx.stroke();
    }

    if (declarations["path"]) {
        ctx.beginPath();

        drawPath(ctx, declarations["path"], scale);

        declarations["fill"] && ctx.fill();
        declarations["stroke"] && ctx.stroke();
    }

    // Syntax:
    //  url(<URL>) [<width> [<height>]]
    //  url(https://ijmacd.github.io/map-maker/logo192.png) 90px 120px;
    const urlRe = /url\(([^)]+)\)(?:\s+([^\s]+)(?:\s+([^\s]+))?)?/;
    if (urlRe.test(declarations["icon"])) {
        const m = urlRe.exec(declarations["icon"]);
        const url = m[1];
        const img = new Image();
        img.src = url;
        const w = parseFloat(m[2]);
        const h = parseFloat(m[3]);


        img.addEventListener("load", () => {
            // The image is drawn in a callback so the render context state is lost
            ctx.save();
            // globalSetup(ctx, declarations);

            ctx.translate(x, y);

            // applyTransform(ctx, declarations);

            if (w) {
                const height = !isNaN(h) ? h : img.height * (w / img.width);
                ctx.drawImage(img, 0, 0, w * scale, height * scale);
            }
            else {
                ctx.drawImage(img, 0, 0);
            }

            ctx.restore();
        });
    }

    if (declarations["content"]) {
        renderText(ctx, declarations, [0, 0], element, context);
    }

    ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} pathSpec
 */
function drawPath (ctx, pathSpec, scale) {
    const segs = /([MLQCVHZ])\s*(-?\d+(?:\.\d+)?)?\s*(-?\d+(?:\.\d+)?)?\s*(-?\d+(?:\.\d+)?)?\s*(-?\d+(?:\.\d+)?)?\s*(-?\d+(?:\.\d+)?)?\s*(-?\d+(?:\.\d+)?)?/ig;
    let match;
    /** @type {[number, number]} */
    let first;
    /** @type {[number, number]} */
    let prev;

    while (match = segs.exec(pathSpec)) {
        const x = parseFloat(match[2]) * scale;
        const y = parseFloat(match[3]) * scale;
        const x2 = parseFloat(match[4]) * scale;
        const y2 = parseFloat(match[5]) * scale;
        const x3 = parseFloat(match[6]) * scale;
        const y3 = parseFloat(match[7]) * scale;

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