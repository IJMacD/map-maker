export default class CollisionSystem {
    /** @type {CollisionSystem} */
    static singleton;

    constructor () {
        /** @type {{ [name: string]: [number, number, number, number][] }} */
        this.sets = {}
    }

    clear () {
        this.sets = {};
    }

    /**
     *
     * @param {string} set
     * @param {[number, number, number, number]} box
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
 * [x , y, width, height]
 * @param {[number, number, number, number]} boxA
 * @param {[number, number, number, number]} boxB
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