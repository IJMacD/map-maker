export class StyleSelector {
    /**
     * @param {string} type
     * @param {{ [key: string]: string }} tags
     * @param {{ name: string, params: (string|Predicate)[] }[]} pseudoClasses
     * @param {string} [pseudoElement]
     */
    constructor (type, tags, pseudoClasses=[], pseudoElement) {
      this.type = type;
      this.tags = tags;
      this.pseudoClasses = pseudoClasses;
      this.pseudoElement = pseudoElement;
    }

    toString () {
      return `${this.type}${Object.entries(this.tags).map(([k,v]) => {
        const op = /^[<=>]/.test(v) ? "" : "=";
        return `[${k}${op}${v}]`;
      }).join("")}`;
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

    const re2 = /^\["?([a-z0-9:_-]+)"?(?:(=|<=|>=|<|>)([^[\]]+))?\]/i;

    while (true) {
      const m2 = re2.exec(tagText);

      if (!m2) break;

      const op = m2[2] === "=" ? "" : m2[2];

      tags[m2[1]] = m2[3] ? op + m2[3] : "*";

      tagText = tagText.substring(m2[0].length);
    }

    /** @type {{ name: string, params: (string|Predicate)[] }[]} */
    const pseudoClasses = [];

    const re3 = /^:([a-z-]+)(?:\(([^)]+)\))?/;

    while (true) {
      const m3 = re3.exec(tagText);

      if (!m3) break;

      const re = /^\s*([^\s)]+)\s*(:|=|<=|>=|<|>|and|or)\s*([^\s)]+)(?:\s*(=|<=|>=|<|>)\s*([^\s)]+))?/;
      const params = m3[2] ? m3[2].split(",").map(s => re.test(s) ? makePredicate(re.exec(s)) : s) : [];
      pseudoClasses.push({ name: m3[1], params });

      tagText = tagText.substring(m3[0].length);
    }

    let pseudoElement;

    const re4 = /^::([a-z-]+)?/;

    const m4 = re4.exec(tagText);
    if (m4) {
      pseudoElement = m4[1];

      tagText = tagText.substring(m4[0].length);
    }

    if (tagText.length) {
      console.log(`Invalid selector: ${text} unexpected part: '${tagText}'`);
      return null;
    }

    return new StyleSelector(type, tags, pseudoClasses, pseudoElement);
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
 * @param {OverpassElement} element
 * @returns {StyleRule?}
 */
export function matchRule (style, element) {
    for (const rule of style.rules) {
      if (matchSelector(rule.selector, element))
        return rule;
    }
    return null;
}

/**
 * @param {StyleSelector} selector
 * @param {OverpassElement} element
 */
export function matchSelector (selector, element, inequalities=true) {
  if (element.type !== selector.type && !(selector.type === "area" && element.type === "way")) return false;

  const entries = Object.entries(selector.tags);
  if (entries.length && typeof element.tags === "undefined") return false;

  for (const [key, value] of entries) {
    if (typeof element.tags[key] === "undefined") return false;

    const m = /^[<=>]+/.exec(value);
    if (m) {
      // Only test if inequalities are enabled
      if (inequalities) {
        const op = m[0];
        const cmp = COMPARE[op];
        // Skip if invalid operator
        if (!cmp) continue;
        const v = value.substr(m[0].length);
        // String compare or numeric compare
        const res = isNaN(+v) ? cmp(element.tags[key].localeCompare(v), 0) : cmp(+element.tags[key], +v);

        if (!res) return false;
      }
      // If inequalities are disabled then this tag gets a pass
    }
    else if (value !== "*" && element.tags[key] !== value) {
      return false;
    }
  }

  return true;
}

/**
 * @param {string} styleText
 */
export function parseStyle (styleText) {
  /** @type {{ rules: (StyleRule|MediaQuery)[] }} */
  const out = { rules: [] };

  let length = styleText.length;

  while (length > 0) {

    // Try parsing rule list
    const rulesResult = parseRules(styleText);
    out.rules.push(...rulesResult.rules);
    styleText = styleText.substring(rulesResult.index).trim();

    // Try parsing media query
    const mediaResult = parseMedia(styleText);
    out.rules.push(...mediaResult.mediaQueries);
    styleText = styleText.substring(mediaResult.index).trim();

    if (styleText.length === length) {
      console.log("Got stuck parsing style at: " + styleText);
      break;
    }

    length = styleText.length;
  }

  return out;
}

