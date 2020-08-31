import { makeBBox } from "./bbox";

/**
 * @param {HTMLCanvasElement} canvas
 */
export function clearMap (canvas) {
    const { clientWidth, clientHeight } = canvas;

    const width = clientWidth * devicePixelRatio;
    const height = clientHeight * devicePixelRatio;

    canvas.width = width;
    canvas.height = height;
}

const debugBox = false;
const debugLines = false;

/** @typedef {import("./Style").StyleRule} StyleRule */
/** @typedef {import("./Overpass").OverpassElement} OverpassElement */

/**
 * @param {[number,number]} centre
 * @param {number} scale
 * @param {import("./Overpass").OverpassElement[]} elements
 * @param {HTMLCanvasElement} canvas
 * @param {import("./Style").StyleRule} rule
 * @param {{ zoom: number, current: Position }} context
 */
export function renderMap (centre, scale, elements=[], canvas, rule, context) {
    // Prepare node map
    /** @type {{ [id: number]: import("./Overpass").OverpassNodeElement }} */
    const nodeMap = {};
    elements.forEach(n => n.type === "node" && (nodeMap[n.id] = n));
    // Prepare way map
    /** @type {{ [id: number]: import("./Overpass").OverpassWayElement }} */
    const wayMap = {};
    elements.forEach(n => n.type === "way" && (wayMap[n.id] = n));
    
    const ctx = canvas.getContext("2d");
    const { clientWidth, clientHeight } = canvas;

    const width = clientWidth * devicePixelRatio;
    const height = clientHeight * devicePixelRatio;

    /** @type {(lon: number, lat: number) => [number, number]} */
    const projection = mercatorProjection(centre, scale, width, height);

    if (debugBox) {
        const bbox = makeBBox(centre, scale, [width, height]);
        const parts = bbox.split(",");
        const [ x1, y1 ] = projection(+parts[0], +parts[1]);
        const [ x2, y2 ] = projection(+parts[2], +parts[3]);
        ctx.beginPath();
        ctx.rect(x1, y1, x2 - x1, y2 - y1);
        ctx.strokeStyle = "black";
        ctx.stroke();
    }

    if (debugLines) {
        const xmin = 6.5;
        const xmax = 7.5;
        const xstep = 0.1;
        const ymin = 50;
        const ymax = 51;
        const ystep = 0.1;
        ctx.beginPath();
        for (let i = xmin; i < xmax; i += xstep) {
            ctx.moveTo(...projection(i, ymin));
            for (let j = ymin; j < ymax; j += ystep) {
                ctx.lineTo(...projection(i, j));
            }
        }
        for (let j = ymin; j < ymax; j += ystep) {
            ctx.moveTo(...projection(xmin, j));
            for (let i = ymin; i < ymax; i += ystep) {
                ctx.lineTo(...projection(i, j));
            }
        }
        ctx.strokeStyle = "black";
        ctx.stroke();
    }

    ctx.save();
    
    if (rule.declarations["opacity"]) 
        ctx.globalAlpha = +rule.declarations["opacity"];

    if (rule.declarations["position"] === "relative") {
        const top = parseFloat(rule.declarations["top"]) || 0;
        const left = parseFloat(rule.declarations["left"]) || 0;

        ctx.translate(left * devicePixelRatio, top * devicePixelRatio);
    }

    // Special rules first
    if (rule.selector.type === "map") {
        renderRect(ctx, [0, 0, width, height], rule);
    }
    else if (rule.selector.type === "current") {
        if (context.current) {
            const { coords } = context.current;
            renderPoint(ctx, rule, projection(coords.longitude, coords.latitude));
        }
    }

    // Then iterate all elements
    for (const el of elements) {
        if (el.type !== rule.selector.type) continue;

        if (el.type === "node") {
            renderPoint(ctx, rule, projection(el.lon, el.lat), el);
        }
        else if (el.type === "way") {
            if (!el.nodes) continue;

            /** @type {import("./Overpass").OverpassNodeElement[]} */
            const nodes = el.nodes.map(id => nodeMap[id]);
            const points = nodes.map(n => projection(n.lon, n.lat));
            
            renderLine(ctx, rule, points, el);
        }
        else if (el.type === "area") {
            if (!el.nodes) continue;

            /** @type {import("./Overpass").OverpassNodeElement[]} */
            const nodes = el.nodes.map(id => nodeMap[id]);
            const points = nodes.map(n => projection(n.lon, n.lat));

            // Close path back to start
            points.push(points[0]);
            
            renderLine(ctx, rule, points, el);
        }
        else if (el.type === "relation") {
            if (!el.members) continue;

            ctx.fillStyle = rule.declarations["fill"];
            ctx.strokeStyle = rule.declarations["stroke"];
            ctx.lineWidth = +rule.declarations["stroke-width"] * devicePixelRatio;

            // As long as outer ways go anti-clockwise and inner rings go clockwise
            // (or possibly vice-versa) then the CanvasRenderingContext2D can handle
            // rending "holes".

            ctx.beginPath();

            const ways = el.members.filter(m => m.type === "way").map(m => wayMap[m.ref]);

            for (const way of ways) {
                const nodes = way.nodes.map(id => nodeMap[id]);

                ctx.moveTo(...projection(nodes[0].lon, nodes[0].lat));
                for (let i = 1; i < nodes.length; i++) {
                    ctx.lineTo(...projection(nodes[i].lon, nodes[i].lat));
                }
            }
            ctx.closePath();

            rule.declarations["fill"] && ctx.fill();
            rule.declarations["stroke"] && ctx.stroke();
        }
    }

    if (rule.selector.type === "gridlines") {
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

            const xmin = Math.floor(+parts[0]*round)/round;
            const xmax = Math.ceil(+parts[2]*round)/round;
            const ymin = Math.floor(+parts[1]*round)/round;
            const ymax = Math.ceil(+parts[3]*round)/round;

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

            const xmin = Math.floor(+parts[0]*round)/round;
            const xmax = Math.ceil(+parts[2]*round)/round;
            const ymin = Math.floor(+parts[1]*round)/round;
            const ymax = Math.ceil(+parts[3]*round)/round;

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

    ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {StyleRule} rule
 * @param {[number, number]} position
 * @param {OverpassElement} element
 */
function renderPoint(ctx, rule, [x, y], element=null) {
    
    ctx.fillStyle = rule.declarations["fill"];
    ctx.strokeStyle = rule.declarations["stroke"];
    ctx.lineWidth = +rule.declarations["stroke-width"] * devicePixelRatio;
    
    ctx.beginPath();

    const r = +rule.declarations["size"] * devicePixelRatio;

    ctx.ellipse(x, y, r, r, 0, 0, Math.PI * 2);

    rule.declarations["fill"] && ctx.fill();
    rule.declarations["stroke"] && ctx.stroke();

    if (rule.declarations["content"]) {
        renderText(ctx, rule, [x, y], element);
    }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {StyleRule} rule
 * @param {[number, number][]} points
 * @param {OverpassElement} element
 */
function renderLine(ctx, rule, points, element=null) {
    
    ctx.fillStyle = rule.declarations["fill"];
    ctx.strokeStyle = rule.declarations["stroke"];
    ctx.lineWidth = +rule.declarations["stroke-width"] * devicePixelRatio;

    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(...points[i]);
    }

    rule.declarations["fill"] && ctx.fill();
    rule.declarations["stroke"] && ctx.stroke();

    // Text Handling 
    if (rule.declarations["content"]) {
        // find mid-point (and average gradient?)
        const point = midPoint(points);
        renderText(ctx, rule, point, element);
    }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {[number, number, number, number]} coordinates (x, y, width, height)
 * @param {StyleRule} rule
 * @param {OverpassElement} element
 */
function renderRect(ctx, [x, y, width, height], rule, element=null) {
    
    ctx.fillStyle = rule.declarations["fill"];
    ctx.strokeStyle = rule.declarations["stroke"];
    ctx.lineWidth = +rule.declarations["stroke-width"] * devicePixelRatio;

    ctx.beginPath();
    ctx.rect(x, y, width, height);

    rule.declarations["fill"] && ctx.fill();
    rule.declarations["stroke"] && ctx.stroke();

    if (rule.declarations["content"]) {
        renderText(ctx, rule, [x + width/2, y + height/2], element);
    }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {StyleRule} rule
 * @param {[number, number]} param2
 * @param {OverpassElement} [element]
 */
function renderText(ctx, rule, [x, y], element=null) {
    
    ctx.fillStyle = rule.declarations["fill"];
    ctx.strokeStyle = rule.declarations["stroke"];
    ctx.lineWidth = +rule.declarations["stroke-width"] * devicePixelRatio;

    let content = rule.declarations["content"];

    if (content.match(/^".*"$/g)) {
        content = content.replace(/^"|"$/g, "");
    }
    else if (content.match(/tag\(([^)]+)\)/)) {
        const m = content.match(/tag\(([^)]+)\)/);
        content = element.tags[m[1]] || "";
    }
    else {
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

    if (rule.declarations["text-align"]) {
        const textWidth = ctx.measureText(content).width;

        if (rule.declarations["text-align"] === "center" || rule.declarations["text-align"] === "centre") {
            x -= textWidth / 2;
        } else if (rule.declarations["text-align"] === "right") {
            x -= textWidth;
        }
    }

    if (rule.declarations["text-color"]) {
        ctx.fillStyle = rule.declarations["text-color"];
        ctx.fillText(content, x, y);
    }
    else {
        if (rule.declarations["stroke"])
            ctx.strokeText(content, x, y);
        if (rule.declarations["fill"] || !rule.declarations["stroke"])
            ctx.fillText(content, x, y);
    }
}

/**
 * @returns {(lon: number, lat: number) => [number, number]}
 * @param {number} minLon
 * @param {number} minLat
 * @param {number} maxLon
 * @param {number} maxLat
 * @param {number} width
 * @param {number} height
 */
function flatProjection (minLon, minLat, maxLon, maxLat, width, height) {
    const xScale = width / (maxLon - minLon);
    const yScale = height / (maxLat - minLat);
    const scale = Math.max(xScale, yScale);
    return ((lon, lat) => [(lon - minLon) * scale, height - (lat - minLat) * scale]);
}

/**
 * @param {[number, number]} centre
 * @param {number} scale
 * @param {number} width
 * @param {number} height
 * @returns {(lon: number, lat: number) => [number, number]} 
 */
function mercatorProjection (centre, scale, width, height) {
    const baseTileSize = 256;

    const [ cLon, cLat ] = centre;

    const tileCount = Math.pow(2, scale)
    const degPerTileH = 180 / tileCount;
    const degPerTileV = 180 / tileCount;  

    const hPixelsPerDeg = baseTileSize / degPerTileH;
    const vPixelsPerDeg = baseTileSize / degPerTileV;

    const QUARTER_PI = Math.PI / 4;

    const cX = width / 2;
    const cY = height / 2;

    const cLatPrime = Math.log(Math.tan(QUARTER_PI + (cLat / 180 * Math.PI) / 2)) * 180 / Math.PI;

    return (lon, lat) => {
        const E = lon;
        const N = Math.log(Math.tan(QUARTER_PI + (lat / 180 * Math.PI) / 2)) * 180 / Math.PI;

        const dLon = E - cLon;
        const dLat = N - cLatPrime;

        const dX = dLon * hPixelsPerDeg;
        const dY = dLat * vPixelsPerDeg;

        return [cX + dX, cY - dY];
    }
}

/**
 * 
 * @param {[number, number][]} points 
 */
function averagePoint (points) {
    const sum = points.reduce((sum, p) => [sum[0] + p[0], sum[1] + p[1]], [0, 0]);
    /** @type {[number, number]} */
    const avg = (sum.map(x => x / points.length));
    return avg;
}

/**
 * 
 * @param {[number, number][]} points 
 * @returns {[number, number]}
 */
function midPoint (points) {
    const boundingBox = getBoundingBox(points);

    return [
        boundingBox[0] + boundingBox[2] / 2,
        boundingBox[1] + boundingBox[3] / 2,
    ];
}

/**
 * @param {[number, number][]} points
 * @returns {[number, number, number, number]} (x, y, width, height)
 */
function getBoundingBox (points) {
    const minMax = points.reduce((minMax, point) => {
        return [
            Math.min(minMax[0], point[0]),
            Math.min(minMax[1], point[1]),
            Math.max(minMax[2], point[0]),
            Math.max(minMax[3], point[1]),
        ]
    }, [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY]);

    return [
        minMax[0],
        minMax[1],
        minMax[2] - minMax[0],
        minMax[3] - minMax[1],
    ];
}
