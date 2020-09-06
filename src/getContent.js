/**
 * @param {import("./Style").StyleRule} rule
 * @param {import("./Overpass").OverpassElement} element
 */

export function getContent(rule, element) {
    let content = rule.declarations["content"];

    if (!content)
        return "";

    let index = 0;
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

        // Shouldn't get here
        return "?";
    }

    return out.join("");
}
