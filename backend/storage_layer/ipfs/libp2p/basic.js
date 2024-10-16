// running a basic libp2p node manually
// Debashish Buragohain

import { createLibp2p } from "libp2p";
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from "@libp2p/mplex";


const main = async () => {
    // ready to start the libp2p node
    const node = await createLibp2p({
        // add a listen address localhost to accept the TCP connections on a random port
        addresses: {
            listen: ['/ip4/127.0.0.1/tcp/0']
        },
        // can add as many transports as we like to establish connections with as many peers as possible
        transports: [tcp()],
        // every connection must be encrypted to help ensure security for everyone
        // we use the noise module for this
        connectionEncryption: [noise()],
        // multiplexing is to combine multiple data streams into a single underlying connection
        // not required but increases the efficiency
        // js-libp2p only supports @libp2p/mplex
        streamMuxers: [mplex()]
    });

    // start libp2p
    await node.start();
    console.log('libp2p has started.');

    // print out the listening addresses
    console.log('listening on addresses:');
    node.getMultiaddrs().forEach(addr => {
        console.log(addr.toString())
    })

    // stop the libp2p node
    await node.stop();
    console.log('libp2p has stopped');
}

main().then().catch(console.error);