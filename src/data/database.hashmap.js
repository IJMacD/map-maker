export default class HashMapDatabase {
    constructor () {
        this.store = new Map();
    }

    saveNodes (nodes) {
        for (const n of nodes) {
            this.store.set(n.id, n);
        }
    }

    getNode (id) {
        return this.store.get(id);
    }

    /**
     * 
     * @param {number[]} ids 
     */
    getNodes (ids) {
        return Promise.resolve(ids.map(id => this.getNode(id)));
    }
}