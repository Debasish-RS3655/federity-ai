// implementing peer discovery mechanism using bootstrap
// if we already know some of the addresses of other peers
// Debashish Buragohain

import { createLibp2p } from "libp2p";
import { webSockets } from "@libp2p/websockets";
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { bootstrap } from "@libp2p/bootstrap";
import process from 'node:process';

// enter some known peer addresses
if (process.argv.length < 3) {
    console.error("No peers provided for boostrap peer discovery. exiting...");
    process.exit(0);
}
const bootstrapMultiaddrs = process.argv.slice(2);

const node = await createLibp2p({
    // listen to this port for the node
    addresses: {
        listen: ['/ip4/127.0.0.1/tcp/0/ws']
    },    
    transports: [webSockets()],
    connectionEncryption: [noise()],
    streamMuxers: [yamux()],
    peerDiscovery: [
        bootstrap({
            list: bootstrapMultiaddrs, // provide array of multiaddrs
        })
    ]
});

node.addEventListener('peer:discovery', e => {
    // log the discovered peer
    console.log(`Discovered ${e.detail.id.toString()}`)
});

node.addEventListener('peer:connect', e => {
    // log connected peer
    console.log(`Connected to ${e.detail.toString()}`)
})


const stop = async () => {
    await node.stop();
    console.log('lib2p has stopped.');
    process.exit(0);
}

process.on('SIGTERM', stop);
process.on('SIGINT', stop);