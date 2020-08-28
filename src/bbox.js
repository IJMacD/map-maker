
/**
 * Can the string be considered a valid bbox?
 * - Are there four parts?
 * - Are they all numberic?
 * - Are they in the correct order?
 * @param {string} bbox 
 */
export function isValid (bbox) {
    const parts = bbox.split(",");
    
    if (parts.length !== 4) return false;
  
    if (parts.some(p => isNaN(+p))) return false;
  
    return +parts[0] < +parts[2] && +parts[1] < +parts[3];
}

/**
 * Determines whether or not areaB is entirely contained
 * within areaA
 * @param {string} areaA 
 * @param {string} areaB 
 * @returns {boolean}
 */
export function contains (areaA, areaB) {
    const [Ax1,Ay1,Ax2,Ay2] = areaA.split(",");
    const [Bx1,By1,Bx2,By2] = areaB.split(",");

    return (Bx1 >= Ax1 && By1 >= Ay1 && Bx2 <= Ax2 && By2 <= Ay2);
}

/**
 * Compute simple area
 * @param {string} bbox 
 */
export function getArea (bbox) {
    const parts = bbox.split(",");
    return (+parts[2] - +parts[0]) * (+parts[3] - +parts[1]);
}