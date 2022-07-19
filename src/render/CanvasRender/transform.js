/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {StyleRule} rule
 * @param {number} scale
 */
export function applyTransform(ctx, rule, scale) {

    if (rule.declarations["transform"]) {
        const r = /\s*([a-z]+)\(([^)]*)\)\s*/g;
        const t = rule.declarations["transform"];
        let m;
        while (m = r.exec(t)) {
            const trans = m[1];
            const params = m[2].split(",").map(s => ({ value: parseFloat(s), unit: s.replace(/[-\d.\s]/g, "") }));
            switch (trans) {
                case "matrix":
                    // @ts-ignore
                    ctx.transform(...params.map(p => p.value));
                    break;
                case "rotate": {
                    // rotate(10 deg)
                    // rotate(0.5 turn)
                    // rotate(1.55 rad)
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
                    // scale(2)
                    // scale(2, 1)
                    const x = params[0].value;
                    const y = params[1] ? params[1].value : x;
                    ctx.scale(x, y);
                    break;
                case "translate":
                    // translate(10, 20)
                    // @ts-ignore
                    ctx.translate(...params.map(p => p.value * scale));
                    break;
                case "skew":
                    // skew(10)
                    // skew(30deg)
                    // skew(1.5rad)
                    // skew(10, 10)
                    // skew(30 deg, 10 deg)
                    // skew(1.5 rad, 2 rad)
                    let { value, unit } = params[0];

                    if (unit === "rad")
                        value = Math.tan(value);
                    else if (unit === "deg")
                        value = Math.tan(value * Math.PI / 180);
                    else
                        value *= scale;

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
