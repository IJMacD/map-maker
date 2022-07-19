import MapRenderer from "../MapRenderer";
import { renderPoint } from "./renderPoint";
import { setFont } from "./renderText";
import { renderAreaLine } from "./renderAreaLine";

export default class CanvasRender extends MapRenderer {

    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor (canvas) {
        super();
        this.canvas = canvas;
    }

    clear (context) {
        const { width, height, scale } = context;

        this.canvas.width = width * scale;
        this.canvas.height = height * scale;

        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    }

    /**
     * @param {MapContext} context
     * @param {StyleRule} rule
     * @param {OverpassElement[]} elements
     */
    renderRule (context, rule, elements=[]) {
        const ctx = this.canvas.getContext("2d");
        if (ctx) {
            ctx.save();
            super.renderRule(context, rule, elements);
            ctx.restore();
        }
    }

    globalSetup({ scale }, rule) {
        const ctx = this.canvas.getContext("2d");
        if (ctx) {
            if (rule.declarations["opacity"])
                ctx.globalAlpha = +rule.declarations["opacity"];

            if (rule.declarations["position"] === "relative") {
                const top = (parseFloat(rule.declarations["top"]) || 0) * scale;
                const left = (parseFloat(rule.declarations["left"]) || 0) * scale;

                ctx.translate(left, top);
            }
        }
    }

    renderPoint (context, rule, point, element=null) {
        const ctx = this.canvas.getContext("2d");
        if (ctx) {
            renderPoint(ctx, rule, point, element, context);
        }
    }

    renderAreaLine (context, rule, points, getPoint, element=null) {
        const ctx = this.canvas.getContext("2d");
        if (ctx) {
            renderAreaLine(ctx, rule, points, getPoint, element, context);
        }
    }

    measureText (context, rule, text) {
        const ctx = this.canvas.getContext("2d");

        if (!ctx) {
            throw Error("Can't get canvas context");
        }

        // Measurements must be non-scaled so they can be scaled as appropriate
        // later.
        setFont(ctx, rule, 1);
        const size = ctx.measureText(text);
        const { width, actualBoundingBoxDescent: descending, actualBoundingBoxAscent: ascending } = size;

        return {
            width,
            ascending,
            descending,
            height: ascending + descending,
        };
    }
}

