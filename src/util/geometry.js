
/**
 * Gives clockwise points
 * @param {number} x Top edge of rect
 * @param {number} y Left edge of rect
 * @param {number} width
 * @param {number} height
 * @returns {[number, number][]}
 */
export function rectToPoints(x, y, width, height) {
    /** @type {[number, number][]} */
    return [
        [x, y],                     // Top Left
        [x + width, y],             // Top Right
        [x + width, y + height],    // Bottom Right
        [x, y + height],            // Bottom Left
    ];
}


/**
 * @see http://paulbourke.net/geometry/polygonmesh/#clockwise
 * @param {[number, number][]} points
 */
export function getCrossProductArea (points) {
    let sum = 0;
    for (let i = 0; i < points.length - 1; i++) {
        sum += points[i][0] * points[i+1][1] - points[i+1][0] * points[i][1];
    }
    return sum / 2;
}

/**
 * @param {[number, number][]} points
 */
export function getArea (points) {
    return Math.abs(getCrossProductArea(points));
}

/**
 * @param {[number, number][]} points
 */
export function isAntiClockwise (points) {
    return getCrossProductArea(points) > 0;
}

/**
 * @see http://paulbourke.net/geometry/polygonmesh/#clockwise
 * @param {[number, number][]} points
 */
export function isConvex (points) {
    const l = points.length;
    if (l < 3) return;

    let sign = 0;
    for (let i = 1; i < l; i++) {
        const a = points[i-1];
        const b = points[i];
        const c = points[(i+1) % l];

        const next = Math.sign((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]));

        if (sign === 0) sign = next;
        else if (next !== 0 && sign !== next) return false;
    }

    return true;
}


/**
 * @param {[number, number][]} points
 */
export function isSelfClosing (points) {
    const f = points[0];
    const l = points[points.length - 1];
    return f[0] === l[0] && f[1] === l[1];
}

/**
 * @param {[number, number][]} points
 */
export function getLength (points) {
    let sum = 0;

    for (let i = 1; i < points.length; i++) {
        const dx = points[i][0] - points[i-1][0];
        const dy = points[i][1] - points[i-1][1];
        sum += Math.sqrt(dx * dx + dy * dy);
    }

    return sum;
}