/**
 * @param {string} mediaText
 */
function parseMedia (mediaText) {
  const re = /^\s*@match\s*\(([^\s)]+)\s*(:|=|<=|>=|<|>|and|or)\s*([^\s)]+)(?:\s*(=|<=|>=|<|>)\s*([^\s)]+))?\)\s*{/;
  /** @type {{ mediaQueries: MediaQuery[], index: number }} */
  const out = { mediaQueries: [], index: 0 };
  let match;

  const re2 = /^\s*}/;
  let match2;

  while (match = re.exec(mediaText)) {
    const predicate = makePredicate(match);

    out.index += match[0].length;

    mediaText = mediaText.substring(match[0].length);

    const { rules, index } = parseRules(mediaText);

    out.index += index;

    mediaText = mediaText.substring(index);

    match2 = re2.exec(mediaText);

    if (match2) {
      out.mediaQueries.push({
        type: "query",
        predicate,
        rules,
      });

      out.index += match2[0].length;

    } else {
      console.log("Unterminated media query");
    }
  }

  return out;
}

function parseRules (ruleText) {
  const re = /^\s*([^{}]+)\s*{([^{}]*)}/;
  let match;
  /** @type {{ rules: StyleRule[], index: number }} */
  const out = { rules: [], index: 0 };

  while(match = re.exec(ruleText)) {
    /** @type {{ [key: string]: string }} */
    const declarations = {};

    match[2].split(";").map(s => s.trim()).filter(s => s).forEach(s => {
      // s.split(":", 2) is not the same as PHP
      const i = s.indexOf(":");
      const property = s.substring(0,i).trim();
      const value = s.substring(i+1).trim();
      declarations[property] = value;
    });

    const selectors = StyleSelector.parseMultiple(match[1]);

    // Duplicate rules for all selectors
    for (const selector of selectors) {
      out.rules.push({
        type: "rule",
        selector,
        declarations,
      });
    }

    out.index += match[0].length;

    ruleText = ruleText.substring(match[0].length);
  }

  return out;
}

/**
 *
 * @param {(StyleRule|MediaQuery)[]} rules
 * @param {MapContext} context
 * @returns {StyleRule[]}
 */
export function filterRules (rules, context) {
  /** @type {StyleRule[]} */
  const out = [];
  for (const rule of rules) {
    if (rule.type === "rule") {
      out.push(rule);
    } else {
      if (testPredicate(rule.predicate, context)) {
        out.push(...filterRules(rule.rules, context));
      }
    }
  }
  return out;
}

function makePredicate(match) {
  let predicate;

  if (match[4]) {
    // MediaQueries4 syntax:
    //  @match (10 < zoom <= 14)
    predicate = {
      left: { left: match[1], operator: match[2], right: match[3] },
      operator: "and",
      right: { left: match[3], operator: match[4], right: match[5] },
    };
  }
  else {
    // MediaQueries4 syntax:
    //  @match (zoom <= 14)
    // MediaQueries3 syntax:
    //  @match (max-zoom: 14) [TODO - it's parsed just not handled correctly]
    predicate = {
      left: match[1],
      operator: match[2],
      right: match[3],
    };
  }
  return predicate;
}

/**
 *
 * @param {Predicate} predicate
 * @param {MapContext} [context]
 * @returns {boolean}
 */
export function testPredicate (predicate, context={}) {
  let left = typeof predicate.left === "string" || typeof predicate.left === "number" ?
    predicate.left : testPredicate(predicate.left, context);
  let right = typeof predicate.right === "string" || typeof predicate.right === "number"  ?
    predicate.right : testPredicate(predicate.right, context);

  if (typeof left === "string" && left in context) {
    // Lazily evaluate and replace context value
    if (context[left] instanceof Function)
      context[left] = context[left]();

    left = context[left];
  }

  if (typeof right === "string" && right in context) {
    // Lazily evaluate and replace context value
    if (context[right] instanceof Function)
      context[right] = context[right]();

    right = context[right];
  }

  const op = COMPARE[predicate.operator];

  if (!op) return false;

  return op(left, right);
}

const COMPARE = {
  ":": (a,b) => a == b,
  "=": (a,b) => a == b,
  ">": (a,b) => a > b,
  "<": (a,b) => a < b,
  ">=": (a,b) => a >= b,
  "<=": (a,b) => a <= b,
  "and": (a,b) => a && b,
  "or": (a,b) => a || b,
}