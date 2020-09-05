/**
 * @param {import("../Style").StyleRule} rule
 * @param {import("../Overpass").OverpassElement} element
 */

export function getContent(rule, element) {
    let content = rule.declarations["content"];

    if (!content)
        return "";

    if (content.match(/^".*"$/g)) {
        content = content.replace(/^"|"$/g, "");
    }
    else if (content.match(/tag\(([^)]+)\)/)) {
        const m = content.match(/tag\(([^)]+)\)/);
        content = element.tags[m[1]] || "";
    }
    else {
        content = "?";
    }
    return content;
}
