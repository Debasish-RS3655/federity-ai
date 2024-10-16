import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';

const createNode = async () => {
    return await createLibp2p({
        start: true,
        addresses: {
            listen: ['/ip4/127.0.0.1/tcp/0']
        },
        transports: [tcp()],
        connectionEncryption: [noise()],
        streamMuxers: [yamux()]
    });
}

const connectAddr = async (source, target) => {
    for (const address of target.getMultiaddrs()) {
        try {
            const conn = await source.dial(address);
            if (conn) {
                return true;
            }
        }
        catch (err) {
            console.error('error dialling:', err)
            return false;
        }
    }
    return false;
}

const alice = await createNode();
const bob = await createNode();

// declare alice to discover other peers from the relay
console.log('Alice peerid:', alice.peerId);
console.log('Bob peerid:', bob.peerId);

console.log('Alice multiaddrs:', alice.getMultiaddrs());
console.log('Bob multiaddrs:', bob.getMultiaddrs());

// this is getting connected though
console.log("connected:", await connectAddr(bob, alice));

alice.addEventListener('peer:connect', e => {
    console.log('Peer connected to Alice:', e.detail.toString());
});
bob.addEventListener('peer:connect', e => {
    console.log('Peer connected to Bob:', e.detail.toString());
});;