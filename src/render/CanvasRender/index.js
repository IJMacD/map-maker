import MapRenderer from "../MapRenderer";
import { renderPoint } from "./renderPoint";
import { setFont } from "./renderText";
import { renderAreaLine } from "./renderAreaLine";

export default class CanvasRender extends MapRenderer {

    /**
     * @param {HTMLCanvasElement|OffscreenCanvas} canvas
     */
    constructor (canvas) {
        super();
        this.canvas = canvas;
    }

    clear (context) {
        const { width, height } = context;

        this.canvas.width = width * devicePixelRatio;
        this.canvas.height = height * devicePixelRatio;

        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    }

    renderRule (context, rule, elements=[]) {
        const ctx = this.canvas.getContext("2d");
        ctx.save();
        super.renderRule(context, rule, elements);
        ctx.restore();
    }

    globalSetup({ scale }, rule) {
        const ctx = this.canvas.getContext("2d");

        if (rule.declarations["opacity"])
            ctx.globalAlpha = +rule.declarations["opacity"];

        if (rule.declarations["position"] === "relative") {
            const top = (parseFloat(rule.declarations["top"]) || 0) * scale;
            const left = (parseFloat(rule.declarations["left"]) || 0) * scale;

            ctx.translate(left, top);
        }
    }

    renderPoint (context, rule, point, element=null) {
        const ctx = this.canvas.getContext("2d");
        renderPoint(ctx, rule, point, element, context);
    }

    renderAreaLine (context, rule, points, getPoint, element=null) {
        const ctx = this.canvas.getContext("2d");
        renderAreaLine(ctx, rule, points, getPoint, element, context);
    }

    measureText (context, rule, text) {
        const ctx = this.canvas.getContext("2d");
        const { scale } = context;
        setFont(ctx, rule, scale);
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

