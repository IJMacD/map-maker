import { makeBBox } from "../bbox";
import { renderLine } from "./renderLine";

export function renderGridlines(ctx, rule, centre, scale, width, height, projection) {
    const vertical = rule.selector.pseudoClasses.find(p => p.name === "vertical");
    const horizontal = rule.selector.pseudoClasses.find(p => p.name === "horizontal");

    const bbox = makeBBox(centre, scale, [width, height]);
    const parts = bbox.split(",");

    if (vertical) {
        const step = parseFloat(vertical.params[0]);

        const round = 1 / step;

        const sigFigs = Math.ceil(Math.log10(round));

        const xmin = Math.floor(+parts[0] * round) / round;
        const xmax = Math.ceil(+parts[2] * round) / round;
        const ymin = Math.floor(+parts[1] * round) / round;
        const ymax = Math.ceil(+parts[3] * round) / round;

        for (let i = xmin; i <= xmax; i += step) {
            const points = [ projection(i, ymin),  projection(i, (ymin + ymax) / 2), projection(i, ymax) ];
            renderLine(ctx, rule, points, { type: "way", id: 0, nodes: [], tags: { name: i.toFixed(sigFigs) }});
        }
    }

    if (horizontal) {
        const step = parseFloat(horizontal.params[0]);

        const round = 1 / step;

        const sigFigs = Math.ceil(Math.log10(round));

        const xmin = Math.floor(+parts[0] * round) / round;
        const xmax = Math.ceil(+parts[2] * round) / round;
        const ymin = Math.floor(+parts[1] * round) / round;
        const ymax = Math.ceil(+parts[3] * round) / round;

        for (let j = ymin; j <= ymax; j += step) {
            const points = [ projection(xmin, j), projection((xmin + xmax) / 2, j), projection(xmax, j) ];
            renderLine(ctx, rule, points, { type: "way", id: 0, nodes: [], tags: { name: j.toFixed(sigFigs) }});
        }
    }
}
