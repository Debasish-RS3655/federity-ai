// networking utilizing unixfs
// Debashish Buragohain

import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { unixfs } from '@helia/unixfs';
import { identify } from '@libp2p/identify';
import { tcp } from '@libp2p/tcp';
import { MemoryBlockstore } from 'blockstore-core';
import { MemoryDatastore } from 'datastore-core';
import { createHelia } from 'helia';
import { createLibp2p, } from 'libp2p';
// import { bootstrap } from '@libp2p/bootstrap';
// autoconnect on the local network
import { mdns } from '@libp2p/mdns';
// UNCOMMENT THESE TO USE MANUALLY GENERATED PEER IDS
// import { peerIdFromKeys } from '@libp2p/peer-id';
// import { createFromPrivKey } from '@libp2p/peer-id-factory';
// import { generateKeyPair } from '@libp2p/crypto/keys';

async function createNode() {
    // the blockstore is where we store the blocks that make up files
    const blockstore = new MemoryBlockstore();
    // application specific data lives in the datastore
    const datastore = new MemoryDatastore();
    // !! UNCOMMENT TO MANUALLY GENERATE THE PEER ID AND PRIVATE KEY
    // const privateKey = await generateKeyPair('RSA');
    // const publicKey = privateKey.public;
    // const peerId = await createFromPrivKey(privateKey);
    return createHelia({
        datastore,
        blockstore,
        // peerId,
        libp2p: await createLibp2p({
            start: true,        // start automatically when defined
            addresses: {
                // creating the libp2p websocket endpoint here
                listen: [`/ip4/127.0.0.1/tcp/0`]
            },
            transports: [tcp()],
            // use noise for the connection encryption
            connectionEncryption: [noise()],
            streamMuxers: [yamux()],
            // defining the datastore for this particular node
            datastore,
            services: {
                identify: identify()
            }
        }),
    })
}

// create the helia nodes
const node1 = await createNode();
const node2 = await createNode();

// connect them together
const multiaddrs = node2.libp2p.getMultiaddrs();
console.log("multiaddrs: ", multiaddrs)
await node1.libp2p.dial(multiaddrs[0]);


// create the filesystem on top of Helia, in this case it's UnixFS
const fs = unixfs(node1);
const encoder = new TextEncoder();
// add bytes to the network and receive the unique content identifer
const cid = await fs.addBytes(encoder.encode('Hello world 301'));

console.log('Added file:', cid.toString());

// create a file system on top of the second helia node
const fs2 = unixfs(node2);
const decoder = new TextDecoder();

let text = '';

// use the second helia node to fetch the file from the first Helia node
for await (const chunk of fs2.cat(cid)) {
    text += decoder.decode(chunk, {
        stream: true
    })
}

console.log('Fetched file from content: ', text);