// connecting to other helia nodes via websocket
// auto connect to all nodes in the local network using mdns
// !!-- DIALING NOT REQUIRED WHEN USING THIS
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
import { mdns } from '@libp2p/mdns';    // auto connect to all the peers in the local network

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
            peerDiscovery: [mdns({
                broadcast: true,
            })],
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
        console.log("Nodes listening on addresses: ");
        nodeA.libp2p.getMultiaddrs().forEach(addr => console.log("Node A:", addr));
        nodeB.libp2p.getMultiaddrs().forEach(addr => console.log("Node B:",addr));
        nodeA.libp2p.addEventListener('peer:connect', e => {
            console.log(`Node A: Connection established to: ${e.detail.toString()}`)
        });
        nodeB.libp2p.addEventListener('peer:connect', e => {
            console.log(`Node B: Connection established to: ${e.detail.toString()}`)
        });

        // !!-- DIALING NOT REQUIRED --> since we are already connected using mdns, we do not need to dial the other node
        // const conn = await nodeA.libp2p.dial(nodeB.libp2p.getMultiaddrs());
        // if (conn) console.log('connection established by dialing.');

        // create a block
        const input = new TextEncoder().encode("hello world");
        const digest = await sha256.digest(input);
        const cid = CID.createV1(raw.code, digest);
        // put a block into one node
        await nodeA.blockstore.put(cid, input);

        // get the block from another node
        const block = await nodeB.blockstore.get(cid);

        console.info(new TextDecoder().decode(block));
        await nodeA.stop();
        await nodeB.stop();

    }
    catch (err) {
        console.error("Error:", err);
    }
}

main();