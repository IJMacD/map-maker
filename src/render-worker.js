import CanvasRender from './canvas-render';

/** @type {OffscreenCanvas} */
let canvas;
/** @type {import('./MapRenderer').default} */
let renderer;

onmessage = (msg) => {
    if (msg.data.canvas) {
        canvas = msg.data.canvas;
        renderer = new CanvasRender(canvas);
    }

    if (msg.data.method === "clear") {
        const { context: { width, height } } = msg.data;

        canvas.width = width;
        canvas.height = height;
    }

    if (msg.data.method === "renderRule") {
        const { context, rule, elements } = msg.data;

        renderer.renderRule(context, rule, elements);
    }
};