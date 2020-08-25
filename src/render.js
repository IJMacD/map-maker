import { matchRule } from "./Style";

/**
 * @param {string} bbox
 * @param {{ elements: import("./Overpass").OverpassElement[]; }} result
 * @param {React.MutableRefObject<HTMLCanvasElement>} canvasRef
 * @param {{ rules: import("./Style").StyleRule[]; }} style
 */
export function renderMap(bbox, result, canvasRef, style, database) {
    const [minLon, minLat, maxLon, maxLat] = bbox.split(",").map(parseFloat);
    if (result && canvasRef.current && !isNaN(minLon) && !isNaN(minLat) && !isNaN(maxLon) && !isNaN(maxLat)) {
    const ctx = canvasRef.current.getContext("2d");
    const { clientWidth, clientHeight } = canvasRef.current;

    const width = clientWidth * devicePixelRatio;
    const height = clientHeight * devicePixelRatio;

    canvasRef.current.width = width;
    canvasRef.current.height = height;

    /** @type {(lon: number, lat: number) => [number, number]} */
    const projection = mercatorProjection(minLon, minLat, maxLon, maxLat, width, height);

    for (const el of result.elements) {
        const rule = matchRule(style, el);
        
        if (rule) {
            if (el.type === "node") {
                ctx.fillStyle = rule.declarations["fill"];
                ctx.strokeStyle = rule.declarations["stroke"];
                ctx.lineWidth = +rule.declarations["stroke-width"];

                const r = +rule.declarations["size"];
                const [x, y] = projection(el.lon, el.lat);

                ctx.beginPath();
                ctx.ellipse(x, y, r, r, 0, 0, Math.PI * 2);

                rule.declarations["fill"] && ctx.fill();
                rule.declarations["stroke"] && ctx.stroke();
            }
            else if (el.type === "way") {
                if (!el.nodes) continue;
                database.getNodes(el.nodes).then(nodes => {
                    ctx.fillStyle = rule.declarations["fill"];
                    ctx.strokeStyle = rule.declarations["stroke"];
                    ctx.lineWidth = +rule.declarations["stroke-width"];

                    ctx.beginPath();
                    ctx.moveTo(...projection(nodes[0].lon, nodes[0].lat));
                    for (let i = 1; i < nodes.length; i++) {
                        ctx.lineTo(...projection(nodes[i].lon, nodes[i].lat));
                    }
                    
                    rule.declarations["fill"] && ctx.fill();
                    rule.declarations["stroke"] && ctx.stroke();
                });
            }
            else if (el.type === "area") {
                if (!el.nodes) continue;
                database.getNodes(el.nodes).then(nodes => {
                    ctx.fillStyle = rule.declarations["fill"];
                    ctx.strokeStyle = rule.declarations["stroke"];
                    ctx.lineWidth = +rule.declarations["stroke-width"];
                    
                    ctx.beginPath();
                    ctx.moveTo(...projection(nodes[0].lon, nodes[0].lat));
                    for (let i = 1; i < nodes.length; i++) {
                        ctx.lineTo(...projection(nodes[i].lon, nodes[i].lat));
                    }
                    ctx.closePath();

                    rule.declarations["fill"] && ctx.fill();
                    rule.declarations["stroke"] && ctx.stroke();
                });
            }
        }
    }

    }
}

/**
 * @returns {(lon: number, lat: number) => [number, number]} 
 */
function flatProjection (minLon, minLat, maxLon, maxLat, width, height) {
    const xScale = width / (maxLon - minLon);
    const yScale = height / (maxLat - minLat);
    const scale = Math.max(xScale, yScale);
    return ((lon, lat) => [(lon - minLon) * scale, height - (lat - minLat) * scale]);
}

/**
 * @returns {(lon: number, lat: number) => [number, number]} 
 */
function mercatorProjection (minLon, minLat, maxLon, maxLat, width, height) {
    const QUARTER_PI = Math.PI / 4;
    const worldWidth = (width / 360);
    const minX = (minLon + 180) * worldWidth;
    const maxX = (maxLon + 180) * worldWidth;
    const NMin = Math.log(Math.tan(QUARTER_PI + (minLat / 180 * Math.PI) / 2));
    const minY = (height / 2) - (height * NMin / (2 * Math.PI));
    const NMax = Math.log(Math.tan(QUARTER_PI + (maxLat / 180 * Math.PI) / 2));
    const maxY = (height / 2) - (height * NMax / (2 * Math.PI));

    const xScale = width / (maxX - minX);
    const yScale = height / (maxY - minY);
    const scale = Math.min(xScale, yScale);

    return (lon, lat) => {
        const E = (lon + 180)
        const x = E * worldWidth;
        const N = Math.log(Math.tan(QUARTER_PI + (lat / 180 * Math.PI) / 2));
        const y = (height / 2) - (height * N / (2 * Math.PI));

        return [(x - minX)*-scale, height+(y-minY)*-scale];
    }
}