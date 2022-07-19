import React from "react";
import { getSelectors } from "../util/overpass";

/**
 *
 * @param {object} props
 * @param {Overpass} props.overpass
 * @param {StyleRule[]} props.rules
 * @returns
 */
export function OverpassStatus ({ overpass, rules }) {

    const requiredSelectors = Object.keys(getSelectors(rules.map(r => r.selector)));

    return (
        <div>
            <p>{overpass.bbox}</p>
            <ul style={{listStyle:"none",padding:0}}>
            {
                requiredSelectors.map(s => <li key={s}>{s} ({overpass.haveElements(s)?"Y":"N"})</li>)
            }
            </ul>
        </div>
    );
}