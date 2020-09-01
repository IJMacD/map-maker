import { rectToPoints } from "../geometry";
import { renderPoint } from "./renderPoint";
import { renderArea } from "./renderArea";
import { getCentrePoint, getMidPoint, getAveragePoint, getBoundingBox } from "./util";

export function renderPsuedoElement(ctx, rule, element, nodes, points) {
    if (rule.selector.pseudoElement === "centre" || rule.selector.pseudoElement === "center") {
        // Centre of bounding box
        const centrePoint = getCentrePoint(points);
        renderPoint(ctx, rule, centrePoint, element);
    }
    else if (rule.selector.pseudoElement === "mid-point") {
        // N/2th point (median point)
        const midPoint = getMidPoint(points);
        renderPoint(ctx, rule, midPoint, element);
    }
    else if (rule.selector.pseudoElement === "average-point") {
        // Average of all points
        const avgPoint = getAveragePoint(points);
        renderPoint(ctx, rule, avgPoint, element);
    }
    else if (rule.selector.pseudoElement === "start") {
        // First point
        renderPoint(ctx, rule, points[0], element);
    }
    else if (rule.selector.pseudoElement === "end") {
        // Last point
        renderPoint(ctx, rule, points[points.length - 1], element);
    }
    else if (rule.selector.pseudoElement === "centre-of-mass") {
        // TODO: calculate centre-of-mass
        // const avgPoint = getCOMPoint(points);
        // renderPoint(ctx, rule, avgPoint, element);
    }
    else if (rule.selector.pseudoElement === "bounding-box") {
        const bounding = getBoundingBox(points);

        const boundingPoints = rectToPoints(...bounding);

        renderArea(ctx, rule, boundingPoints, element);
    }
}
