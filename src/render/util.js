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
    /** @type {[number, number]} */
    const avg = (sum.map(x => x / points.length));
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
    return points[Math.floor(points.length / 2)];
}
/**
 * @param {[number, number][]} points
 * @returns {[number, number, number, number]} (x, y, width, height)
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
