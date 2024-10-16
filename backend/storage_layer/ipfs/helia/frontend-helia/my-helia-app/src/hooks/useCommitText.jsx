// creates a custom hook that uses the createHelia hook that we previously created
// to enable direct interaction with Helia from the frontend
// Debashish Buragohain

import { useState, useCallback } from 'react';
// import { useHelia } from '@/hooks/useHelia';
import { useHelia } from './useHelia.jsx';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// custom hook definition
// returns the cid string, the committed text, the commitText and fetchCommittedText function
export const useCommitText = () => {
    // using the helia hook return values
    const { helia, fs, error, starting } = useHelia();

    const [cid, setCid] = useState(null);
    const [cidString, setCidString] = useState('');
    const [committedText, setCommittedText] = useState('');

    // defining a memorized version of commitText function so that it does not need to be defined in every render
    // saving a text entered into helia
    // simply like: const commitText = async (text) => {}
    const commitText = useCallback(async text => {
        // if helia has started successfully
        if (!error && !starting) {
            try {
                const cid = await fs.addBytes(
                    encoder.encode(text),
                    helia.blockstore
                );
                setCid(cid);
                setCidString(cid.toString());
                console.log('Added file: ', cid.toString());
            }
            catch (err) {
                console.error('Error adding file:', err);
            }
        }
        else {
            console.log('Please wait for Helia to start.');
        }
    }, [error, starting, helia, fs]);


    // fetch committed text
    const fetchCommittedText = useCallback(async () => {
        let text = '';
        if (!error && !starting) {
            try {
                // iterate over chunks of data retrieved from fs.cat(cid);
                for await (const chunk of fs.cat(cid)) {
                    // decoding each chunk and concatenating to form the text
                    text += decoder.decode(chunk, {
                        stream: true
                    })
                }
                // finally set the text now
                setCommittedText(text);
            }
            catch (err) {
                console.error('Error while fetching:', err);
            }
        }
        else {
            console.log('Please wait for Helia to start.');
        }
    }, [error, starting, cid, helia, fs]);

    return { cidString, committedText, commitText, fetchCommittedText };
}