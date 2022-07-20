import MapRenderer from "../MapRenderer";
import { renderPoint } from "./renderPoint";
import { setFont } from "./renderText";
import { renderAreaLine } from "./renderAreaLine";
import { renderRect } from "./renderRect";

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

    /**
     * @param {StyleRule} rule
     * @param {Point[]} points
     * @param {Point|((points: Point[]) => Point)} origin Can be a function for lazy evaluation
     * @param {OverpassElement?} element
     * @param {MapContext} context
     */
    renderAreaLine (context, rule, points, origin, element=null) {
        const ctx = this.canvas.getContext("2d");
        if (ctx) {
            renderAreaLine(ctx, rule, points, origin, element, context);
        }
    }

    /**
     * @param {StyleRule} rule
     * @param {BoundingBox} bounding [x, y, width, height] [x, y] is top left
     * @param {Point|((points: Point[]) => Point)} origin Can be a function for lazy evaluation
     * @param {OverpassElement?} element
     * @param {MapContext} context
     */
    renderRect (context, rule, bounding, origin, element=null) {
        const ctx = this.canvas.getContext("2d");
        if (ctx) {
            renderRect(ctx, rule, bounding, origin, element, context);
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

