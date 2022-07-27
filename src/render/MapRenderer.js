import { mercatorProjection, getCentrePoint, getMidPoint, getAveragePoint, getBoundingBox } from "../util/util";
import { rectToPoints, isSelfClosing } from "../util/geometry";
import { matchPseudoClasses } from "../util/matchPseudoClasses";
import { getContent } from "../util/getContent";
import { makeBBoxArray } from "../util/bbox";
import { matchSelector } from "../Classes/Style";

/**
 * @abstract
 */
export default class MapRenderer {

    /**
     * @param {MapContext} context
     * @param {StyleRule} rule
     * @param {OverpassElement[]} [elements]
     * @param {StyleRule[]} [wildcardRules]
     */
    renderRule (context, rule, elements=[], wildcardRules=[]) {
        // Prepare node map
        /** @type {{ [id: number]: OverpassNodeElement }} */
        const nodeMap = {};
        elements.forEach(n => n.type === "node" && (nodeMap[n.id] = n));
        // Prepare way map
        /** @type {{ [id: number]: OverpassWayElement }} */
        const wayMap = {};
        elements.forEach(n => n.type === "way" && (wayMap[n.id] = n));

        const { centre, zoom, width, height } = context;

        /** @type {(lon: number, lat: number) => Point} */
        const projection = mercatorProjection(centre, zoom, width, height);

        const { selector, declarations } = rule;

        // Non-Overpass Types first
        switch (selector.type) {
            case "map": {
                const points = rectToPoints(0, 0, width, height);
                if (rule.selector.pseudoElement)
                    this.renderPseudoElement(context, selector, declarations, points, null);
                else
                    this.renderArea(context, declarations, points, null);
                break;
            }
            case "centre": {
                /** @type {OverpassNodeElement} */
                const dummyElement = { id: -1, type: "node", lon: context.centre[0], lat: context.centre[1], tags: {} };
                this.renderPoint(context, declarations, projection(dummyElement.lon, dummyElement.lat), dummyElement);
                break;
            }
            case "current": {
                if (context.current) {
                    const coords = context.current;
                    this.renderPoint(context, declarations, projection(coords.longitude, coords.latitude));
                }
                break;
            }
            case "gridlines": {
                this.renderGridlines(context, rule, declarations, projection);
                break;
            }
            case "dummy": {
                this.renderPoint(context, declarations, [0, 0]);
                break;
            }
            case "bbox": {
                // Mainly for debugging purposes. `mercatorProjection` can be
                // configured to overscan. This allows bbox inspection
                const size = /** @type {[number,number]} */([context.width, context.height]);
                const bbox = makeBBoxArray(context.centre, context.zoom, size);
                const [x1, y1] = projection(bbox[0], bbox[1]);
                const [x2, y2] = projection(bbox[2], bbox[3]);
                const centre = projection(context.centre[0], context.centre[1]);
                this.renderRect(context, declarations, [x1, y1, x2 - x1, y2 - y1], centre);
                break;
            }
            default:
                // Then iterate all elements
                for (const el of elements) {
                    if (!matchSelector(rule.selector, el)) continue;

                    const ruleDeclarations = rule.declarations;
                    const wildcardDeclarations = Object.assign({}, ...wildcardRules.filter(rule => matchSelector(rule.selector, el)).map(rule => rule.declarations));
                    const declarations = { ...ruleDeclarations, ...wildcardDeclarations };

                    switch (selector.type) {
                        case "node": {
                            if (el.type !== "node") continue;

                            const point = projection(el.lon, el.lat);

                            if (rule.selector.pseudoElement) {
                                this.renderPseudoElement(context, selector, declarations, [point], el, [el]);
                            }
                            else {
                                this.renderPoint(context, declarations, point, el);
                            }
                            break;
                        }
                        case "way":
                        case "area": {
                            if (el.type !== "way") continue;

                            /** @type {OverpassNodeElement[]} */
                            const nodes = el.nodes.map(id => nodeMap[id]);
                            const points = nodes.map(n => projection(n.lon, n.lat));

                            if (!matchPseudoClasses(rule, points, el, nodes)) continue;

                            if (rule.selector.pseudoElement) {
                                this.renderPseudoElement(context, selector, declarations, points, el, nodes);
                            }
                            else {
                                // Render actual way/area
                                if (selector.type === "area") {
                                    this.renderArea(context, declarations, points, el);
                                } else {
                                    this.renderLine(context, declarations, points, el);
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

    /**
     * @param {MapContext} context
     * @param {{ [property: string]: string }} declarations
     * @param {Point} point
     * @param {OverpassElement?} element
     */
    renderPoint (context, declarations, point, element=null) {}

    /**
     * @param {MapContext} context
     * @param {{ [property: string]: string }} declarations
     * @param {Point[]} points
     * @param {OverpassElement?} element
     */
    renderLine (context, declarations, points, element=null) {
        this.renderAreaLine(context, declarations, points, getMidPoint, element);
    }

    /**
     * @param {MapContext} context
     * @param {{ [property: string]: string }} declarations
     * @param {Point[]} points
     * @param {OverpassElement?} element
     */
    renderArea (context, declarations, points, element=null) {
        if (points.length === 0)
            return;

        if (!isSelfClosing(points)) {
            points = [ ...points, points[0] ];
        }

        this.renderAreaLine(context, declarations, points, getCentrePoint, element);
    }

    /**
     * There are certain things possible with rectangles such as padding or corner-radius
     * Default implementation just implements padding and passes to `renderAreaLine()`
     * @param {MapContext} context
     * @param {{ [property: string]: string }} declarations
     * @param {BoundingBox} bounding [x, y, width, height] [x, y] is top left
     * @param {Point|((points: [number,number][]) => [number,number])} origin
     * @param {OverpassElement?} element
     */
    renderRect (context, declarations, [ x, y, width, height ], origin, element=null) {
        const { scale } = context;

        const padding = declarations["padding"] ? parseFloat(declarations["padding"]) * scale : 0;

        // TODO: Check for correctness

        /** @type {Point[]} */
        const points = [
            [ x - padding,           y - height - padding ],    // Top Left
            [ x - padding,           y + padding ],             // Bottom left
            [ x + width + padding,   y + padding ],             // Bottom right
            [ x + width + padding,   y - height - padding ],    // Top Right
        ];

        // Self-close
        points.push(points[0]);

        this.renderAreaLine(context, declarations, points, origin, element);
    }

    /**
     * @param {MapContext} context
     * @param {{ [property: string]: string }} declarations
     * @param {Point[]} points
     * @param {Point|((points: [number,number][]) => [number,number])} origin
     * @param {OverpassElement?} element
     */
    renderAreaLine (context, declarations, points, origin, element=null) {}

    /**
     * @param {MapContext} context
     * @param {StyleSelector} selector
     * @param {{ [property: string]: string }} declarations
     * @param {Point[]} points
     * @param {OverpassElement?} element
     * @param {OverpassNodeElement[]} [nodes]
     */
    renderPseudoElement(context, selector, declarations, points, element, nodes=[]) {
        switch (selector.pseudoElement) {
            case "centre":
            case "center": {
                // Centre of bounding box
                const centrePoint = getCentrePoint(points);
                this.renderPoint(context, declarations, centrePoint, element);
                break;
            }
            case "mid-point": {
                // N/2th point (median point)
                const midPoint = getMidPoint(points);
                this.renderPoint(context, declarations, midPoint, element);
                break;
            }
            case "average-point": {
                // Average of all points
                const avgPoint = getAveragePoint(points);
                this.renderPoint(context, declarations, avgPoint, element);
                break;
            }
            case "start": {
                // First point
                this.renderPoint(context, declarations, points[0], element);
                break;
            }
            case "end": {
                // Last point
                this.renderPoint(context, declarations, points[points.length - 1], element);
                break;
            }
            case "centre-of-mass": {
                // TODO: calculate centre-of-mass
                // const avgPoint = getCOMPoint(points);
                // renderPoint(ctx, declarations, avgPoint, element);
                break;
            }
            case "bounding-box": {
                /**
                 * Box around topmost, leftmost, rightmost, and bottommost
                 * points.
                 */
                const bounding = getBoundingBox(points);

                this.renderRect(context, declarations, bounding, getCentrePoint, element);
                break;
            }
            case "content-box": {
                /**
                 * ContentBox is the box around text content specified by
                 * `content` property.
                 * This allows styling borders/background for content.
                 */
                let point = points[0];

                if (selector.type === "way")
                    point = getMidPoint(points);
                else if (selector.type === "area")
                    point = getCentrePoint(points);

                if (!element) return;

                const content = getContent(declarations, element, context);

                if (!content) return;

                let [ x, y ] = point;

                let width = Number.NEGATIVE_INFINITY;;
                let top = Number.NaN;
                let bottom = 0;
                let baseline = y;
                for (const line of content.split("\n")) {
                    const size = this.measureText(context, declarations, line);

                    width = Math.max(width, size.width);

                    if (isNaN(top)) top = y - size.ascending;

                    bottom = baseline + size.descending;

                    baseline += size.height;
                }

                if (declarations["text-align"] === "center" || declarations["text-align"] === "centre") {
                    x -= width / 2;
                }
                else if (declarations["text-align"] === "right") {
                    x -= width;
                }

                /** @type {BoundingBox} */
                const bounding = [ x, top, width, bottom - top ];

                this.renderRect(context, declarations, bounding, point, element);
                break;
            }
            case "decimate": {
                /**
                 * Very crude method of simplifying ways.
                 * Uses the alternative definition of "decimate".
                 * This method keeps first and last point, then every 10th
                 * point in between. i.e. only *keeps* 10%.
                 */
                if (selector.type === "way") {
                    const l = points.length - 1;
                    const decimatedPoints = points.filter((p, i) => i % 10 === 0 || i === l);
                    this.renderLine(context, declarations, decimatedPoints, element);
                }
                break;
            }
        }
    }

    /**
     *
     * @param {MapContext} context
     * @param {StyleRule} rule
     * @param {{ [property: string]: string }} declarations
     * @param {(lon: number, lat: number) => [number, number]} projection
     */
    renderGridlines (context, rule, declarations, projection) {
        const vertical = rule.selector.pseudoClasses.find(p => p.name === "vertical");
        const horizontal = rule.selector.pseudoClasses.find(p => p.name === "horizontal");

        const { width, height, centre, zoom } = context;

        const bbox = makeBBoxArray(centre, zoom, [width, height]);

        if (vertical) {
            const step = parseFloat(vertical.params[0]);

            const round = 1 / step;

            const sigFigs = Math.ceil(Math.log10(round));

            const xmin = Math.floor(bbox[0] * round) / round;
            const xmax = Math.ceil(bbox[2] * round) / round;
            const ymin = Math.floor(bbox[1] * round) / round;
            const ymax = Math.ceil(bbox[3] * round) / round;

            for (let i = xmin; i <= xmax; i += step) {
                const points = [ projection(i, ymin),  projection(i, (ymin + ymax) / 2), projection(i, ymax) ];
                this.renderLine(context, declarations, points, { type: "way", id: 0, nodes: [], tags: { name: i.toFixed(sigFigs) }});
            }
        }

        if (horizontal) {
            const step = parseFloat(horizontal.params[0]);

            const round = 1 / step;

            const sigFigs = Math.ceil(Math.log10(round));

            const xmin = Math.floor(bbox[0] * round) / round;
            const xmax = Math.ceil(bbox[2] * round) / round;
            const ymin = Math.floor(bbox[1] * round) / round;
            const ymax = Math.ceil(bbox[3] * round) / round;

            for (let j = ymin; j <= ymax; j += step) {
                const points = [ projection(xmin, j), projection((xmin + xmax) / 2, j), projection(xmax, j) ];
                this.renderLine(context, declarations, points, { type: "way", id: 0, nodes: [], tags: { name: j.toFixed(sigFigs) }});
            }
        }
    }

    clear (context) {}

    /**
     *
     * @param {MapContext} context
     * @param {{ [property: string]: string }} declarations
     * @param {string} text
     * @return {{ width: number, ascending: number, descending: number, height: number }}
     */
    measureText (context, declarations, text) {
        return { width: 0, ascending: 0, descending: 0, height: 0 };
    }
}