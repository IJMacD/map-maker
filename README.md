This project is live at [Map Maker](https://ijmacd.github.io/map-maker).

## Rationale
The  [Open Street Map](https://openstreetmap.org) is an amazing resource and has almost limitless possibilities. If you want to make use of it there are countless options already available to you.

Maybe its just the cartography bug in me, but I have often thought to myself &ldquo;I want to quickly make a map of all `X` in `area`.&rdquo;

Whilst I was aware other tools exist for this purpose none immediately fit my purpose or weren't available to use instantly. They required some level of setup or othwise weren't as convenient as a web app.

## Limitations

There are many limitiations of this system compared to more sophisticated renderers such as the standard Mapnik and it's cousins.

There are no methods of transitioning from one element to another. Nicer renderes have smooth transitions from one highway type to another for example.

Text on a path - not yet.

Each new style rule effectively creates a new layer. There are no other ways to "stack" or alter the relative z position of drawn elements.

Enclosed areas. You can't use one feature to specify the bounds of another yet. Either by clipping or specifiying search area.

Coastlines are special. They need special treatment and I haven't done it yet. Don't expect oceans to be blue.

3D&mldr; you what?

## Alternatives

* [Mapnik](https://mapnik.org/) is the standard used to generate many of the OSM maps you've probably seen before. Its stylesheets are are specified as XML documents.
*  If you're into 3D maps you should check out [OSM go](https://www.osmgo.org/).
* [maperitive](https://maperitive.net/) Native app to generate maps from a simple script
* Old fashioned [osmarender](https://wiki.openstreetmap.org/wiki/Osmarender). For fans of acronyms, transforms OSM XML to SVG using XSLT.

## Future Plans

Possibly an SVG renderer woudn't be too hard to implement.

# Reference Documentation

## Principal of Operation and Relation to CSS

The contents and style of a generated map are specified in a bespoke sytle script reminiscent of CSS.

It's important to note however, that is direct oppostion to the notorious Cascading Style Sheets this script is not cascading.

Every rule essentially specifies a new drawing instruction. It's not possible to setup some shared property near the beginning of the script and expect it to still be in effect for a matching element later. Each rule is isolated with its own state which is reset between rules.

### Example

```css
way[natural=coastline] {
    stroke: black;
}
node[amenity=telephone] {
    size: 2;
    fill: blue;
}
node[amenity=post_box] {
    size: 2;
    fill: red;
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/telephone-post_box.png" height="300" width="400" />
<figcaption>The ratio between telephones and post boxes in south east England.</figcaption>
</figure>

### Units

Units can often be specified much like in CSS. Choice of units include `px`, `deg`, `rad`. The defaults vary in different situations. Take note below where relevant.

## Selectors

Selectors work similarly to how they do in CSS. They start with a type (detailed below); are optionally filtered with tags and pseudo classes; then additionally converted to pseudo elements if required.

```
type[tag=value]:pseudoClass(params)::pseudoElement
```

There are no such things as regular classes (`.class`) in this language.

Currently it's not possible to omit the type but that should be possible in the future.

### Element Types

#### `node`

Used to fetch and render OSM nodes. It will only render Point type features.

```css
node {
    size: 1;
    fill: black;
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/nodes.png" height="300" width="400" />
<figcaption>Every single node in a given area.</figcaption>
</figure>

#### `way`

Used to fetch and render OSM ways. It will render Line features first. Point features are rendered at the mid-point along the line.

```css
way {
    stroke: black;
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/ways.png" height="300" width="400" />
<figcaption>Every single way in a given area.</figcaption>
</figure>

#### `area`

Areas don't really exist in the OSM world. Instead they are implemented as ways which are optionally self-closing.

However they are treated specially in Map Maker. Even if the way isn't specifically self-closing they will be forced to be when rendering.

Areas are rendered as Area features and and Point features are rendered at the centre of the bounding box. Note this is different from plain ways.

```css
area:is(self-closing) {
    stroke: black;
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/areas.png" height="300" width="400" />
<figcaption>Every explicit self-closed way in a given area.</figcaption>
</figure>

#### `relation`

Relations are often used to render areas with holes.

*Note: relation rendering is currently not perfect. It works best for simple relations with an outer way going anti-clockwise and and inner way going clockwise. Unfortunately not all relations in the database were created this way so a smarter rendering algorithm is needed in the future.*

```css
rel[natural=water] {
    fill: lightblue;
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/relations.png" height="300" width="400" />
<figcaption>Relation demonstrating area with holes.</figcaption>
</figure>

#### `map`

*This is sort of a pseudo-type. This is not an OSM feature and only exists on map Maker.*

`map` refers to the whole canvas and can be used to add background fills for example. It renders as an Area so can also render Point features in the centre of the map.

```css
map {
    fill: bisque;
    stroke: lightseagreen;
    stroke-width: 20;
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/bisque.png" height="300" width="400" />
<figcaption>Example setting the canvas fill and border.</figcaption>
</figure>

#### `current`
*This is sort of a pseudo-type. This is not an OSM feature and only exists on map Maker.*

Provided the user permits, this will render a Point feature at the geolocation provided by the user's browser.

```css
way {
    stroke: black;
}
current {
    content: "📍";
    font-size: 30px;
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/current.png" height="300" width="400" />
<figcaption>Showing the user's current location.</figcaption>
</figure>

#### `dummy`
*This is sort of a pseudo-type. This is not an OSM feature and only exists on map Maker.*

Add arbitrary Point features to the map canvas.

```css
dummy {
    icon: url(https://ijmacd.github.io/map-maker/logo192.png);
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/dummy.png" height="300" width="400" />
<figcaption>Place arbitrary features on the canvas.</figcaption>
</figure>

### Tags

### Pseudo Classes

### Pseudo Elements

### Match Queries

Analogous to media queries in CSS but use the keyword `@match` instead.

## Declarations

### Point

### Line

### Area
