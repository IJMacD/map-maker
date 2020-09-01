import { rectToPoints } from "../geometry";
import { renderPoint } from "./renderPoint";
import { renderLine } from "./renderLine";
import { renderArea } from "./renderArea";
import { renderText } from "./renderText";
import { renderGridlines } from "./renderGridlines";
import { renderPsuedoElement } from "./renderPsuedoElement";
import { mercatorProjection, getCentrePoint, getMidPoint } from "./util";
import { matchPsuedoClasses } from "./matchPsuedoClasses";

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
    if (rule.declarations["opacity"]) 
        ctx.globalAlpha = +rule.declarations["opacity"];

    if (rule.declarations["position"] === "relative") {
        const top = parseFloat(rule.declarations["top"]) || 0;
        const left = parseFloat(rule.declarations["left"]) || 0;

        ctx.translate(left * devicePixelRatio, top * devicePixelRatio);
    }

    const { type } = rule.selector;

    // Non-Overpass Types first
    switch (type) {
        case "map": {
            const points = rectToPoints(0, 0, width, height);
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
                            const rfn = type === "area" ? renderArea : renderLine;

                            rfn(ctx, rule, points, el);

                            // Text Handling 
                            if (rule.declarations["content"]) {
                                // for area use centre point
                                // for way find mid-point (TODO: and average gradient?)
                                const point = type === "area" ? getCentrePoint(points) : getMidPoint(points);
                                renderText(ctx, rule, point, el);
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

function renderRelation(ctx, rule, el, wayMap, nodeMap, projection) {
    ctx.fillStyle = rule.declarations["fill"];
    ctx.strokeStyle = rule.declarations["stroke"];
    ctx.lineWidth = +rule.declarations["stroke-width"] * devicePixelRatio;

    // As long as outer ways go anti-clockwise and inner rings go clockwise
    // (or possibly vice-versa) then the CanvasRenderingContext2D can handle
    // rending "holes".
    ctx.beginPath();

    const ways = el.members.filter(m => m.type === "way").map(m => wayMap[m.ref]);

    for (const way of ways) {
        const nodes = way.nodes.map(id => nodeMap[id]);

        ctx.moveTo(...projection(nodes[0].lon, nodes[0].lat));
        for (let i = 1; i < nodes.length; i++) {
            ctx.lineTo(...projection(nodes[i].lon, nodes[i].lat));
        }
    }
    ctx.closePath();

    rule.declarations["fill"] && ctx.fill();
    rule.declarations["stroke"] && ctx.stroke();
}
