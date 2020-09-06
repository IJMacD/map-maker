/**
 * @param {import("./Style").StyleRule} rule
 * @param {import("./Overpass").OverpassElement} element
 * @param {import("./MapRenderer").MapContext} context
 */

export function getContent(rule, element, context) {
    let content = rule.declarations["content"];

    if (!content)
        return "";

    let index = 0;
    /** @type {string[]} */
    const out = [];

    while (index < content.length) {
        const c = content.substr(index);

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

        m = /^tag\(([^)]+)\)/.exec(c);
        if (m) {
            out.push(element.tags[m[1]] || "");
            index += m[0].length;
            continue;
        }

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

        // Shouldn't get here
        return "?";
    }

    return out.join("");
}
