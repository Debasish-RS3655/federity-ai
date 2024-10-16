// dialer node to test connectivity
// dialer connects with the listener node by means of the relay node
// Debashish Buragohain
import { createLibp2p } from "libp2p";
import { webSockets } from '@libp2p/websockets';
import { noise } from "@chainsafe/libp2p-noise";
import { mplex } from "@libp2p/mplex";
import { yamux } from '@chainsafe/libp2p-yamux';
import { multiaddr } from '@multiformats/multiaddr';

const autoRelayNodeAddr = process.argv[2];
if (!autoRelayNodeAddr) throw new Error('the auto relay node address needs to be specified.');

const node = await createLibp2p({
    transports: [webSockets()],
    connectionEncryption: [noise()],
    streamMuxers: [yamux(), mplex()]
});

console.log(`Dialer node started with id ${node.peerId.toString()}`);

const conn = await node.dial(multiaddr(autoRelayNodeAddr));
console.log(`Connected to the auto relay node via ${conn.remoteAddr.toString()}`);