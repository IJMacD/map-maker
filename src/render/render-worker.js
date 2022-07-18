import CanvasRender from './CanvasRender';
import { Overpass } from '../Classes/Overpass';

/** @type {OffscreenCanvas} */
let canvas;
/** @type {MapRenderer} */
let renderer;
/** @type {Overpass} */
let overpass = new Overpass();

let chain = Promise.resolve();

onmessage = (msg) => {
    if (msg.data.canvas) {
        canvas = msg.data.canvas;
        renderer = new CanvasRender(canvas);
    }

    if (msg.data.method === "clear") {
        const { context: { width, height, bbox } } = msg.data;

        canvas.width = width;
        canvas.height = height;

        overpass.setBBox(bbox);

        chain = Promise.resolve();
    }

    if (msg.data.method === "renderRule") {
        /** @type {{ context: MapContext, rule: StyleRule }} */
        const { context, rule } = msg.data;

        overpass.setBBox(context.bbox);
        const pElements = overpass.getElements(rule.selector);

        chain = chain.then(() => pElements.then(elements => renderer.renderRule(context, rule, elements)));
    }
};