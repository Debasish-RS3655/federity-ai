// peer discovery using random walks through kadht
// Debashish Buragohain

import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { bootstrap } from '@libp2p/bootstrap';
import { identify } from '@libp2p/identify';
import { kadDHT } from '@libp2p/kad-dht';
import { mplex } from '@libp2p/mplex';
import { tcp } from '@libp2p/tcp';
import { createLibp2p } from 'libp2p';
import bootstrappers from '../bootstrappers/bootsrappers.js';

const node = await createLibp2p({
    addresses: {
        listen: ['/ip4/0.0.0.0/tcp/0']
    },
    transports: [tcp()],
    streamMuxers: [yamux(), mplex()],
    connectionEncryption: [noise()],
    peerDiscovery: [
        bootstrap({
            list: bootstrappers
        })
    ],
    services: {
        kadDHT: kadDHT({ 
           kBucketSize: 20,
        }),    // the number of peers to store in each kBucket, default is 20
        identify: identify()
    }
});


node.addEventListener('peer:connect', evt => {
    const peerId = evt.detail;
    console.log(`Connection established to:`, peerId.toString());
    // emitted when a peer is connected
});

node.addEventListener('peer:discovery', evt => {
    const peerInfo = evt.detail;
    console.log(`Discovered:`, peerInfo.id.toString());
});

