
/**
 * 
 * @param {number} x 
 * @param {number} y 
 * @param {number} width 
 * @param {number} height 
 * @returns {[number, number][]}
 */
export function rectToPoints(x, y, width, height) {
    /** @type {[number, number][]} */
    return [
        [x, y],
        [x, y + height],
        [x + width, y + height],
        [x + width, y],
    ];
}


/**
 * @see http://paulbourke.net/geometry/polygonmesh/#clockwise
 * @param {[number, number][]} points 
 */
export function crossProductArea (points) {
    let sum = 0;
    for (let i = 0; i < points.length - 1; i++) {
        sum += points[i][0] * points[i+1][1] - points[i+1][0] * points[i][1];
    }
    return sum / 2;
}

/**
 * @param {[number, number][]} points
 */
export function area (points) {
    return Math.abs(crossProductArea(points));
}

/**
 * @param {[number, number][]} points
 */
export function isAntiClockwise (points) {
    return crossProductArea(points) > 0;
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