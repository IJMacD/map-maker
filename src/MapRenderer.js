import { mercatorProjection, getCentrePoint, getMidPoint, getAveragePoint, getBoundingBox } from "./util";
import { rectToPoints, isSelfClosing } from "./geometry";
import { matchPseudoClasses } from "./matchPseudoClasses";
import { getContent } from "./canvas-render/getContent";

/** @typedef {{ centre: [number, number], zoom: number, current: Position, width: number, height: number, scale: number }} MapContext */

export default class MapRenderer {

    /**
     * @param {MapContext} context
     * @param {import("./Style").StyleRule} rule
     * @param {import("./Overpass").OverpassElement[]} elements
     */
    renderRule (context, rule, elements=[]) {
        // Prepare node map
        /** @type {{ [id: number]: import("./Overpass").OverpassNodeElement }} */
        const nodeMap = {};
        elements.forEach(n => n.type === "node" && (nodeMap[n.id] = n));
        // Prepare way map
        /** @type {{ [id: number]: import("./Overpass").OverpassWayElement }} */
        const wayMap = {};
        elements.forEach(n => n.type === "way" && (wayMap[n.id] = n));

        const { centre, zoom, width, height } = context;

        /** @type {(lon: number, lat: number) => [number, number]} */
        const projection = mercatorProjection(centre, zoom, width, height);

        // Set up global context options
        this.globalSetup(rule);

        const { type } = rule.selector;

        // Non-Overpass Types first
        switch (type) {
            case "map": {
                const points = rectToPoints(0, 0, width, height);
                if (rule.selector.pseudoElement)
                    this.renderPseudoElement(context, rule, points, null, null);
                else
                    this.renderArea(context, rule, points, null);
                break;
            }
            case "current": {
                if (context.current) {
                    const { coords } = context.current;
                    this.renderPoint(context, rule, projection(coords.longitude, coords.latitude));
                }
                break;
            }
            case "gridlines": {
                // this.renderGridlines(context, rule, projection);
                break;
            }
            case "dummy": {
                this.renderPoint(context, rule, [0, 0]);
                break;
            }
            default:
                // Then iterate all elements
                for (const el of elements) {
                    switch (type) {
                        case "node": {
                            if (el.type !== "node") continue;

                            const point = projection(el.lon, el.lat);

                            if (rule.selector.pseudoElement) {
                                this.renderPseudoElement(context, rule, [point], el, [el]);
                            }
                            else {
                                this.renderPoint(context, rule, point, el);
                            }
                            break;
                        }
                        case "way":
                        case "area": {
                            if (el.type !== "way") continue;

                            /** @type {import("./Overpass").OverpassNodeElement[]} */
                            const nodes = el.nodes.map(id => nodeMap[id]);
                            const points = nodes.map(n => projection(n.lon, n.lat));

                            if (!matchPseudoClasses(rule, points, el, nodes)) continue;

                            if (rule.selector.pseudoElement) {
                                this.renderPseudoElement(context, rule, points, el, nodes);
                            }
                            else {
                                // Render actual way/area
                                if (type === "area") {
                                    this.renderArea(context, rule, points, el);
                                } else {
                                    this.renderLine(context, rule, points, el);
                                }
                            }
                            break;
                        }
                        case "relation": {
                            if (el.type !== "relation") continue;

                            // this.renderRelation(rule, el, wayMap, nodeMap, projection, context);
                            break;
                        }
                    }
                }
        }
    }

    renderPoint (context, rule, point, element=null) {}

    renderLine (context, rule, points, element=null) {
        this.renderAreaLine(context, rule, points, getMidPoint, element);
    }

    renderArea (context, rule, points, element=null) {
        if (points.length === 0)
            return;

        if (!isSelfClosing(points)) {
            points = [ ...points, points[0] ];
        }

        this.renderAreaLine(context, rule, points, getCentrePoint, element);
    }

    renderAreaLine (context, rule, points, getPoint, element=null) {}

    /**
     * @param {MapContext} context
     * @param {import("./Style").StyleRule} rule
     * @param {[number, number][]} points
     * @param {import("./Overpass").OverpassElement} [element]
     * @param {import("./Overpass").OverpassNodeElement[]} [nodes]
     */
    renderPseudoElement(context, rule, points, element=null, nodes=null) {
        switch (rule.selector.pseudoElement) {
            case "centre":
            case "center": {
                // Centre of bounding box
                const centrePoint = getCentrePoint(points);
                this.renderPoint(context, rule, centrePoint, element);
                break;
            }
            case "mid-point": {
                // N/2th point (median point)
                const midPoint = getMidPoint(points);
                this.renderPoint(context, rule, midPoint, element);
                break;
            }
            case "average-point": {
                // Average of all points
                const avgPoint = getAveragePoint(points);
                this.renderPoint(rule, avgPoint, element, context);
                break;
            }
            case "start": {
                // First point
                this.renderPoint(context, rule, points[0], element);
                break;
            }
            case "end": {
                // Last point
                this.renderPoint(context, rule, points[points.length - 1], element);
                break;
            }
            case "centre-of-mass": {
                // TODO: calculate centre-of-mass
                // const avgPoint = getCOMPoint(points);
                // renderPoint(ctx, rule, avgPoint, element);
                break;
            }
            case "bounding-box": {
                const bounding = getBoundingBox(points);

                const boundingPoints = rectToPoints(...bounding);

                this.renderArea(context, rule, boundingPoints, element);
                break;
            }
            case "content-box": {
                const { scale } = context;
                const content = getContent(rule, element);
                const size = this.measureText(context, rule, content);
                let [ x, y ] = points[0];
                const { width, ascending, descending } = size;
                const padding = rule.declarations["padding"] ? parseFloat(rule.declarations["padding"]) * scale : 0;

                if (rule.declarations["text-align"] === "center" || rule.declarations["text-align"] === "centre") {
                    x -= width / 2;
                }
                else if (rule.declarations["text-align"] === "right") {
                    x -= width;
                }

                /** @type {[number, number][]} */
                const boundPoints = [
                    [ x - padding,           y - ascending - padding ],     // Top Left
                    [ x - padding,           y + descending + padding ],    // Bottom left
                    [ x + width + padding,   y + descending + padding ],    // Bottom right
                    [ x + width + padding,   y - ascending - padding ],     // Top Right
                ];

                // Close self
                boundPoints.push(boundPoints[0]);

                this.renderAreaLine(context, rule, boundPoints, () => points[0], element);
                break;
            }
            case "decimate": {
                if (rule.selector.type === "way") {
                    const l = points.length - 1;
                    const decimatedPoints = points.filter((p, i) => i % 10 === 0 || i === l);
                    this.renderLine(context, rule, decimatedPoints, element);
                }
                break;
            }
        }
    }

    globalSetup (rule) { }

    /**
     *
     * @param {MapContext} context
     * @param {import("./Style").StyleRule} rule
     * @param {string} text
     * @return {{ width: number, ascending: number, descending: number, height: number }}
     */
    measureText (context, rule, text) { }
}