
const SHIFT_REGISTER_VALUE = 473;

/**
 * Evaluate right-hand-side in following usage examples:
 *
 *  content: "hello";
 *  content: tag(name);
 *  content: "hello " tag(name);
 *
 * @param {string} value
 * @param {OverpassElement?} element
 * @param {MapContext} context
 * @returns
 */
 export function evaluateText (value, element, context) {

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


        // Handle tag() function.
        // Evaluates to the value of a tag, or optionally a default constant.
        // e.g.
        //  tag(name, "UNKNOWN");
        //  tag(size, 3);
        m = /^tag\(([^),]+)(?:,\s*([^),]+))?\s*\)/.exec(c);
        if (m) {
            // Element required for `tag()`
            if (element) {
                out.push(element.tags[m[1]] || m[2]?.replace(/^"|"$/g, "") || "");
            }
            else {
                out.push("NO_ELEMENT");
            }

            index += m[0].length;
            continue;
        }

        // Handle debug() function
        m = /^debug\(([^)]+)\)/.exec(c);
        if (m) {
            // Elemennt required for `debug()`
            if (element) {
                if (m[1] === "type") out.push(element.type);
                else if (m[1] === "id") out.push(element.id.toString());
                else if (m[1] === "tags") out.push(Object.entries(element.tags).map(([key, value]) => `[${key}=${value}]`).join("\n"));
                else if (m[1] === "location" && element.type === "node") out.push(`(${element.lon},${element.lat})`);
                else if (m[1] === "node_count" && (element.type === "way" || element.type === "area")) out.push(element.nodes.length.toString());
                // else if (m[1] === "length" && (element.type === "way" || element.type === "area")) out.push(getLength(element.).toString())
                // else if (m[1] === "area" && (element.type === "way" || element.type === "area")) out.push(getArea(element.).toString())
                else if (m[1] === "scale") out.push(context.scale.toString());
            }
            else {
                out.push("NO_ELEMENT");
            }

            index += m[0].length;
            continue;
        }

        // Pass constants though
        return c;
    }

    return out.join("");
}

/**
 * Evaluate right-hand-side in following usage examples:
 *  fill: tag(color);
 *
 * Constants should just pass straight through:
 *  fill: red;
 *  fill: #000;
 *  fill: rgb(255,0,0);
 *
 * @param {string} value
 * @param {OverpassElement?} element
 * @param {MapContext} context
 * @returns
 */
export function evaluateColour (value, element, context) {

    if (!value) {
        return "";
    }

    // Gives (deterministic) random colour
    if (value === "random") {
        return `hsl(${((element?.id ?? 0) * SHIFT_REGISTER_VALUE)%360}, 100%, 50%)`;
    }

    // Handle tag() function.
    // Evaluates to the value of a tag, or optionally a default constant.
    // e.g.
    //  tag(name, "UNKNOWN");
    //  tag(size, 3);
    const match = /^tag\(([^),]+)(?:,\s*([^),]+))?\s*\)/.exec(value);
    if (element && match) {
        return (element.tags[match[1]] || match[2]?.replace(/^"|"$/g, "") || "");
    }

    return value;
}

/**
 * Evaluate right-hand-side in following usage examples:
 *  size: tag(count);
 *
 * Constants should just pass straight through:
 *  size: 2;
 *
 * @param {string} value
 * @param {OverpassElement?} element
 * @param {MapContext} context
 * @returns
 */
export function evaluateDimension (value, element, context) {

    if (!value) {
        return "";
    }

    // Handle tag() function.
    // Evaluates to the value of a tag, or optionally a default constant.
    // e.g.
    //  tag(name, "UNKNOWN");
    //  tag(size, 3);
    const match = /^tag\(([^),]+)(?:,\s*([^),]+))?\s*\)/.exec(value);
    if (element && match) {
        return (element.tags[match[1]] || match[2]?.replace(/^"|"$/g, "") || "");
    }

    return value;
}