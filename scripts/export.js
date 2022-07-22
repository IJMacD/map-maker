require("@babel/register")({
    presets: [
      "@babel/preset-env",
      ["@babel/preset-react", {"runtime": "automatic"}]
    ],
});
require("fetch-everywhere");
const fs = require('fs');
const { parseStyle, filterRules } = require("../src/Classes/Style");
const { OverpassSource } = require("../src/ElementSources/OverpassSource");
const { MemorySource } = require("../src/ElementSources/MemorySource");
const { default: CanvasRender } = require("../src/render/CanvasRender");
const { makeBBoxFromContext } = require("../src/util/bbox");
const { mercatorProjection } = require('../src/util/util');
const { createCanvas } = require("canvas");

if (process.argv.length < 3) {
    printUsage();
    process.exit();
}

// ElementSource is too noisy
console.debug = () => void 0;


run();

async function run() {
    const styleFilename = getArg("-s");
    // @ts-ignore
    // Arg is required so result cannot be null
    const style = fs.readFileSync(styleFilename, { encoding: "utf8" });

    if (!style) {
        console.error(`Unable to load style from ${styleFilename}`);
        process.exit();
    }

    const boundsOption = getArg("-b");
    const zoomOption = getArg("-z");
    const centreOption = getArg("-c");
    const widthOption = getArg("-w");
    const heightOption = getArg("-h");

    const scale = +(getArg("-x") ?? 1);

    /** @type {MapContext[]} */
    const contexts = [];

    if (zoomOption) {
        /** @type {number[]} */
        const zooms = zoomOption.includes("-") ?
            range.apply(null, zoomOption.split("-").map(v => +v)) :
            [+zoomOption];

        if (boundsOption) {
            const bounds = /** @type {[number,number,number,number]} */(boundsOption.split(",").map(v => +v));

            for (const zoom of zooms) {
                contexts.push(makeContextFromBoundsZoom(bounds, zoom, scale));
            }
        }
        else if (centreOption && widthOption && heightOption) {
            const centre = /** @type {[number,number]} */(centreOption.split(",").map(v => +v));

            for (let i = 0; i < zooms.length; i++) {
                const zoom = zooms[i];
                contexts.push(makeContextFromCentreZoomWidthHeight(centre, zoom, +widthOption * (2 ** i), +heightOption * (2 ** i), scale));
            }
        }
    }
    else if (boundsOption && widthOption && heightOption) {
        // Possible but not implemented yet
        throw Error("NotImplemented");
    }

    if (contexts.length === 0) {
        console.error("The correct combination of -b, -z, -c, -w, and -h were not provided.");
        process.exit();
    }

    /** @type {ElementSource} */
    let elementSource = new OverpassSource();
    if (contexts.length > 0) {
        elementSource = new MemorySource(elementSource);
    }

    const styleRules = parseStyle(style);

    const outFilename = getArg("-o") ?? "output.png";

    for (const context of contexts) {

        let outname = contexts.length > 1 ?
            outFilename.replace(/\.[^.]+$/, s => `-${context.zoom}${s}`) :
            outFilename;

        console.log(context);

        await createMap(styleRules, context, elementSource, outname);
    }
}

/**
 * @param {{ rules: (StyleRule|MediaQuery)[]; }} styleRules
 * @param {MapContext} context
 * @param {ElementSource} elementSource
 * @param {string} outputFilename
 */
async function createMap (styleRules, context, elementSource, outputFilename) {

    const filteredRules = filterRules(styleRules.rules, context);

    const imageWidth = context.width * context.scale;
    const imageHeight = context.height * context.scale;

    console.log(`Image size: ${imageWidth}x${imageHeight}`);

    const canvas = createCanvas(imageWidth, imageHeight);

    // @ts-ignore
    // node canvas is a fine stand-in for HTMLCanvasElement
    const renderer = new CanvasRender(canvas);

    await render(filteredRules, elementSource, renderer, context);

    const out = fs.createWriteStream(outputFilename);
    const pngStream = canvas.createPNGStream();
    pngStream.pipe(out);
}

/**
 * @param {StyleRule[]} rules
 * @param {ElementSource} elementSource
 * @param {MapRenderer} renderer
 * @param {MapContext} context
 */
async function render (rules, elementSource, renderer, context) {
    console.log(`${rules.length} rules to render`);
    const bbox = makeBBoxFromContext(context);

    console.log("Fetching data");
    const results = await elementSource.fetch(rules.map(r => r.selector), bbox);
    console.log("Data fetched");


    let index = 0;
    for (const rule of rules) {
      const { elements } = results[index];

      renderer.renderRule(context, rule, elements);

      index++;
    }
}

/**
 *
 * @param {NodeJS.WriteStream} stream
 */
function printUsage (stream = process.stdout) {
    stream.write(`Usage:

    node export.js -s style.txt -b 7.095,50.695,7.105,50.705 -z 10

Options:
    -s filename for style text
    -b bounds as minLon,minLat,maxLon,maxLat
    -z zoom, if zoom is a range (e.g. 12-16) then multiple images will be produced
    -c centre as lon,lat
    -w image width
    -h image height
    -x image scale`);
}

function getArg (flag) {
    const flagIndex = process.argv.indexOf(flag);

    if (flagIndex < 0 || flagIndex > process.argv.length - 2) {
        return null;
    }

    return process.argv[flagIndex + 1];
}

/**
 * @param {[number,number]} centre
 * @param {number} zoom
 * @param {number} width
 * @param {number} height
 * @returns {MapContext}
 * @param {number} scale
 */
function makeContextFromCentreZoomWidthHeight(centre, zoom, width, height, scale) {
    return { centre, zoom, width, height, scale };
}

/**
 * @param {[number,number,number,number]} bounds
 * @param {number} zoom
 * @returns {MapContext}
 * @param {number} scale
 */
 function makeContextFromBoundsZoom (bounds, zoom, scale) {
    /** @type {[number,number]} */
    const centre = [(bounds[0] + bounds[2])/2, (bounds[1] + bounds[3])/2];

    const projection = mercatorProjection(centre, zoom, 0, 0);

    const bl = projection(bounds[0], bounds[1]);
    const tr = projection(bounds[2], bounds[3]);

    const width = Math.ceil(tr[0] - bl[0]);
    const height = Math.ceil(bl[1] - tr[1]);

    return {
        centre,
        zoom,
        width,
        height,
        scale,
    }
}

/**
 * @param {number} start
 * @param {number} end
 */
function range (start, end) {
    const length = end - start + 1;
    return Array.from({length}).map((_, i) => start + i);
}