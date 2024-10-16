// stream data into and from the unixfs file system
// Debashish Buragohain

import { unixfs } from "@helia/unixfs";
import { createHelia } from "helia";

// create a helia node
const helia = await createHelia();

// create a filesystem on top of helia, in this case its UnisFS
const fs = unixfs(helia);

// use TextEncoder to turn strings into Uint8Arrays
const encoder = new TextEncoder();

// add the bytes to your node and receive a unique content identifier
const cid = await fs.addBytes(encoder.encode('Hello world 101'), {
    onprogress: evt => {
        // logging the add bytes event        
        console.info('add event', evt.type, evt.detail);
    }
});

console.log('Added file:', cid.toString());


// the decoder will turn Uint8Arrays into strings
const decoder = new TextDecoder();
let text = '';

// streaming and reading the data
for await (const chunk of fs.cat(cid, {
    onprogress: evt => {
        console.info('cat event', evt.type, evt.detail);
    }
})) {
    text += decoder.decode(chunk, {
        stream: true
    })   
}

console.log('Added file contents:', text);