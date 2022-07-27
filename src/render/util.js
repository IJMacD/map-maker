import CollisionSystem from "../Classes/CollisionSystem";
import { getBoundingBox } from "../util/util";

/**
 * Shared logic for `collision-*` properties
 * @note Only `collision-policy: hide` is implemented at the moment.
 * @param {{ [property: string]: string }} declarations
 * @param {BoundingBox} box [x, y, width, height] [x, y] is top left
 * @returns {boolean} `false` if there is a collision and rendering should abort
 */
export function handleCollisionProperties(declarations, box) {
    if (declarations["collision-set"]) {

        if (declarations["collision-size"]) {
            const s = /(\d+\.?\d*)%/.exec(declarations["collision-size"]);

            const scaleFactor = +s[1] / 100;
            const w = box[2];
            const h = box[3];

            box[0] += (1 - scaleFactor) * w / 2;
            box[1] += (1 - scaleFactor) * h / 2;
            box[2] = w * scaleFactor;
            box[3] = h * scaleFactor;
        }

        const collisionSystem = CollisionSystem.getCollisionSystem();

        if (!collisionSystem.add(declarations["collision-set"], box)) {
            const policy = declarations["collision-policy"] || "hide";

            if (policy === "hide") {
                return false;
            }
        }
    }

    return true;
}

/**
 *
 * @param {{ [property: string]: string }} declarations
 * @returns
 */
export function hasPointProperties(declarations) {
    return declarations["content"] || declarations["size"] || declarations["path"] || declarations["icon"];
}
