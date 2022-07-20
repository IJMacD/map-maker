import React, { useRef, useState } from "react";
import useDeepCompareEffect from "use-deep-compare-effect";
import { ruleToString } from "../Classes/Style";
import { makeBBox } from "../util/bbox";
import { MapCanvas } from "./MapCanvas";

/**
 * @param {object} props
 * @param {StyleRule[]} props.rules
 * @param {ElementSource} props.elementSource
 * @param {Point} props.centre
 * @param {number} props.zoom
 * @param {number} props.width
 * @param {number} props.height
 * @param {number} props.scale
 * @param {(status: string?) => void} props.setStatus
 * @param {(error: string) => void} props.setError
 * @param {(progress: number) => void} props.setProgress
 * @param {(e: import("react").MouseEvent<HTMLCanvasElement>) => void} props.onDoubleClick
 */
export function MapMultiCanvas ({ rules, elementSource, centre, zoom, scale, width, height, setStatus, setError, setProgress, onDoubleClick }) {
    const handleStatus = () => void 0;
    const handleError = () => void 0;
    const handleProgress = () => void 0;

    const fetchInProgress = useRef(false);

    // Child MapCanvases only see new centre/zoom after elements have been loaded in batch
    const [ loadedCentre, setLoadedCentre ] = useState(centre);
    const [ loadedZoom, setLoadedZoom ] = useState(zoom);

    const selectors = rules.map(r => r.selector);

    useDeepCompareEffect(() => {
        if (!fetchInProgress.current) {
            fetchInProgress.current = true;

            const bbox = makeBBox(centre, zoom, [width, height]);

            // Preload elements in batch
            elementSource.fetch(selectors, bbox).then(() => {
                setLoadedCentre(centre);
                setLoadedZoom(zoom);
                fetchInProgress.current = false;
            });
        }
    }, [selectors, centre, zoom, width, height]);

    return (
        <div style={{position:"relative"}}>
            {
                rules.map(rule => <MapCanvas key={ruleToString(rule)} style={{position: "absolute", top:0, left:0}} rules={[rule]} elementSource={elementSource} centre={loadedCentre} zoom={loadedZoom} scale={scale} width={width} height={height} setStatus={handleStatus} setError={handleError} setProgress={handleProgress} onDoubleClick={onDoubleClick} />)
            }
        </div>
    );
}