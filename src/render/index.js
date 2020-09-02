import { rectToPoints } from "../geometry";
import { renderPoint } from "./renderPoint";
import { renderLine } from "./renderLine";
import { renderArea } from "./renderArea";
import { renderText } from "./renderText";
import { renderGridlines } from "./renderGridlines";
import { renderPsuedoElement } from "./renderPsuedoElement";
import { mercatorProjection, getCentrePoint, getMidPoint } from "./util";
import { matchPsuedoClasses } from "./matchPsuedoClasses";
import { renderRelation } from "./renderRelation";

/**
 * @param {HTMLCanvasElement} canvas
 */
export function clearMap (canvas) {
    const { clientWidth, clientHeight } = canvas;

    const width = clientWidth * devicePixelRatio;
    const height = clientHeight * devicePixelRatio;

    canvas.width = width;
    canvas.height = height;
}

/** @typedef {import("../Style").StyleRule} StyleRule */
/** @typedef {import("../Overpass").OverpassElement} OverpassElement */

/**
 * @param {[number,number]} centre
 * @param {number} scale
 * @param {import("../Overpass").OverpassElement[]} elements
 * @param {HTMLCanvasElement} canvas
 * @param {import("../Style").StyleRule} rule
 * @param {{ zoom: number, current: Position }} context
 */
export function renderMap (centre, scale, elements=[], canvas, rule, context) {
    // Prepare node map
    /** @type {{ [id: number]: import("../Overpass").OverpassNodeElement }} */
    const nodeMap = {};
    elements.forEach(n => n.type === "node" && (nodeMap[n.id] = n));
    // Prepare way map
    /** @type {{ [id: number]: import("../Overpass").OverpassWayElement }} */
    const wayMap = {};
    elements.forEach(n => n.type === "way" && (wayMap[n.id] = n));

    const ctx = canvas.getContext("2d");
    const { clientWidth, clientHeight } = canvas;

    const width = clientWidth * devicePixelRatio;
    const height = clientHeight * devicePixelRatio;

    /** @type {(lon: number, lat: number) => [number, number]} */
    const projection = mercatorProjection(centre, scale, width, height);

    ctx.save();

    // Set up global context options
    globalSetup(ctx, rule);

    const { type } = rule.selector;

    // Non-Overpass Types first
    switch (type) {
        case "map": {
            const points = rectToPoints(0, 0, width, height);
            if (rule.selector.pseudoElement)
                renderPsuedoElement(ctx, rule, null, null, points);
            else
                renderArea(ctx, rule, points);
            break;
        }
        case "current": {
            if (context.current) {
                const { coords } = context.current;
                renderPoint(ctx, rule, projection(coords.longitude, coords.latitude));
            }
            break;
        }
        case "gridlines": {
            renderGridlines(ctx, rule, centre, scale, width, height, projection);
            break;
        }
        case "dummy": {
            renderPoint(ctx, rule, [0, 0]);
            break;
        }
        default:
            // Then iterate all elements
            for (const el of elements) {
                switch (type) {
                    case "node": {
                        if (el.type !== "node") continue;

                        renderPoint(ctx, rule, projection(el.lon, el.lat), el);
                        break;
                    }
                    case "way":
                    case "area": {
                        if (el.type !== "way") continue;

                        /** @type {import("../Overpass").OverpassNodeElement[]} */
                        const nodes = el.nodes.map(id => nodeMap[id]);
                        const points = nodes.map(n => projection(n.lon, n.lat));

                        if (!matchPsuedoClasses(rule, el, nodes, points)) continue;

                        if (rule.selector.pseudoElement) {
                            renderPsuedoElement(ctx, rule, el, nodes, points);
                        }
                        else {
                            // Render actual way/area
                            if (type === "area") {
                                renderArea(ctx, rule, points, el);
                            } else {
                                renderLine(ctx, rule, points, el);
                            }
                        }
                        break;
                    }
                    case "relation": {
                        if (el.type !== "relation") continue;

                        renderRelation(ctx, rule, el, wayMap, nodeMap, projection);
                        break;
                    }
                }
            }
    }

    ctx.restore();
}

export function globalSetup(ctx, rule) {
    if (rule.declarations["opacity"])
        ctx.globalAlpha = +rule.declarations["opacity"];

    if (rule.declarations["position"] === "relative") {
        const top = (parseFloat(rule.declarations["top"]) || 0) * devicePixelRatio;
        const left = (parseFloat(rule.declarations["left"]) || 0) * devicePixelRatio;

        ctx.translate(left, top);
    }
}
