// !!-- first doing these things using dedicated workers
// !!-- will then shift to shared workers

// calculates the hashes for every key for every chunk uploaded to gun
// Debashish Buragohain
export default () => {
    self.addEventListener('message', async e => {
        // hash all the functions and return them once only
        if (!e) { return }
        // also need the worker number for the organized indexing of the hashes from multiple workers
        const { chunks, worker } = e.data;
        const hashedArray = [];
        for (let i = 0; i < chunks.length; i++) {
            // the SEA api encodes the hash value in the base64 format so we devised a new mechanism for that
            const hashValue = async (val, encode = 'hex') => {
                let hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder('utf-8').encode(val));
                if (encode == 'hex') {
                    let hexes = [], view = new DataView(hashBuffer);
                    for (let i = 0; i < view.byteLength; i += 4)
                        hexes.push(('00000000' + view.getUint32(i).toString(16)).slice(-8));
                    return hexes.join('');
                }
                else if (encode == 'base64') {
                    // buffer to byte array            
                    let hashArray = Array.from(new Uint8Array(hashBuffer));
                    // byte array to base64 string
                    return btoa(String.fromCharCode(...hashArray));
                }
            }
            // hashedArray[i] = await SEA.work(chunks[i], null, null, { name: "SHA-256" });
            hashedArray[i] = await hashValue(chunks[i], 'base64')
        }
        postMessage({ hashedArray, worker });
    });
}