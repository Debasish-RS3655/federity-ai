// relay nodes serve as a means of connection between two peers that would 
// otherwise not be able to connect directly
// Debashish Buragohain

// setup a relay node for our target node to bind to and accept incoming connections


import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { circuitRelayServer } from '@libp2p/circuit-relay-v2';
import { identify } from '@libp2p/identify';
import { webSockets } from '@libp2p/websockets';
import { createLibp2p } from 'libp2p';

const node = await createLibp2p({
    addresses: {
        listen: ['/ip4/0.0.0.0/tcp/0/ws'],
        // !! IMPORTANT BEFORE PRODUCTION
        // a relay node should not advertise its private address in a real world scenario, as the node would not be reachable by others.
        // we should provide an array of public addresses in the libp2p addresses.annouce option
        // if we are using websockets vear in mind that due to browser's security policies we cannot establish unencrypted connection from secure context.
        // the simplest solution is to setup SSL with Nginx and proxy to the node and setup a domain name for the certificate

        // TODO
        // announce: ['/dns4/auto-relay.libp2p.io/tcp/443/wss/p2p/QmWDn2LY8nannvSWJzruUYoLZ4vV83vfCBwd8DipvdgQc3']
    },
    transports: [webSockets()],
    connectionEncryption: [noise()],
    streamMuxers: [yamux()],
    services: {
        identify: identify(),
        relay: circuitRelayServer()
    }
});

console.log(`Relay node started with id ${node.peerId.toString()}`);
console.log('Listening on:');
node.getMultiaddrs().forEach(ma => {
    console.log(ma.toString())
});