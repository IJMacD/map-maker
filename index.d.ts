
type MapRenderer = import("./src/render/MapRenderer").default;

type StyleSelector = import("./src/Classes/Style").StyleSelector;

type StyleRule = {
    type: "rule";
    selector: StyleSelector;
    declarations: { [key: string]: string };
}

type MediaQuery = {
    type: "query";
    predicate: Predicate;
    rules: StyleRule[];
}

type Predicate = {
    left: string|number|Predicate;
    operator: string;
    right: string|number|Predicate;
}

type MapContext = {
    centre: [number, number];
    zoom: number;
    bbox: string;
    current?: { longitude: number, latitude: number };
    width: number;
    height: number;
    scale: number;
}

type OverpassElement = OverpassNodeElement|OverpassWayElement|OverpassAreaElement|OverpassRelElement;

type OverpassNodeElement = {
    id: number;
    type: "node";
    lon: number;
    lat: number;
    tags: { [key: string]: string };
}

type OverpassWayElement = {
    id: number;
    type: "way";
    nodes: number[];
    tags: { [key: string]: string };
}

type OverpassAreaElement = {
    id: number;
    type: "area";
    nodes: number[];
    tags: { [key: string]: string };
}

type OverpassRelElement = {
    id: number;
    type: "relation";
    members: { ref: number, role: "inner"|"outer", type: "node"|"way"|"relation" }[];
    tags: { [key: string]: string };
}
