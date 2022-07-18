export default class ObjectDatabase {
    constructor () {
        this.store = {};
    }

    saveNodes (nodes) {
        for (const n of nodes) {
            this.store[n.id] = n;
        }
    }

    getNode (id) {
        return this.store[id];
    }

    /**
     * 
     * @param {number[]} ids 
     */
    getNodes (ids) {
        return Promise.resolve(ids.map(id => this.getNode(id)));
    }
}