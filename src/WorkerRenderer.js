// @ts-ignore
import RenderWorker from 'worker-loader!./render-worker'; // eslint-disable-line import/no-webpack-loader-syntax
import MapRenderer from './MapRenderer';

export default class WorkerRenderer extends MapRenderer {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor (canvas) {
        super();

        this.canvas = canvas.transferControlToOffscreen();
        /** @type {Worker} */
        this.worker = new RenderWorker();

        this.worker.postMessage({ canvas: this.canvas }, [ this.canvas ]);
    }

    clear (context) {
        this.worker.postMessage({ method: "clear", context });
    }

    renderRule (context, rule, elements) {
        this.worker.postMessage({ method: "renderRule", context, rule, elements });
    }
}