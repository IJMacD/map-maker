/** @typedef {import("../Style").StyleRule} StyleRule */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {StyleRule} rule
 */
export function applyTransform(ctx, rule) {
    const dpr = devicePixelRatio;

    if (rule.declarations["transform"]) {
        const r = /\s*([a-z]+)\(([^)]*)\)\s*/g;
        const t = rule.declarations["transform"];
        let m;
        while (m = r.exec(t)) {
            const trans = m[1];
            const params = m[2].split(",").map(s => ({ value: parseFloat(s) * dpr, unit: s.replace(/[-\d.\s]/g, "") }));
            switch (trans) {
                case "matrix":
                    // @ts-ignore
                    ctx.transform(...params.map(p => p.value));
                    break;
                case "rotate": {
                    let { value, unit } = params[0];

                    if (unit === "deg") {
                        value *= Math.PI / 180;
                    } else if (unit === "turn") {
                        value *= Math.PI * 2;
                    }

                    ctx.rotate(value);
                    break;
                }
                case "scale":
                    const x = params[0].value;
                    const y = params[1] ? params[1].value : x;
                    ctx.scale(x, y);
                    break;
                case "translate":
                    // @ts-ignore
                    ctx.translate(...params.map(p => p.value));
                    break;
                case "skew":
                    let { value, unit } = params[0];

                    if (unit === "rad")
                        value = Math.tan(value);
                    else if (unit === "deg")
                        value = Math.tan(value * Math.PI / 180);

                    let valueY = 0;

                    if (params[1]) {
                        let { value, unit } = params[1];

                        if (unit === "rad")
                            value = Math.tan(value);
                        else if (unit === "deg")
                            value = Math.tan(value * Math.PI / 180);

                        valueY = value;
                    }

                    ctx.transform(1, valueY, value, 1, 0, 0);
                    break;
            }
        }
    }
}
