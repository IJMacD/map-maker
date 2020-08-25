import { matchRule } from "./Style";

/**
 * @param {string} bbox
 * @param {{ elements: import("./Overpass").OverpassElement[]; }} result
 * @param {React.MutableRefObject<HTMLCanvasElement>} canvasRef
 * @param {{ rules: import("./Style").StyleRule[]; }} style
 */
export function renderMap(bbox, result, canvasRef, style, database) {
    const [minLon, minLat, maxLon, maxLat] = bbox.split(",").map(parseFloat);
    if (result && canvasRef.current && !isNaN(minLon) && !isNaN(minLat) && !isNaN(maxLon) && !isNaN(maxLat)) {
      const ctx = canvasRef.current.getContext("2d");
      const { clientWidth, clientHeight } = canvasRef.current;
  
      const width = clientWidth * devicePixelRatio;
      const height = clientHeight * devicePixelRatio;
  
      canvasRef.current.width = width;
      canvasRef.current.height = height;
  
      const xScale = width / (maxLon - minLon);
      const yScale = height / (maxLat - minLat);
      /** @type {(lon: number, lat: number) => [number, number]} */
      const pos = ((lon, lat) => [(lon - minLon) * xScale, height - (lat - minLat) * yScale]);
  
      for (const el of result.elements) {
        const rule = matchRule(style, el);
        
        if (rule) {
          if (el.type === "node") {
            ctx.fillStyle = rule.declarations["fill"];
            ctx.strokeStyle = rule.declarations["stroke"];
            ctx.lineWidth = +rule.declarations["stroke-width"];
              const r = +rule.declarations["size"];
              
              ctx.beginPath();
              ctx.ellipse(...pos(el.lon, el.lat), r, r, 0, 0, Math.PI * 2);
              rule.declarations["fill"] && ctx.fill();
              rule.declarations["stroke"] && ctx.stroke();
            }
            else if (el.type === "way") {
              database.getNodes(el.nodes).then(nodes => {
                ctx.strokeStyle = rule.declarations["stroke"];
                ctx.lineWidth = +rule.declarations["stroke-width"];
                ctx.beginPath();
                ctx.moveTo(...pos(nodes[0].lon, nodes[0].lat));
                for (let i = 1; i < nodes.length; i++) {
                  ctx.lineTo(...pos(nodes[i].lon, nodes[i].lat));
                }
                ctx.stroke();
              });
            }
          }
      }
  
    }
}