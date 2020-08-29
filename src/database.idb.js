import { contains, getArea } from "./bbox";

export default class IDBElementDatabase {
    constructor (name="OverpassElements") {
        const request = indexedDB.open(name);

        request.addEventListener("upgradeneeded", ev => {
            /** @type {IDBOpenDBRequest} */
            const request = (ev.target);
            const db = request.result;
            db.createObjectStore("nodes", { keyPath: "id" });

            const store = db.createObjectStore("elements");
            store.createIndex("selectorIndex", ["selector", "area"], { unique: false });
        });

        /** @type {Promise<IDBDatabase>} */
        this.db = new Promise((resolve, reject) => {
            request.addEventListener("success", ev => {
                /** @type {IDBOpenDBRequest} */
                const request = (ev.target);
                resolve(request.result);
            });

            request.addEventListener("error", reject);
        })

    }

    async saveNodes (nodes) {
        const db = await this.db;
        const store = db.transaction("nodes", "readwrite").objectStore("nodes");
        for (const n of nodes) {
            store.put(n);
        }
    }

    async getNode (id) {
        const db = await this.db;

        return new Promise((resolve, reject) => {
            const store = db.transaction("nodes", "readonly").objectStore("nodes");
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

    /**
     * 
     * @param {string} bbox 
     * @param {string} selector 
     * @returns {Promise<{ elements: import("./Overpass").OverpassElement[] }>}
     */
    async getElements (bbox, selector) {
        const db = await this.db;
        const key = makeKey(bbox, selector);

        return new Promise((resolve, reject) => {
            const objectStore = db.transaction("elements", "readonly").objectStore("elements");
            const request = objectStore.get(key);
            request.addEventListener("success", e => resolve(request.result));
            request.addEventListener("error", reject);
        });
    }

    /**
     * 
     * @param {string} bbox 
     * @param {string} selector 
     * @returns {Promise<{ elements: import("./Overpass").OverpassElement[] }>}
     */
    async searchElements (bbox, selector) {
        const db = await this.db;

        return new Promise((resolve, reject) => {
            const objectStore = db.transaction("elements", "readonly").objectStore("elements");
            const index = objectStore.index("selectorIndex");
            const range = IDBKeyRange.bound([selector,0], [selector,Number.MAX_VALUE]);
            const request = index.openCursor(range);
            let count = 0;
            request.addEventListener("success", e => {
                const cursor = request.result;
                
                if (cursor) {
                    count++;
                    if (contains(cursor.value.bbox, bbox)) {
                        console.debug(`${selector} found after checking ${count} records`);
                        resolve(cursor.value);
                        return;
                    }
                    cursor.continue();
                }
                else {
                    console.debug(`${selector} not found after checking ${count} records`);
                    resolve(null);
                }
            });
            request.addEventListener("error", reject);
        });
    }

    /**
     * 
     * @param {string} bbox 
     * @param {string} selector 
     * @param {{ elements: import("./Overpass").OverpassElement[], cached: number }} record 
     */
    async saveElements (bbox, selector, record) {
        const db = await this.db;
        const key = makeKey(bbox, selector);
        const area = getArea(bbox);

        return new Promise((resolve, reject) => {
            const objectStore = db.transaction("elements", "readwrite").objectStore("elements");
            const request = objectStore.put({ selector, bbox, area, ...record }, key);
            request.addEventListener("success", () => {
                console.debug(`Saved ${selector}/${bbox} to database with ${record.elements.length} elements`);
                resolve();
            });
            request.addEventListener("error", reject);
        });
    }
}

function makeKey (bbox, selector) {
    const bkey = bbox.split(",").map(p => (+p).toFixed(3)).join(",");
    return `${bkey}#${selector}`;
}
