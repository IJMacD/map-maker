/**
 * Promise based timeout
 * @param {number} duration
 */
export function timeout (duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
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
export function flatProjection(minLon, minLat, maxLon, maxLat, width, height) {
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
export function mercatorProjection(centre, scale, width, height) {
    const baseTileSize = 256;

    const [cLon, cLat] = centre;

    const tileCount = Math.pow(2, scale);
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
    };
}

/**
 *
 * @param {[number, number][]} points
 */
export function getAveragePoint(points) {
    const sum = points.reduce((sum, p) => [sum[0] + p[0], sum[1] + p[1]], [0, 0]);
    const avg = /** @type {[number, number]} */(sum.map(x => x / points.length));
    return avg;
}

/**
 *
 * @param {[number, number][]} points
 * @returns {[number, number]}
 */
export function getCentrePoint(points) {
    const boundingBox = getBoundingBox(points);

    return [
        boundingBox[0] + boundingBox[2] / 2,
        boundingBox[1] + boundingBox[3] / 2,
    ];
}

/**
 *
 * @param {[number, number][]} points
 * @returns {[number, number]}
 */
export function getMidPoint(points) {
    return points[Math.floor((points.length - 1) / 2)];
}

/**
 * @param {[number, number][]} points
 * @returns {BoundingBox} [x, y, width, height] [x,y] is top left
 */
export function getBoundingBox(points) {
    const minMax = points.reduce((minMax, point) => {
        return [
            Math.min(minMax[0], point[0]),
            Math.min(minMax[1], point[1]),
            Math.max(minMax[2], point[0]),
            Math.max(minMax[3], point[1]),
        ];
    }, [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY]);

    return [
        minMax[0],
        minMax[1],
        minMax[2] - minMax[0],
        minMax[3] - minMax[1],
    ];
}


/**
 * @param {string} bbox
 */
export function parseBBox (bbox) {
    return /** @type {BoundingBox} */(bbox.split(",").map(s => +s));
}


/**
 * @param {{ x: number, y: number }} param0
 * @param {BoundingBox} from
 * @param {BoundingBox} to
 */
export function interpolateBox ({x, y}, from, to) {
    const fx = (x - from[0]) / (from[2] - from[0]);
    const fy = (y - from[1]) / (from[3] - from[1]);

    const tw = to[2] - to[0];
    const th = to[3] - to[1];

    return { x: fx * tw + to[0], y: fy * th+ to[1] };
}

/**
 * @param {number} n
 */
export function cleanup (n) {
    return n.toFixed(5).replace(/^0+|0+$/g, "");
}

export function cleanupPoint (x, y) {
    return `${cleanup(x)},${cleanup(y)}`;
}
