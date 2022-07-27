import { evaluateText } from "./evaluate";

/**
 * @param {{ [property: string]: string }} declarations
 * @param {OverpassElement?} element
 * @param {MapContext} context
 */
export function getContent(declarations, element, context) {
    let content = declarations["content"];

    if (!content)
        return "";

    return evaluateText(content, element, context);
}
