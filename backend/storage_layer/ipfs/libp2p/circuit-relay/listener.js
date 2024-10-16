// the listener node

// nodes behind NAT or browser nodes cannot connect directly
// typical use case for a Circuit Relay
// Debashish Buragohain

import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import { webSockets } from "@libp2p/websockets";
import { multiaddr } from "@multiformats/multiaddr";
import { createLibp2p } from 'libp2p';
import process from 'node:process';

const relayAddr = process.argv[2];
if (!relayAddr) throw new Error('the relay address needs to be specified as a parameter.');

// since this is using the relay port, we wont be directly specifying the listener port
// this listener uses the relay port as its own port
const listenerNode = await createLibp2p({
    transports: [
        webSockets(),
        // specifying the relay server as a means of transport for the listener
        circuitRelayTransport({
            discoverRelays: 2
        })
    ],
    connectionEncryption: [noise()],
    streamMuxers: [yamux()],
    services: {
        identify: identify()
    }
});


console.log(`Listener node started with id ${listenerNode.peerId.toString()}`);

// dial the relay node now
// !! NOTE: instead of manually dialing the relay, we could also connect using peer discovery mechanisms
// e.g. bootstrap
const conn = await listenerNode.dial(multiaddr(relayAddr));
console.log(`Connected to the relay ${conn.remotePeer.toString()}`);

// wait for the connection and the relay to be bind for the example purpose
// listen to the self peer update event
listenerNode.addEventListener('self:peer:update', evt => {
    // updated self multiaddrs  
    console.log(`Advertising with a relay address of ${listenerNode.getMultiaddrs()[0].toString()}`);
})
