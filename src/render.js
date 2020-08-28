
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
        /** @type {{ [id: number]: import("./Overpass").OverpassNodeElement }} */
        const nodeMap = {};
        elements.forEach(n => n.type === "node" && (nodeMap[n.id] = n));
        // Prepare way map
        /** @type {{ [id: number]: import("./Overpass").OverpassWayElement }} */
        const wayMap = {};
        elements.forEach(n => n.type === "way" && (wayMap[n.id] = n));
        
        const ctx = canvasRef.current.getContext("2d");
        const { clientWidth, clientHeight } = canvasRef.current;

        const width = clientWidth * devicePixelRatio;
        const height = clientHeight * devicePixelRatio;

        /** @type {(lon: number, lat: number) => [number, number]} */
        const projection = mercatorProjection(minLon, minLat, maxLon, maxLat, width, height);

        for (const el of elements) {
            if (el.type !== rule.selector.type) continue;

            ctx.save();

            ctx.fillStyle = rule.declarations["fill"];
            ctx.strokeStyle = rule.declarations["stroke"];
            ctx.lineWidth = +rule.declarations["stroke-width"] * devicePixelRatio;
            
            if (rule.declarations["opacity"]) 
                ctx.globalAlpha = +rule.declarations["opacity"];

            // Paths
            ctx.beginPath();

            if (el.type === "node") {

                const r = +rule.declarations["size"] * devicePixelRatio;
                const [x, y] = projection(el.lon, el.lat);

                ctx.ellipse(x, y, r, r, 0, 0, Math.PI * 2);

            }
            else if (el.type === "way") {
                if (!el.nodes) continue;

                const nodes = el.nodes.map(id => nodeMap[id]);

                ctx.moveTo(...projection(nodes[0].lon, nodes[0].lat));
                for (let i = 1; i < nodes.length; i++) {
                    ctx.lineTo(...projection(nodes[i].lon, nodes[i].lat));
                }
            }
            else if (el.type === "area") {
                if (!el.nodes) continue;

                const nodes = el.nodes.map(id => nodeMap[id]);

                ctx.moveTo(...projection(nodes[0].lon, nodes[0].lat));
                for (let i = 1; i < nodes.length; i++) {
                    ctx.lineTo(...projection(nodes[i].lon, nodes[i].lat));
                }
                ctx.closePath();
            }
            else if (el.type === "relation") {
                if (!el.members) continue;

                // As long as outer ways go anti-clockwise and inner rings go clockwise
                // (or possibly vice-versa) then the CanvasRenderingContext2D can handle
                // rending "holes".

                const ways = el.members.filter(m => m.type === "way").map(m => wayMap[m.ref]);

                for (const way of ways) {
                    const nodes = way.nodes.map(id => nodeMap[id]);

                    ctx.moveTo(...projection(nodes[0].lon, nodes[0].lat));
                    for (let i = 1; i < nodes.length; i++) {
                        ctx.lineTo(...projection(nodes[i].lon, nodes[i].lat));
                    }
                }
                ctx.closePath();
            }

            rule.declarations["fill"] && ctx.fill();
            rule.declarations["stroke"] && ctx.stroke();

            // Text Handling 
            
            if (rule.declarations["content"] && el.type === "node") {
                const [x, y] = projection(el.lon, el.lat);

                let content = rule.declarations["content"];
                
                if (content.match(/^".*"$/g)) {
                    content = content.replace(/^"|"$/g, "");
                } else if (content.match(/tag\(([^)]+)\)/)) {
                    const m = content.match(/tag\(([^)]+)\)/);
                    content = el.tags[m[1]] || "";
                } else {
                    content = "?";
                }

                let fontSize = `${10 * devicePixelRatio}px`;
                let fontWeight = "normal";
                let fontFamily = "sans-serif";

                if (rule.declarations["font-size"]) {
                    fontSize = rule.declarations["font-size"].replace(/^\d[\d.]*/, m => `${+m * devicePixelRatio}`);
                }

                if (rule.declarations["font-weight"]) {
                    fontWeight = rule.declarations["font-weight"];
                }

                if (rule.declarations["font-family"]) {
                    fontFamily = rule.declarations["font-family"];
                }

                ctx.font = rule.declarations["font"] || `${fontWeight} ${fontSize} ${fontFamily}`;

                if (rule.declarations["stroke"]) 
                    ctx.strokeText(content, x, y);
                if (rule.declarations["fill"] || !rule.declarations["stroke"]) 
                    ctx.fillText(content, x, y);
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
    const size = Math.max(width,height);    

    const QUARTER_PI = Math.PI / 4;
    const worldWidth = (size / 360);
    const minX = (minLon + 180) * worldWidth;
    const maxX = (maxLon + 180) * worldWidth;
    const NMin = Math.log(Math.tan(QUARTER_PI + (minLat / 180 * Math.PI) / 2));
    const minY = (size / 2) - (size * NMin / (2 * Math.PI));
    const NMax = Math.log(Math.tan(QUARTER_PI + (maxLat / 180 * Math.PI) / 2));
    const maxY = (size / 2) - (size * NMax / (2 * Math.PI));

    const xScale = size / (maxX - minX);
    const yScale = size / (minY - maxY);
    const scale = Math.min(xScale, yScale);

    return (lon, lat) => {
        const E = (lon + 180)
        const x = E * worldWidth;
        const N = Math.log(Math.tan(QUARTER_PI + (lat / 180 * Math.PI) / 2));
        const y = (size / 2) - (size * N / (2 * Math.PI));

        return [(x - minX)*scale, height+(y-minY)*scale];
    }
}