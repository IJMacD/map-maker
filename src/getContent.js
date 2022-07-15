import { evaluateValue } from "./evaluate";

/**
 * @param {import("./Style").StyleRule} rule
 * @param {import("./Overpass").OverpassElement} element
 * @param {import("./MapRenderer").MapContext} context
 */
export function getContent(rule, element, context) {
    let content = rule.declarations["content"];

    if (!content)
        return "";

    return evaluateValue(content, element, context);
}
