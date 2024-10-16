// networking without unixfs
// Debashish Buragohain

import { createHelia } from "helia";
import { createLibp2p } from 'libp2p';
import { yamux } from "@chainsafe/libp2p-yamux";
import { noise } from "@chainsafe/libp2p-noise";
import { webSockets } from "@libp2p/websockets";
import { sha256 } from "multiformats/hashes/sha2";
import { CID } from 'multiformats/cid';
import { MemoryBlockstore } from "blockstore-core";
import { MemoryDatastore } from "datastore-core";
import * as raw from 'multiformats/codecs/raw';

import { strings } from "@helia/strings";
import { verifiedFetch } from "@helia/verified-fetch";

// create an ipfs node with the given port
async function createNode() {
    // well create our own memory and block datastores later inside these classes
    const datastore = new MemoryDatastore();
    const blockstore = new MemoryBlockstore();
    return createHelia({
        datastore,
        blockstore,
        // provide a libp2p node as the relay
        libp2p: await createLibp2p({
            start: true,        // start automatically when defined
            addresses: {
                // creating the libp2p websocket endpoint here
                listen: [`/ip4/127.0.0.1/tcp/0/ws`]
            },
            transports: [webSockets()],
            // use noise for the connection encryption
            connectionEncryption: [noise()],
            streamMuxers: [yamux()],
            // defining the datastore for this particular node
            datastore
        })
    })
}

async function main() {
    try {
        // create two nodes
        console.log("creating IPFS nodes..");
        const nodeA = await createNode();
        const nodeB = await createNode();
        console.log("Created nodes listening on addresses: ");

        nodeA.libp2p.getMultiaddrs().forEach(addr => console.log("Node A:", addr));
        nodeB.libp2p.getMultiaddrs().forEach(addr => console.log("Node B:", addr));

        // maybe the dialing is possible only after the connection has happended
        // connect them by dialing one's address from the other
        const conn = await nodeA.libp2p.dial(nodeB.libp2p.getMultiaddrs());
        if (conn) console.info('Connected through dialing.');

        // old way of doing the things
        // // create a block
        const input = new TextEncoder().encode("hello world");
        const digest = await sha256.digest(input);
        const cid = CID.createV1(raw.code, digest);
        // put a block into one node
        await nodeA.blockstore.put(cid, input);

        // create a block inside node A
        // const s = strings(nodeA);
        // const cid = await s.add("hello world");
        // console.log('Put data to node A:', await s.get(cid));

        // !!-- older way of doing the things
        // get the block from another node
        const block = await nodeB.blockstore.get(cid);
        console.info(new TextDecoder().decode(block));

        // !!--  verified fetch searches for the block in the entire network and brings the block
        // const response = await verifiedFetch(cid);
        // console.log('Retrieved value using verified fetch:', response.text());

        await nodeA.stop();
        await nodeB.stop();

    }
    catch (err) {
        console.error("Error:", err);
    }
}

main();