import React from 'react';

export default function useGeolocation () {
    /** @type {[Position, (newPos: Position) => void]} */
    const [ loc, setLoc ] = React.useState();

    React.useEffect(() => { navigator.geolocation.getCurrentPosition(setLoc) }, []);

    React.useEffect(() => {
        const id = navigator.geolocation.watchPosition(setLoc);

        return () => navigator.geolocation.clearWatch(id);
    }, []);

    return loc;
}