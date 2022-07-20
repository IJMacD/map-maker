import React from "react";
import useDeepCompareEffect from "use-deep-compare-effect";
import CanvasRender from "../render/CanvasRender";
import { render } from "../render/render";

export function MapCanvas ({ rules, elementSource, centre, zoom, scale, width, height, setStatus, setError, setProgress, onDoubleClick }) {
    /** @type {React.MutableRefObject<HTMLCanvasElement?>} */
    const canvasRef = React.useRef(null);

    // Refetch/Render map when bbox, or style change
    useDeepCompareEffect(() => {
      const canvas = canvasRef.current;

      if (!canvas) return;

      const renderer = new CanvasRender(canvas);

      // Double pointer to update inside render function scope
      let current = { currentEffect: true };

      /** @type {MapContext} */
      const context = { centre: centre.split(",").map(p => +p), zoom, width, height, scale };

      render(rules, elementSource, renderer, context, setStatus, setError, setProgress, current);

      return () => { current.currentEffect = false; };
    }, [rules, elementSource, centre, zoom, scale, width, height]);

    return <canvas ref={canvasRef} onDoubleClick={onDoubleClick} />;
}