import MapRenderer from "../MapRenderer";
import { renderAreaLine } from "./renderAreaLine";
import { parseStrokeFill } from "../../util/parseStrokeFill";

export default class SVGRender extends MapRenderer {
    /**
     * @param {number} width
     * @param {number} height
     */
    constructor (width, height) {
        super();
        this.layers = [];
        this.width = width;
        this.height = height;
        this.currentLayer = null;
    }

    clear () {
        this.layers.length = 0;
    }

    /**
     * @param {MapContext} context
     * @param {StyleRule} rule
     * @param {OverpassElement[]} elements
     */
    renderRule (context, rule, elements=[]) {
        this.currentLayer = { elements };

        const colours = parseStrokeFill(rule, elements[0], context);

        this.currentLayer.stroke = colours.strokeStyle;
        this.currentLayer.fill = colours.fillStyle || "none";

        // Set up global context options
        layerSetup(this.currentLayer, rule, context.scale);

        super.renderRule(context, rule, elements);

        this.layers.push(this.currentLayer);
    }

    renderAreaLine (context, rule, points, getPoint, element=null) {
        renderAreaLine(this.currentLayer, rule, points, getPoint, element, context);
    }

    toString () {
        return this.getTextParts().join("");
    }

    toBlob () {
        return new Blob(this.getTextParts());
    }

    getTextParts() {
        const parts = [];

        parts.push(`<svg version="1.1" viewBox="0 0 ${this.width} ${this.height}" width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">\n`);

        for (const layer of this.layers) {
            const { elements, ...attr } = layer;

            parts.push(`<g ${attributes(attr)}>\n`);

            for (const element of elements) {
                const { type, ...attr } = element;
                parts.push(`<${type} ${attributes(attr)} />\n`);
            }

            parts.push(`</g>\n`);
        }

        parts.push(`</svg>`);
        return parts;
    }
}

function attributes(attr) {
    return Object.entries(attr).filter(([key, value]) => typeof value !== "undefined").map(([key, value]) => `${key}="${value}"`).join(" ");
}

export function layerSetup(layer, rule, scale) {
    if (rule.declarations["opacity"])
        layer.opacity = +rule.declarations["opacity"];

    if (rule.declarations["position"] === "relative") {
        const top = (parseFloat(rule.declarations["top"]) || 0) * scale;
        const left = (parseFloat(rule.declarations["left"]) || 0) * scale;

        layer.translate = [left, top];
    }
}
