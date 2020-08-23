export default class Database {
    constructor (name) {
        const request = indexedDB.open(name);
        request.addEventListener("upgradeneeded", ev => {
            /** @type {IDBOpenDBRequest} */
            const request = (ev.target);
            const db = request.result;
            db.createObjectStore("nodes", { keyPath: "id" });
        });
        request.addEventListener("success", ev => {
            /** @type {IDBOpenDBRequest} */
            const request = (ev.target);
            this.db = request.result;
        });
        
    }

    saveNodes (nodes) {
        const store = this.db.transaction("nodes", "readwrite").objectStore("nodes");
        for (const n of nodes) {
            store.put(n);
        }
    }

    getNode (id) {
        return new Promise((resolve, reject) => {
            const store = this.db.transaction("nodes", "readonly").objectStore("nodes");
            const request = store.get(id);
            request.addEventListener("success", e => resolve(request.result));
            request.addEventListener("error", e => reject(e));
        });
    }

    /**
     * 
     * @param {number[]} ids 
     */
    getNodes (ids) {
        return Promise.all(ids.map(id => this.getNode(id)));
    }
}