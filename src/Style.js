
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
     * @param {{ name: string, params: string[] }[]} pseudoClasses
     */
    constructor (type, tags, pseudoClasses=[]) {
      this.type = type;
      this.tags = tags;
      this.pseudoClasses = pseudoClasses;
    }
  
    toString () {
      return `${this.type}${Object.entries(this.tags).map(([k,v]) => `[${k}=${v}]`).join("")}`;
    }
}
  
StyleSelector.parse = /**
 * @param {string} text
 */
function (text) {
    const re = /^\s*([a-z]+)/;
    const m = re.exec(text);
  
    if (!m) return null;

    let type = m[1];

    if (type === "rel") {
      type = "relation";
    }

    /** @type {{ [key: string]: string }} */
    const tags = {};
  
    let tagText = text.substring(m[0].length).trim();
  
    const re2 = /^\[([^[\]=]+)=([^[\]=]+)\]/;

    while (true) {
      const m2 = re2.exec(tagText);

      if (!m2) break;

      tags[m2[1]] = m2[2];

      tagText = tagText.substring(m2[0].length);
    }

    /** @type {{ name: string, params: string[] }[]} */
    const pseudoClasses = [];
  
    const re3 = /^:([a-z]+)(?:\(([^)]+)\))?/;

    while (true) {
      const m3 = re3.exec(tagText);

      if (!m3) break;

      pseudoClasses.push({ name: m3[1], params: m3[2] ? m3[2].split(",") : [] });

      tagText = tagText.substring(m3[0].length);
    }

    if (tagText.length) {
      console.log(`Invalid selector: ${text} unexpected part: '${tagText}'`);
      return null;
    }
  
    return new StyleSelector(type, tags, pseudoClasses);
};
  
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
        if (matchSelector(selector, element))  return rule;
      }
    }
}

/**
 * @param {StyleSelector} selector
 * @param {import("./Overpass").OverpassElement} element
 */
export function matchSelector (selector, element) {
  if (element.type !== selector.type) return false;

  let match = true;

  for (const [key, value] of Object.entries(selector.tags)) {
    if (!element.tags || element.tags[key] !== value) {
      match = false;
      break;
    }
  }

  return match;
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