import { makeBBox } from "../bbox";

export function renderGridlines(ctx, rule, centre, scale, width, height, projection) {
    ctx.fillStyle = rule.declarations["fill"];
    ctx.strokeStyle = rule.declarations["stroke"];
    ctx.lineWidth = +rule.declarations["stroke-width"] * devicePixelRatio;

    const vertical = rule.selector.pseudoClasses.find(p => p.name === "vertical");
    const horizontal = rule.selector.pseudoClasses.find(p => p.name === "horizontal");

    if (vertical) {
        const bbox = makeBBox(centre, scale, [width, height]);
        const parts = bbox.split(",");

        const step = parseFloat(vertical.params[0]);

        const round = 1 / step;

        const xmin = Math.floor(+parts[0] * round) / round;
        const xmax = Math.ceil(+parts[2] * round) / round;
        const ymin = Math.floor(+parts[1] * round) / round;
        const ymax = Math.ceil(+parts[3] * round) / round;

        ctx.beginPath();
        for (let i = xmin; i <= xmax; i += step) {
            ctx.moveTo(...projection(i, ymin));
            for (let j = ymin; j <= ymax; j += step) {
                ctx.lineTo(...projection(i, j));
            }
        }
        rule.declarations["stroke"] && ctx.stroke();
    }

    if (horizontal) {
        const bbox = makeBBox(centre, scale, [width, height]);
        const parts = bbox.split(",");

        const step = parseFloat(horizontal.params[0]);

        const round = 1 / step;

        const xmin = Math.floor(+parts[0] * round) / round;
        const xmax = Math.ceil(+parts[2] * round) / round;
        const ymin = Math.floor(+parts[1] * round) / round;
        const ymax = Math.ceil(+parts[3] * round) / round;

        ctx.beginPath();
        for (let j = ymin; j <= ymax; j += step) {
            ctx.moveTo(...projection(xmin, j));
            for (let i = xmin; i <= xmax; i += step) {
                ctx.lineTo(...projection(i, j));
            }
        }
        rule.declarations["stroke"] && ctx.stroke();
    }
}
