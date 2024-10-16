// a pinging node IPFS
// ping to a remote peer using libp2p
// Debashish Buragohain

import process from 'node:process';
import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { multiaddr } from '@multiformats/multiaddr';
import { ping } from '@libp2p/ping';
// yamux or mplex multiplexers are supported
import { mplex } from '@libp2p/mplex';
import { yamux } from '@chainsafe/libp2p-yamux';


const node = await createLibp2p({
    start: false,   // dont start by default
    addresses: {
        // add a listen address (localhost) to accept TCP connections on a random port
        listen: ['/ip4/127.0.0.1/tcp/0']
    },
    // other transport protocols can be added to connect to as many peers as possible
    transports: [tcp()],
    connectionEncryption: [noise()],
    // in the latest exmaples yamux is more preferred than mplex
    streamMuxers: [mplex(), yamux()],
    services: {
        ping: ping({
            protocolPrefix: 'ipfs',     // default
        })
    }
});


// start libp2p
await node.start();
console.log('libp2p has started using tcp.');

// print out listening addresses
console.log('listening on addresses:');
node.getMultiaddrs().forEach(addr => {
    console.log(addr.toString());
})

// ping to the peer if received the multiaddr
if (process.argv.length >= 3) {
    const ma = multiaddr(process.argv[2]);
    console.log(`pinning remote peer at ${process.argv[2]}`);
    const latency = await node.services.ping.ping(ma);
    console.log(`pinged ${process.argv[2]} in ${latency}ms`);
}
else {
    console.log('no remote address given, skipping ping.');
}

const stop = async () => {
    // stop libp2p
    await node.stop();
    console.log('libp2p has stopped.');
    process.exit(0);
}

process.on('SIGTERM', stop);
process.on('SIGINT', stop);