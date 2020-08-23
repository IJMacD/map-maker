import React from 'react';

export default function useSavedState (key, initalState) {
    const saved = localStorage.getItem(key);

    if (saved) {
        try {
            initalState = JSON.parse(saved);
        } catch (e) {}
    }

    const [ state, setState ] = React.useState(initalState);

    return [
        state,
        newState => {
            localStorage.setItem(key, JSON.stringify(newState));
            setState(newState);
        }
    ]
}