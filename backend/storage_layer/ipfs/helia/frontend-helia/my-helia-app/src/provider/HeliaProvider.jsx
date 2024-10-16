// provides the helia instance for working in the react app
// Debashish Buragohain

import { unixfs } from '@helia/unixfs';
import { createHelia } from 'helia';
import PropTypes from 'prop-types';
import React, {
    useEffect,
    useState,
    useCallback,
    createContext
} from 'react';

// context allows to share information without explicitly it down through props
// kind of defining like our own component whose inside values we can specifcy
export const HeliaContext = createContext({
    helia: null,
    fs: null,
    error: false,
    starting: true
});

// provider basically sets the properties of the helia context field above.. we use this as a wrapper in the main.jsx file
export const HeliaProvider = ({ children }) => {
    const [helia, setHelia] = useState(null);
    const [fs, setFs] = useState(null);
    const [starting, setStarting] = useState(true);
    const [error, setError] = useState(null);

    // useCallback caches a function definition so that it remains consistent between rerenders
    const startHelia = useCallback(async () => {
        if (helia) {
            console.info('Helia has already started.');
        }
        // if a helia instance is already windowed
        else if (window.helia) {
            console.info('Found a windowed instance of helia, populating ...');
            setHelia(window.helia);
            setFs(unixfs(helia));
            setStarting(false);
        }
        // start the helia instance if not started till this point
        else {
            try {
                console.info('Starting Helia.');

                // !!-- in the implementation we will be importing an advanced createHelia function
                const helia = await createHelia();
                setHelia(helia);
                setFs(unixfs(helia));
                setStarting(false);     // already started till this point
            }
            catch (err) {
                console.error('Error starting helia:', err);
                setError(true);
            }
        }
    }, []);

    // start Helia in the first render
    useEffect(() => {
        startHelia();
    }, []);

    return (
        <HeliaContext.Provider
            value={{
                helia,
                fs,
                error,
                starting
            }}
        >{children}
        </HeliaContext.Provider>
    )
}

// defining the children property types for the HeliaProvider function
HeliaProvider.propTypes = {
    children: PropTypes.any
}