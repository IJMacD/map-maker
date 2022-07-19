import CanvasRender from './CanvasRender';
import { Overpass } from '../Classes/Overpass';

/** @type {OffscreenCanvas} */
let canvas;
/** @type {MapRenderer} */
let renderer;
/** @type {Overpass} */
let overpass = new Overpass();

onmessage = (msg) => {
    if (msg.data.canvas) {
        canvas = msg.data.canvas;
        renderer = new CanvasRender(canvas);
    }

    if (msg.data.method === "clear") {
        const { context: { width, height, scale } } = msg.data;

        canvas.width = width * scale;
        canvas.height = height * scale;
    }

    if (msg.data.method === "renderRule") {
        /** @type {{ context: MapContext, rule: StyleRule, elements: OverpassElement[] }} */
        const { context, rule, elements } = msg.data;

        renderer.renderRule(context, rule, elements);
    }
};