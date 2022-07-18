import React from 'react';

/**
 * @template T
 * @param {string} key 
 * @param {T} initalState 
 * @returns {[ T, (newState: T) => void ]}
 */
export default function useSavedState (key, initalState) {
    const [ state, setState ] = React.useState(() => {
        const saved = localStorage.getItem(key);
    
        if (saved) {
            try {
                initalState = JSON.parse(saved);
            } catch (e) {}
        }

        return initalState;
    });

    return [
        state,
        newState => {
            localStorage.setItem(key, JSON.stringify(newState));
            setState(newState);
        }
    ]
}