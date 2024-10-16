import { createHelia } from "helia";
import { createLibp2p } from "libp2p";
import { yamux } from '@chainsafe/libp2p-yamux';
import { noise } from "@chainsafe/libp2p-noise";
import { webSockets } from "@libp2p/websockets";
import { MemoryBlockstore } from "blockstore-core";
import { MemoryDatastore } from "datastore-core";

async function createNode() {
    const datastore = new MemoryDatastore();
    const blockstore = new MemoryBlockstore();
    return createHelia({
        datastore,
        blockstore,
        libp2p: await createLibp2p({
            addresses: {
                listen: ['/ip4/127.0.0.1/tcp/0/ws']
            },
            transports: [webSockets()],
            connectionEncryption: [noise()],
            streamMuxers: [yamux()],
            datastore
        }),
    })
}


export { createNode };