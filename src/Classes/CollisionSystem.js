export default class CollisionSystem {
    /** @type {CollisionSystem} */
    static singleton;

    constructor () {
        /** @type {{ [name: string]: BoundingBox[] }} */
        this.sets = {}
    }

    clear () {
        this.sets = {};
    }

    /**
     * Checks if there is a collision between the new box and any previous
     * boxes in the collision set.
     * If there is no collision the new box is added.
     * @param {string} set
     * @param {BoundingBox} box
     * @returns {boolean} Result of adding the box. `true` if successful,
     * or `false` if there is a collision.
     */
    add (set, box) {
        if (!this.sets[set]) this.sets[set] = [];

        for (const other of this.sets[set]) {
            if (intersects(box, other)) return false;
        }

        this.sets[set].push(box);

        return true;
    }

    static getCollisionSystem () {
        if (!this.singleton) {
            this.singleton = new CollisionSystem();
        }

        return this.singleton;
    }
}


/**
 * Checks whether two bounding boxes intersect
 * @param {BoundingBox} boxA [x , y, width, height]
 * @param {BoundingBox} boxB [x , y, width, height]
 */
function intersects (boxA, boxB) {
    const ax1 = boxA[0];
    const ay1 = boxA[1];
    const ax2 = boxA[0] + boxA[2];
    const ay2 = boxA[1] + boxA[3];
    const bx1 = boxB[0];
    const by1 = boxB[1];
    const bx2 = boxB[0] + boxB[2];
    const by2 = boxB[1] + boxB[3];
    return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}