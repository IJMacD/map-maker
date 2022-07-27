import MapRenderer from "../MapRenderer";
import { renderPoint } from "./renderPoint";
import { setFont } from "./renderText";
import { renderAreaLine } from "./renderAreaLine";
import { renderRect } from "./renderRect";
import { commonProperties } from "./util";

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
     *
     * @param {MapContext} context
     * @param {{ [property: string]: string }} declarations
     * @param {Point} point
     * @param {OverpassElement?} [element]
     */
    renderPoint (context, declarations, point, element=null) {
        const ctx = this.canvas.getContext("2d");
        if (ctx) {
            ctx.save();
            commonProperties(ctx, context, declarations);
            renderPoint(ctx, declarations, point, element, context);
            ctx.restore();
        }
    }

    /**
     * @param {{ [property: string]: string }} declarations
     * @param {Point[]} points
     * @param {Point|((points: Point[]) => Point)} origin Can be a function for lazy evaluation
     * @param {OverpassElement?} element
     * @param {MapContext} context
     */
    renderAreaLine (context, declarations, points, origin, element=null) {
        const ctx = this.canvas.getContext("2d");
        if (ctx) {
            ctx.save();
            commonProperties(ctx, context, declarations);
            renderAreaLine(ctx, declarations, points, origin, element, context);
            ctx.restore();
        }
    }

    /**
     * @param {{ [property: string]: string }} declarations
     * @param {BoundingBox} bounding [x, y, width, height] [x, y] is top left
     * @param {Point|((points: Point[]) => Point)} origin Can be a function for lazy evaluation
     * @param {OverpassElement?} element
     * @param {MapContext} context
     */
    renderRect (context, declarations, bounding, origin, element=null) {
        const ctx = this.canvas.getContext("2d");
        if (ctx) {
            ctx.save();
            commonProperties(ctx, context, declarations);
            renderRect(ctx, declarations, bounding, origin, element, context);
            ctx.restore();
        }
    }

    /**
     *
     * @param {MapContext} context
     * @param {{ [property: string]: string }} declarations
     * @param {string} text
     * @returns
     */
    measureText (context, declarations, text) {
        const ctx = this.canvas.getContext("2d");

        if (!ctx) {
            throw Error("Can't get canvas context");
        }

        // Measurements must be non-scaled so they can be scaled as appropriate
        // later.
        setFont(ctx, declarations, 1);
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

