import { evaluateValue } from "./evaluate";

/** @type {import("./Overpass").OverpassElement} */
const nodeElement = { id: 99, type: "node", lon: 0, lat: 0, tags: { "name": "World" } };
/** @type {import("./MapRenderer").MapContext} */
const context = { centre: [0,0], zoom: 10, bbox: "-180,-90,180,90", width: 1000, height: 1000, scale: 2 };

describe("basic", () => {
    test("string", () => {
        expect(evaluateValue(`"hello"`, nodeElement, context)).toBe("hello");
    });
});

describe("constant", () => {
    test("string", () => {
        expect(evaluateValue(`red`, nodeElement, context)).toBe("red");
    });

    test("hex colour", () => {
        expect(evaluateValue(`#f00`, nodeElement, context)).toBe("#f00");
    });

    test("number", () => {
        expect(evaluateValue(`15`, nodeElement, context)).toBe("15");
    });

    test("number with units", () => {
        expect(evaluateValue(`10px`, nodeElement, context)).toBe("10px");
    });
});

describe("tag", () => {
    test("simple", () => {
        expect(evaluateValue(`tag(name)`, nodeElement, context)).toBe("World");
    });

    test("default", () => {
        expect(evaluateValue(`tag(foo, "bar")`, nodeElement, context)).toBe("bar");
    });

    test("default (unused)", () => {
        expect(evaluateValue(`tag(name, "bar")`, nodeElement, context)).toBe("World");
    });
});

describe("combined", () => {
    test("string + tag", () => {
        expect(evaluateValue(`"hello " tag(name)`, nodeElement, context)).toBe("hello World");
    });
});

describe("debug", () => {
    test("type", () => {
        expect(evaluateValue(`debug(type)`, nodeElement, context)).toBe("node");
    });

    test("location", () => {
        expect(evaluateValue(`debug(location)`, nodeElement, context)).toBe("(0,0)");
    });
});