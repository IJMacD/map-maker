import React from "react";
import useDeepCompareEffect from "use-deep-compare-effect";
import CanvasRender from "../render/CanvasRender";
import { render } from "../render/render";

/**
 * @param {object} props
 * @param {StyleRule[]} props.rules
 * @param {ElementSource} props.elementSource
 * @param {Point} props.centre
 * @param {number} props.zoom
 * @param {number} props.width
 * @param {number} props.height
 * @param {number} props.scale
 * @param {import("react").CSSProperties} props.style
 * @param {(status: string?) => void} props.setStatus
 * @param {(error: string) => void} props.setError
 * @param {(progress: number) => void} props.setProgress
 * @param {(e: import("react").MouseEvent<HTMLCanvasElement>) => void} props.onDoubleClick
 */
export function MapCanvas ({ rules, elementSource, centre, zoom, scale, width, height, setStatus, setError, setProgress, onDoubleClick, style={} }) {
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
      const context = { centre, zoom, width, height, scale };

      render(rules, elementSource, renderer, context, setStatus, setError, setProgress, current);

      return () => { current.currentEffect = false; };
    }, [rules, elementSource, centre, zoom, scale, width, height]);

    return <canvas ref={canvasRef} onDoubleClick={onDoubleClick} style={style} />;
}