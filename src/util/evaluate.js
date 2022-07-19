/**
 * Evaluate right-hand-side in following usage examples:
 *
 *  content: "hello";
 *  content: tag(name);
 *  content: "hello " tag(name);
 *  fill: tag(color);
 *  size: tag(count);
 *
 * Constants should just pass straight through:
 *  size: 2;
 *  fill: red;
 *  fill: #000;
 *  fill: rgb(255,0,0);
 *
 * @param {string} value
 * @param {OverpassElement?} element
 * @param {MapContext} context
 * @returns
 */
export function evaluateValue (value, element, context) {

    if (!value) {
        return "";
    }

    let index = 0;
    /** @type {string[]} */
    const out = [];

    while (index < value.length) {
        const c = value.substring(index);

        let m = /^\s+/.exec(c);
        if (m) {
            index += m[0].length;
            continue;
        }

        m = /^"(.*?[^\\])"/.exec(c);
        if (m) {
            out.push(m[1].replace(/\\"/g, `"`).replace(/\\n/g, `\n`));
            index += m[0].length;
            continue;
        }

        // Following values require an element
        if (!element) {
            return c;
        }

        // Handle tag() function.
        // Evaluates to the value of a tag, or optionally a default constant.
        // e.g.
        //  tag(name, "UNKNOWN");
        //  tag(size, 3);
        m = /^tag\(([^),]+)(?:,\s*([^),]+))?\s*\)/.exec(c);
        if (m) {
            out.push(element.tags[m[1]] || m[2]?.replace(/^"|"$/g, "") || "");
            index += m[0].length;
            continue;
        }

        // Handle debug() function
        m = /^debug\(([^)]+)\)/.exec(c);
        if (m) {
            if (m[1] === "type") out.push(element.type);
            else if (m[1] === "tags") out.push(Object.entries(element.tags).map(([key, value]) => `[${key}=${value}]`).join("\n"));
            else if (m[1] === "location" && element.type === "node") out.push(`(${element.lon},${element.lat})`);
            else if (m[1] === "node_count" && (element.type === "way" || element.type === "area")) out.push(element.nodes.length.toString());
            // else if (m[1] === "length" && (element.type === "way" || element.type === "area")) out.push(getLength(element.).toString())
            // else if (m[1] === "area" && (element.type === "way" || element.type === "area")) out.push(getArea(element.).toString())
            else if (m[1] === "scale") out.push(context.scale.toString());
            index += m[0].length;
            continue;
        }

        // Pass constants though
        return c;
    }

    return out.join("");
}