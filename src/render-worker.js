import CanvasRender from './canvas-render';
import { Overpass } from './Overpass';

/** @type {OffscreenCanvas} */
let canvas;
/** @type {import('./MapRenderer').default} */
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
        /** @type {{ context: import('./MapRenderer').MapContext, rule: import('./Style').StyleRule }} */
        const { context, rule } = msg.data;

        overpass.setBBox(context.bbox);
        const pElements = overpass.getElements(rule.selector);

        chain = chain.then(() => pElements.then(elements => renderer.renderRule(context, rule, elements)));
    }
};