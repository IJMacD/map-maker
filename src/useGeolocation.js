import React from 'react';

export default function useGeolocation () {
    const { geolocation } = navigator;

    /** @type {[Position, (newPos: Position) => void]} */
    const [ loc, setLoc ] = React.useState();

    React.useEffect(() => { geolocation.getCurrentPosition(setLoc) }, []);

    React.useEffect(() => {
        const id = geolocation.watchPosition(setLoc);

        return () => geolocation.clearWatch(id);
    }, []);

    return loc;
}