import { evaluateValue } from "./evaluate";

/**
 * @param {StyleRule} rule
 * @param {OverpassElement} element
 * @param {MapContext} context
 */
export function getContent(rule, element, context) {
    let content = rule.declarations["content"];

    if (!content)
        return "";

    return evaluateValue(content, element, context);
}
