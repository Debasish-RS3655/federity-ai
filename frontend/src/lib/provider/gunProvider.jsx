// the official provider for GUN.js for production
// Debashish Buragohain

import GUN from 'gun';
import 'gun/sea';
import PropTypes from 'prop-types';
import {
    React,
    useEffect,
    useState,
    useCallback,
    createContext
} from 'react';

// create the Gun.js context
export const GunContext = createContext({
    gun: null,
    user: null,
    SEA: null,
    error: false,
    starting: true
});

export const GunProvider = ({ children }) => {
    const [gun, setGun] = useState(null);
    const [user, setUser] = useState(null);
    const [SEA, setSEA] = useState(null);
    const [error, setError] = useState(false);
    const [starting, setStarting] = useState(false);

    const startGun = useCallback(async () => {
        if (gun) {
            console.info('GUN has already started.');
        }
        // if the gun instance is already windowed
        else if (window.gun) {
            console.info('Found a windowed instance of gun, populating ...');
            setGun(window.gun);
            setUser(window.gun.user());
            setSEA(GUN.SEA);
            setStarting(false); // gun has started till this point
        }
        // start the GUN instance at this point
        else {
            try {
                console.info('Starting GUN.');
                let gunInstance = GUN();  //  initially we don't have any peer
                setGun(gunInstance);
                setUser(gunInstance.user());
                setSEA(GUN.SEA);
                setStarting(false); // gun has been initialized at this point
                // add to the window object
                window.gun = gunInstance;
            }
            catch (err) {
                console.error('Error starting GUN:', err);
                setError(true);
            }
        }
    })

    // startting Gun in the first render
    useEffect(() => {
        startGun();
        gun.on('auth', (ack) => {
            console.log('User authenticated:', user.is.pub);
        });
    }, []);
    return (
        <GunContext.Provider
            value={{
                gun,
                user,
                SEA,
                error,
                starting
            }}>
            {children}
        </GunContext.Provider>
    )
}

// defining the children property types for the GunProivder function
GunProvider.propTypes = {
    children: PropTypes.any
}