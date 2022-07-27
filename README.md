This project is live at [Map Maker](https://ijmacd.github.io/map-maker).

## Rationale
The  [Open Street Map](https://openstreetmap.org) is an amazing resource and has almost limitless possibilities. If you want to make use of it there are countless options already available to you.

Maybe its just the cartography bug in me, but I have often thought to myself &ldquo;I want to quickly make a map of all `X` in `area`.&rdquo;

Whilst I was aware other tools exist for this purpose none immediately fit my purpose or weren't available to use instantly. They required some level of setup or otherwise weren't as convenient as a web app.

## Limitations

There are many limitations of this system compared to more sophisticated renderers such as the standard Mapnik and it's cousins.

There are no methods of transitioning from one element to another. Nicer renderers have smooth transitions from one highway type to another for example.

Text on a path - not yet.

Each new style rule effectively creates a new layer. There are no other ways to "stack" or alter the relative z position of drawn elements.

Enclosed areas. You can't use one feature to specify the bounds of another yet. Either by clipping or specifying search area.

Coastlines are special. They need special treatment and I haven't done it yet. Don't expect oceans to be blue.

3D&mldr; you what?

## Alternatives

* [Mapnik](https://mapnik.org/) is the standard used to generate many of the OSM maps you've probably seen before. Its stylesheets are are specified as XML documents.
*  If you're into 3D maps you should check out [OSM go](https://www.osmgo.org/).
* [maperitive](https://maperitive.net/) Native app to generate maps from a simple script
* Old fashioned [osmarender](https://wiki.openstreetmap.org/wiki/Osmarender). For fans of acronyms, transforms OSM XML to SVG using XSLT.

## Future Plans

Possibly an SVG renderer wouldn't be too hard to implement.

# Reference Documentation

## Principal of Operation and Relation to CSS

The contents and style of a generated map are specified in a bespoke style script reminiscent of CSS.

It's important to note however, that in direct opposition to the notorious Cascading Style Sheets this script is not cascading.

Every rule specifies zero or more new drawing instructions. It's not possible to set up some shared property near the beginning of the script and expect it to still be in effect for a matching element later. Each rule is isolated with its own state which is reset between rules. (Except wildcard types - see below)

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

IDs (`#id`) are not currently implemented but should definitely be possible even if they would presumably have limited usefulness.

*Note: Currently it's not possible to omit the type but that should be possible in the future.*

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

Used to fetch and render OSM ways. It will render Line features. Then any Point features are rendered at the mid-point along the line.

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

Areas don't really exist in the OSM world. Instead they are implemented as self-closing ways.

However they are treated specially in Map Maker. Even if the underlying OSM way isn't explicitly self-closing it will be forced closed when rendering on Map Maker with the `area` type.

Areas are rendered as Area features and Point features are rendered at the centre of the bounding box. Note this is different from how non-area ways are rendered.

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

*Note: relation rendering is currently not perfect. It works best for simple relations with an outer way going anti-clockwise and an inner way going clockwise. Unfortunately not all relations in the database were created this way so a smarter rendering algorithm is needed in the future.*

```css
rel[natural=water] {
    fill: lightblue;
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/relations.png" height="300" width="400" />
<figcaption>Relation example demonstrating area with holes.</figcaption>
</figure>

#### `map`

`map` refers to the whole canvas and can be used to add background fills for example. It renders as an Area so can also render Point features in the centre of the map.

*This is sort of a pseudo-type. This is not an OSM feature and only exists on Map Maker.*

```css
map {
    fill: bisque;
    stroke: lightseagreen;
    stroke-width: 20px;
}
```

*Note: The centre of the stroke runs along the exact edge of the map so only half is visible and the other half is off canvas. Therefore to get a 10px border you need a stroke width of 20px.*

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/bisque.png" height="300" width="400" />
<figcaption>Example setting the canvas fill and border.</figcaption>
</figure>


#### `gridlines`

`gridlines` doesn't actually render anything by itself. Pseudo Classes are required to specify which grid lines to draw.
There is a dummy tag added with a key of `name` and a value of the particular longitude or latitude being rendered.

*This is sort of a pseudo-type. This is not an OSM feature and only exists on Map Maker.*

```css
gridlines:vertical(0.01deg),
gridlines:horizontal(0.01deg) {
    stroke: rgba(128,64,0,0.2);
    content: tag(name);
    text-color: rgba(128,64,0,0.2);
}
gridlines:vertical(0.1deg),
gridlines:horizontal(0.1deg) {
    stroke: rgba(128,64,0,0.2);
    stroke-width: 1.25;
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/gridlines.png" height="300" width="400" />
<figcaption>Grid lines can be drawn.</figcaption>
</figure>

#### `current`
Provided the user permits, this will render a Point feature at the geolocation provided by the user's browser.

*This is sort of a pseudo-type. This is not an OSM feature and only exists on Map Maker.*

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
Add arbitrary Point features to the map canvas.

*This is sort of a pseudo-type. This is not an OSM feature and only exists on Map Maker.*

```css
map {
    stroke: black;
    stroke-width: 2px;
}
dummy {
    icon: url(https://ijmacd.github.io/map-maker/logo192.png);
    transform: translate(290px, 10px);
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/dummy.png" height="300" width="400" />
<figcaption>Place arbitrary features on the canvas.</figcaption>
</figure>

#### Wildcard `*`

*Important: This does **not** render a new layer on the map. Instead it can be used to apply additional rules to other selectors.*

```css
way[highway=primary] {
    stroke: green;
    stroke-width: 2;
}
*[tunnel=yes] {
    opacity: 0.5;
}
```

### Tags

None of the nodes, ways and relations in OSM intrinsically have any meaning. They are given meaning with many different tags by the numerous contributors to OSM. You can check which tags are available at the [OpenStreetMap Wiki](https://wiki.openstreetmap.org/wiki/Map_Features).

Tags are the primary way to select which data to display on your map.

#### Individual Tags
Tags are specified in square brackets after the element type. They are all key-value pairs separated by an equals character.

```css
area[building=yes] {
    stroke: 1px maroon;
    fill: pink;
}
way[highway=residential] {
    stroke: 3px lightgrey;
}
way[highway=secondary] {
    stroke: 4px orange;
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/residential.png" height="300" width="400" />
<figcaption>Tags specify which features to render.</figcaption>
</figure>


#### Combining Tags
Tags can be combined to increase specificity
```css
way[railway=rail][frequency=0] {
    stroke: 0.1px red;
}
way[railway=rail][frequency=50] {
    stroke: 0.1px blue;
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/railway-frequency.png" height="300" width="400" />
<figcaption>AC vs. DC electrification in southern England.</figcaption>
</figure>

#### Tag Inequalities

```css
way[railway=rail][frequency=0] {
    stroke: 0.1px red;
}
way[railway=rail][frequency>0] {
    stroke: 0.1px blue;
}
```

#### Wildcard Tags

Wildcards are supported. The following examples are equivelant.

```css
way[highway] {
    stroke: 0.1px black;
}
way[highway=*] {
    stroke: 0.1px black;
}
```

### Pseudo Classes
Pseudo classes can further increase specificity using derived data.

#### `:is()`

This pseudo class tests whether or not the area* matches the given parameter.

**All currently implemented parameters only apply to areas.*

Implemented parameters:

* `convex` - Geometrically convex. i.e. a polygon with all interior angles less than 180°
* `concave` - Geometrically not convex i.e. at least one interior angle is more than 180°.
* `anti-clockwise` - Areas can be defined with points travelling clockwise or anti-clockwise. To calculate the area of a polygon we can use cross products of neighbouring edges. Anti-clockwise definition gives a positive area.
* `clockwise` - Clockwise gives a negative area - effectively looking at the "back" of the shape.
* `self-closing` - Tests whether or not the last node is exactly the same node as the first one.

```css
area[building=yes]:is(clockwise) {
    fill: lightblue;
}
area[building=yes]:is(anti-clockwise) {
    fill: pink;
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/clockwise.png" height="300" width="400" />
<figcaption>Some buildings are drawn "backwards".</figcaption>
</figure>

#### `:has()`

Tests some property of the way or area.

Implemented properties*:

* `area` - Area enclosed by shape. Calculated by the cross-product method but taking the absolute value to ensure positive area.
* `length` - Overall length of way or perimeter of area
* `width` - horizontal width of the bounding box of this shape
* `height` - horizontal width of the bounding box of this shape

**Currently only has units of pixels or square pixels so is only somewhat useful. Hopefully this will change in the future*

```css
area[building=yes]:has(area < 1500) {
    fill: lightblue;
}
area[building=yes]:has(1500 <= area < 3000) {
    fill: lightgreen;
}
area[building=yes]:has(area >= 3000) {
    fill: pink;
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/area.png" height="300" width="400" />
<figcaption>Discriminate based on shape area.</figcaption>
</figure>

### Pseudo Elements

#### `::centre` **Point**
Renders a Point feature at the centre of the bounding box of a Line or Area. These are the same co-ordinates used when drawing a Point feature on an Area.

*`::center` is provided as an alternative spelling.*

```css
area[building=yes] {
    stroke: pink;
}
area[building=yes]::centre {
    size: 2;
    fill: black;
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/centre.png" height="300" width="400" />
<figcaption>Dot drawn at centre of bounding box.</figcaption>
</figure>

#### `::mid-point` **Point**
Renders a Point feature at the N/2<sup>th</sup> point along a line. The point will always be on the line including areas.

```css
area[building=yes] {
    stroke: pink;
}
area[building=yes]::mid-point {
    size: 2;
    fill: red;
}
way[highway=secondary],
way[highway=residential] {
    stroke: lightblue;
}
way[highway=secondary]::mid-point,
way[highway=residential]::mid-point {
    size: 2;
    fill: blue;
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/mid-point.png" height="300" width="400" />
<figcaption>Showing the mid-points of lines and areas.</figcaption>
</figure>

#### `::average-point` **Point**
Take the average of all the points in the way or area.

```css
area[building=yes] {
    stroke: pink;
}
area[building=yes]::centre {
    size: 2;
    fill: black;
}
area[building=yes]::average-point {
    size: 2;
    fill: blue;
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/average-point.png" height="300" width="400" />
<figcaption>Comparing the average-point and bounding-box centre.</figcaption>
</figure>

#### `::start` **Point**
Returns the first point in a line

```css
way[highway=secondary],
way[highway=tertiary] {
    stroke: black;
}
way[highway=secondary]::start,
way[highway=tertiary]::start {
    size: 4;
    fill: green;
}
way[highway=secondary]::end,
way[highway=tertiary]::end {
    size: 2;
    fill: orange;
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/start-stop.png" height="300" width="400" />
<figcaption>Showing the beginning and end of lines.</figcaption>
</figure>

#### `::end` **Point**
Returns the last point in a line

```css
way[highway=secondary],
way[highway=tertiary] {
    stroke: black;
}
way[highway=secondary]::start,
way[highway=tertiary]::start {
    icon: url(/map-maker/start.svg) 16px 16px;
    transform: translate(-16px, -8px);
}
way[highway=secondary]::end,
way[highway=tertiary]::end {
    icon: url(/map-maker/end.svg) 16px 16px;
    transform: translate(0px, -8px);
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/start-stop-icon.png" height="300" width="400" />
<figcaption>Alternative Example.</figcaption>
</figure>

#### `::bounding-box` **Area**
Returns are area which completely encloses the target way or area.

```css
area[building=yes]::bounding-box {
    fill: lightblue;
    stroke: blue;
}
area[building=yes] {
    fill: pink;
    stroke: maroon;
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/bounding-box.png" height="300" width="400" />
<figcaption>Axis aligned boxes containing buildings.</figcaption>
</figure>

#### `::content-box` **Area**
A special area enclosing a text set with the `content` declaration.

```css
area[landuse=residential] {
    fill: lightgrey;
}
node[place=town]::content-box {
    fill: black;
    stroke: 2px purple;
    text-color: white;
    padding: 4px;
    content: tag(name);
}
```

<figure>
<img src="https://raw.githubusercontent.com/IJMacD/map-maker/master/docs/img/content-box.png" height="300" width="400" />
<figcaption>Some towns in north east England.</figcaption>
</figure>

### Match Queries

Analogous to media queries in CSS but use the keyword `@match` instead.

```css
@match (zoom >= 16) {
    area[building] {
        fill: pink;
    }
}
```

## Declarations / Properties

These define what is rendered and in some cases *how* it is rendered.

### Common

* `position` - Possible values are `relative` and `absolute`
* `left` - Pixels to move horizontally
* `top` - Pixels to move vertically
* `transform` - A more capable alternative to above. `translate(10, 10) scale(2.5) skew(10) skew(10, 10) rotate(10 deg) rotate(0.25 turn) matrix(1, 0, 0, 0, 1, 0)`
* `opacity` - Opacity of rendered feature

### Point

* `content` - Text content rendered at a point. Can be literal text (e.g. `"Hello 😀"`) or values from tags (e.g. `tag(ref)`) or a combination which get concatenated (e.g. `"hello, " tag(name)`).
* `font` - Shorthand for following font properties.
* `font-family`
* `font-size`
* `font-weight`
* `text-align` - Where text is anchored relative to point
* `text-color` - Text colour if not specified it defaults to `fill` colour.
* `text-stroke` - Alternative spelling to above
* `icon` - Render an image at the point with an optional size. `url(https://ijmacd.github.io/map-maker/logo192.png) 96px`
* `path` - Render a path at point using SVG path syntax. `M 0 -20 L 0 20 M -20 0 L 20 0`
* `stroke` - *For use with path.*
* `stroke-dash` - *For use with path.*
* `stroke-width` - *For use with path.*
* `shape` - Simple shapes can be drawn. `circle`, `square`, `triangle`
* `size` - Size when drawing shape. (e.g. `2`)

### Line

* `stroke` - Sets colour for line drawing.
* `stroke-width` - Sets width of stroke. (e.g. `3`)
* `stroke-dash` - Sets a dash array. (e.g. `4 4`)

### Area

* `fill` - Colour to fill area. (e.g. `red`, `#FF0000`, `rgba(255, 0, 0, 0.5)`)
* `collision-set` - The name for a collision set to add this area to. (e.g. `labels`) If a later element is to be rendered in the same collision set with a colliding bounding box then the specified policy will be applied.
* `collision-policy`- Only value recognised at the moment is default policy: `hide`
* `collision-size` - Collision box size can be specified. Percentage is relative to bounding box (e.g. `150%`)
* `corner-radius` - For the special case of rectangles a corner radius can be specified. (e.g. `5`)
* `padding` - Padding can be added to rectangles to enlarge them. (e.g. `2`)