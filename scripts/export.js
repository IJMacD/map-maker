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

/** @type {MapContext?} */
let context = null;

if (boundsOption && zoomOption) {
    const bounds = /** @type {[number,number,number,number]} */(boundsOption.split(",").map(v => +v));
    context = makeContextFromBoundsZoom(bounds, +zoomOption);
}
else if (centreOption && zoomOption && widthOption && heightOption) {
    const centre = /** @type {[number,number]} */(centreOption.split(",").map(v => +v));
    context = makeContextFromCentreZoomWidthHeight(centre, +zoomOption, +widthOption, +heightOption);
}
else if (boundsOption && widthOption && heightOption) {
    // Possible but not implemented yet
    throw Error("NotImplemented");
}

if (!context) {
    console.error("The correct combination of -b, -z, -c, -w, and -h were not provided.");
    process.exit();
}

const outFilename = getArg("-o") ?? "output.png";

console.log(context);

const styleRules = parseStyle(style);

createMap(styleRules, context, outFilename);


/**
 * @param {{ rules: (StyleRule|MediaQuery)[]; }} styleRules
 * @param {MapContext} context
 * @param {string} outputFilename
 */
async function createMap (styleRules, context, outputFilename) {

    const filteredRules = filterRules(styleRules.rules, context);

    const imageWidth = context.width * context.scale;
    const imageHeight = context.height * context.scale;

    console.log(`Image size: ${imageWidth}x${imageHeight}`);

    const canvas = createCanvas(imageWidth, imageHeight);

    // @ts-ignore
    // node canvas is a fine stand-in for HTMLCanvasElement
    const renderer = new CanvasRender(canvas);

    await render(filteredRules, new OverpassSource(), renderer, context);

    const out = fs.createWriteStream(outputFilename);
    const pngStream = canvas.createPNGStream();
    pngStream.pipe(out);
    out.on("finish", () => console.log("Done"));
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
    -z zoom
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
 */
function makeContextFromCentreZoomWidthHeight(centre, zoom, width, height) {
    return { centre, zoom, width, height, scale };
}

/**
 * @param {[number,number,number,number]} bounds
 * @param {number} zoom
 * @returns {MapContext}
 */
 function makeContextFromBoundsZoom (bounds, zoom) {
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

