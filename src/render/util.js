import CollisionSystem from "../Classes/CollisionSystem";
import { getBoundingBox } from "../util/util";

/**
 * Shared logic for `collision-*` properties
 * @note Only `collision-policy: hide` is implemented at the moment.
 * @param {StyleRule} rule
 * @param {BoundingBox} box [x, y, width, height] [x, y] is top left
 * @returns {boolean} `false` if there is a collision and rendering should abort
 */
export function handleCollisionProperties(rule, box) {
    if (rule.declarations["collision-set"]) {

        if (rule.declarations["collision-size"]) {
            const s = /(\d+\.?\d*)%/.exec(rule.declarations["collision-size"]);

            const scaleFactor = +s[1] / 100;
            const w = box[2];
            const h = box[3];

            box[0] += (1 - scaleFactor) * w / 2;
            box[1] += (1 - scaleFactor) * h / 2;
            box[2] = w * scaleFactor;
            box[3] = h * scaleFactor;
        }

        const collisionSystem = CollisionSystem.getCollisionSystem();

        if (!collisionSystem.add(rule.declarations["collision-set"], box)) {
            const policy = rule.declarations["collision-policy"] || "hide";

            if (policy === "hide") {
                return false;
            }
        }
    }

    return true;
}

export function hasPointProperties(rule) {
    return rule.declarations["content"] || rule.declarations["size"] || rule.declarations["path"] || rule.declarations["icon"];
}
