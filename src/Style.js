
/** 
 * @typedef StyleRule
 * @property {StyleSelector} [selector]
 * @property {StyleSelector[]} [selectors]
 * @property {{ [key: string]: string }} declarations
 */

export class StyleSelector {
    /**
     * @param {string} type
     * @param {{ [key: string]: string }} tags
     */
    constructor (type, tags) {
      this.type = type;
      this.tags = tags;
    }
  
    toString () {
      return `${this.type}${Object.entries(this.tags).map(([k,v]) => `[${k}=${v}]`).join("")}`;
    }
}
  
StyleSelector.parse = function (text) {
    const re = /(node|way|relation|area)/;
    const m = re.exec(text);
  
    if (!m) return null;
  
    const type = m[1];
    /** @type {{ [key: string]: string }} */
    const tags = {};
  
    text = text.substring(type.length);
  
    const re2 = /\[([^[\]=]+)=([^[\]=]+)\]/g;
  
    let m2;
  
    while (m2 = re2.exec(text)) {
      tags[m2[1]] = m2[2];
    }
  
    return new StyleSelector(type, tags);
}
  
/**
 * 
 * @param {string} text 
 */
StyleSelector.parseMultiple = function (text) {
    return text.split(",").map(StyleSelector.parse).filter(x => x);
}

/**
 * 
 * @param {{ rules: StyleRule[] }} style 
 * @param {import("./Overpass").OverpassElement} element 
 * @returns {StyleRule}
 */
export function matchRule (style, element) {
    for (const rule of style.rules) {
      for (const selector of rule.selectors) {
        if (element.type !== selector.type) continue;
  
        let match = true;
  
        for (const [key, value] of Object.entries(selector.tags)) {
          if (!element.tags || element.tags[key] !== value) {
            match = false;
            break;
          }
        }
  
        if (match)  return rule;
      }
    }
}

/**
 * @param {string} styleText
 * @returns {{ rules: StyleRule[] }}
 */
export function parseStyle (styleText) {
  const re = /([^{}]+)\s*{([^{}]*)}/g;
  let match;
  const out = { rules: [] };

  while(match = re.exec(styleText)) {
    const declarations = {};
    
    match[2].split(";").map(s => s.trim()).filter(s => s).forEach(s => {
      // s.split(":", 2) is not the same as PHP
      const i = s.indexOf(":");
      const property = s.substring(0,i).trim();
      const value = s.substring(i+1).trim();
      declarations[property] = value;
    });

    const selectors = StyleSelector.parseMultiple(match[1]);

    if (selectors.length) {
      out.rules.push({
        selectors,
        declarations,
      });
    }
  }

  return out;
}

/**
 * 
 * @param {StyleRule[]} rules 
 */
export function expandRules (rules) {
  const out = [];
  for (const rule of rules) {
    const { declarations } = rule;
    for (const selector of rule.selectors) {
      out.push({ selector, declarations });
    }
  }
  return out;
}