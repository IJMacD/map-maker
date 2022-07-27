import { evaluateValue } from "./evaluate";

/**
 * @param {{ [property: string]: string }} declarations
 * @param {OverpassElement?} element
 * @param {MapContext} context
 */
export function getContent(declarations, element, context) {
    let content = declarations["content"];

    if (!content)
        return "";

    return evaluateValue(content, element, context);
}
