// !!-- first doing these things using dedicated workers
// !!-- will then shift to shared workers

// chunking worker to chunk a single base64 image into a large number of chunks
// the chunk worker is also going to calculate the hash of each of the chunks
// Debashish Buragohain

// for this browser based code we are using the web crypto api
// for the app code we will be using the native crypto module in node js

export default () => {
    self.addEventListener('message', async e => {
        if (!e) return;
        const { image: inputString, noNodes: noDiv } = e.data;
        const strLength = inputString.length;
        const substrLength = Math.ceil(strLength / noDiv);
        const substrings = [];
        // this is a realtively long function that would otherwise hang the UI
        for (let i = 0; i < noDiv; i++) {
            const start = i * substrLength;
            const end = start + substrLength;
            const substring = inputString.substring(start, end);

            // !! in the latest version we do not hash the data immediately
            // time to hash this substring now
            // !!-- will be different for the react native part here
            // text to array buffer first
            // const textBuffer = new TextEncoder().encode(substring);
            // const textDigest = await crypto.subtle.digest('SHA-256', textBuffer);
            // const hashArray = Array.from(new Uint8Array(textDigest));
            // const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');            
            // // finally push to send it back
            // substrings.push({
            //     data: substring,
            //     hash: hashHex
            // });

            substrings.push(substring);
        }
        // finally send the divided chunks back to the frontend
        if (inputString.length == substrings.join("").length) postMessage(substrings);
        else console.error("Input and chunked images not of the same length");
    })
}