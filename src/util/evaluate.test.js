import { evaluateText, evaluateColour, evaluateDimension } from "./evaluate";

/** @type {OverpassElement} */
const nodeElement = { id: 99, type: "node", lon: 0, lat: 0, tags: { "name": "World" } };
/** @type {MapContext} */
const context = { centre: [0,0], zoom: 10, bbox: "-180,-90,180,90", width: 1000, height: 1000, scale: 2 };

describe("basic", () => {
    test("string", () => {
        expect(evaluateText(`"hello"`, nodeElement, context)).toBe("hello");
    });
});

describe("constant", () => {
    test("string", () => {
        expect(evaluateColour(`red`, nodeElement, context)).toBe("red");
    });

    test("hex colour", () => {
        expect(evaluateColour(`#f00`, nodeElement, context)).toBe("#f00");
    });

    test("number", () => {
        expect(evaluateDimension(`15`, nodeElement, context)).toBe("15");
    });

    test("number with units", () => {
        expect(evaluateDimension(`10px`, nodeElement, context)).toBe("10px");
    });
});

describe("tag", () => {
    test("simple", () => {
        expect(evaluateText(`tag(name)`, nodeElement, context)).toBe("World");
    });

    test("default", () => {
        expect(evaluateText(`tag(foo, "bar")`, nodeElement, context)).toBe("bar");
    });

    test("default (unused)", () => {
        expect(evaluateText(`tag(name, "bar")`, nodeElement, context)).toBe("World");
    });
});

describe("combined", () => {
    test("string + tag", () => {
        expect(evaluateText(`"hello " tag(name)`, nodeElement, context)).toBe("hello World");
    });
});

describe("debug", () => {
    test("type", () => {
        expect(evaluateText(`debug(type)`, nodeElement, context)).toBe("node");
    });

    test("location", () => {
        expect(evaluateText(`debug(location)`, nodeElement, context)).toBe("(0,0)");
    });
});