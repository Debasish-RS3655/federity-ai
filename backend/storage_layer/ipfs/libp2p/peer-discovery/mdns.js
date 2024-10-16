// peer discovery using mDNS (multicast Domain Name System)
// local peer discovery with zero configuration (only works on the server side)
// Debashish Buragohain

// a query is sent to discover the peers on the local network
// when a query is detected, each node sends an asnwer about itself

import { createLibp2p } from "libp2p";
import { webSockets } from "@libp2p/websockets";
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { mdns } from "@libp2p/mdns";    // mdns for the peer discovery
import { v4 as uuidv4 } from "uuid";
// import { multiaddr } from "@multiformats/multiaddr";

const node = await createLibp2p({
    addresses: {
        listen: ['/ip4/127.0.0.1/tcp/0/ws']
    },
    transports: [webSockets()],
    connectionEncryption: [noise()],
    streamMuxers: [yamux()],
    peerDiscovery: [mdns({
        // !!-- NONE OF THE PARAMS ARE MANDATORY      
        // random sequence of characters for the peer's name
        // not necessary to be provided though
        peerName: uuidv4(),
        // other multiaddrs to annouce
        // multiaddrs: [multiaddr('/ip4/127.0.0.1/tcp/0/ws')],  
        broadcast: true,            // annouce our presence through mDNS, default false
        serviceTag: 'ipfs.local',    // default service
        // interval: 20e3
    })]
});

await node.start();
console.log('libp2p started listening on addresses:');
node.getMultiaddrs().forEach(addr => {
    console.log(addr.toString());
})

node.addEventListener('peer:discovery', e => {
    // log the discovered peer
    console.log(`Discovered ${e.detail.id.toString()}`)
});

node.addEventListener('peer:connect', e => {
    // log connected peer
    console.log(`Connected to ${e.detail.toString()}`)
})