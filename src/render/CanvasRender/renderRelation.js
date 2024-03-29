

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ [property: string]: string }} declarations
 * @param {OverpassRelElement} element
 * @param {{ [id: string]: OverpassWayElement; }} wayMap
 * @param {{ [id: string]: OverpassNodeElement; }} nodeMap
 * @param { (lon: number, lat: number) => [number, number] } projection
 */
export function renderRelation(ctx, declarations, element, wayMap, nodeMap, projection, context = {}) {
    const { scale } = context;
    ctx.fillStyle = declarations["fill"];
    ctx.strokeStyle = declarations["stroke"];
    ctx.lineWidth = +declarations["stroke-width"] * scale;

    // As long as outer ways go anti-clockwise and inner rings go clockwise
    // (or possibly vice-versa) then the CanvasRenderingContext2D can handle
    // rending "holes".
    ctx.beginPath();

    const outerWays = element.members.filter(m => m.type === "way" && m.role === "outer").map(m => wayMap[m.ref]);
    const innerWays = element.members.filter(m => m.type === "way" && m.role === "inner").map(m => wayMap[m.ref]);

    let started = false;
    for (const way of outerWays) {
        const nodes = way.nodes.map(id => nodeMap[id]);

        if (!started) {
            ctx.moveTo(...projection(nodes[0].lon, nodes[0].lat));
            started = true;
        }
        for (let i = 1; i < nodes.length; i++) {
            ctx.lineTo(...projection(nodes[i].lon, nodes[i].lat));
        }
    }

    started = false;
    for (const way of innerWays) {
        const nodes = way.nodes.map(id => nodeMap[id]);

        if (!started) {
            ctx.moveTo(...projection(nodes[0].lon, nodes[0].lat));
            started = true;
        }
        for (let i = 1; i < nodes.length; i++) {
            ctx.lineTo(...projection(nodes[i].lon, nodes[i].lat));
        }
    }

    // ctx.closePath();

    declarations["fill"] && ctx.fill();
    declarations["stroke"] && ctx.stroke();
}
