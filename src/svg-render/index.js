import MapRenderer from "../MapRenderer";
import { renderAreaLine } from "./renderAreaLine";
import { getMidPoint } from "../util";

/** @typedef {import("../Style").StyleRule} StyleRule */
/** @typedef {import("../Overpass").OverpassElement} OverpassElement */

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
     * @param {import("../MapRenderer").MapContext} context
     * @param {import("../Style").StyleRule} rule
     * @param {import("../Overpass").OverpassElement[]} elements
     */
    renderRule (context, rule, elements=[]) {
        this.currentLayer = { elements: [] };

        // Set up global context options
        layerSetup(this.currentLayer, rule, context.scale);

        super.renderRule(context, rule, elements);

        this.layers.push(this.currentLayer);
    }

    renderLine (context, rule, points, element=null) {
        renderAreaLine(this.currentLayer, rule, points, getMidPoint, element, context);
    }

    toString () {
        return `<svg viewBox="0 0 ${this.width} ${this.height}" width="${this.width}" height="${this.height}">
        ${this.layers.map(layer => {
            const { elements, ...attr } = layer;
            return `\n<g ${attributes(attr)}>${elements.map(element => {
                const { type, ...attr } = element;
                return `\n<${type} ${attributes(attr)} />`;
            })}</g>`
        })}\n</svg>`;
    }

    toBlob () {
        const parts = [];

        parts.push(`<svg viewBox="0 0 ${this.width} ${this.height}" width="${this.width}" height="${this.height}">`);

        for (const layer of this.layers) {
            const { elements, ...attr } = layer;

            parts.push(`\n<g ${attributes(attr)}>`);

            for (const element of elements) {
                const { type, ...attr } = element;
                parts.push(`\n<${type} ${attributes(attr)} />`);
            }

            parts.push(`</g>`);
        }

        parts.push(`\n</svg>`);

        return new Blob(parts);
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
