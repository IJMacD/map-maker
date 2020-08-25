
export function clearMap (canvasRef) {
    const { clientWidth, clientHeight } = canvasRef.current;

    const width = clientWidth * devicePixelRatio;
    const height = clientHeight * devicePixelRatio;

    canvasRef.current.width = width;
    canvasRef.current.height = height;
}

/**
 * @param {string} bbox
 * @param {import("./Overpass").OverpassElement[]} elements
 * @param {React.MutableRefObject<HTMLCanvasElement>} canvasRef
 * @param {import("./Style").StyleRule} rule
 */
export function renderMap (bbox, elements, canvasRef, rule) {
    const [minLon, minLat, maxLon, maxLat] = bbox.split(",").map(parseFloat);

    if (canvasRef.current && !isNaN(minLon) && !isNaN(minLat) && !isNaN(maxLon) && !isNaN(maxLat)) {

        // Prepare node map
        const nodeMap = {};
        elements.filter(n => n.type === "node").forEach(n => nodeMap[n.id] = n);
        
        const ctx = canvasRef.current.getContext("2d");
        const { clientWidth, clientHeight } = canvasRef.current;

        const width = clientWidth * devicePixelRatio;
        const height = clientHeight * devicePixelRatio;

        /** @type {(lon: number, lat: number) => [number, number]} */
        const projection = mercatorProjection(minLon, minLat, maxLon, maxLat, width, height);

        for (const el of elements) {
            if (el.type !== rule.selector.type) continue;

            ctx.save();
            
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

                    if (rule.declarations["content"]) {
                        let content = rule.declarations["content"];
                        
                        if (content.match(/^".*"$/g)) {
                            content = content.replace(/^"|"$/g, "");
                        } else if (content.match(/tag\(([^)]+)\)/)) {
                            const m = content.match(/tag\(([^)]+)\)/);
                            content = el.tags[m[1]] || "";
                        } else {
                            content = "?";
                        }

                        if (rule.declarations["font-size"]) {
                            ctx.font = rule.declarations["font-size"] + " sans-serif";
                        }

                        ctx.fillText(content, x, y);
                    }
                }
                else if (el.type === "way") {
                    if (!el.nodes) continue;

                    const nodes = el.nodes.map(id => nodeMap[id]);
                    
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
                }
                else if (el.type === "area") {
                    if (!el.nodes) continue;

                    const nodes = el.nodes.map(id => nodeMap[id]);
                
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
                }
            }

            ctx.restore();
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