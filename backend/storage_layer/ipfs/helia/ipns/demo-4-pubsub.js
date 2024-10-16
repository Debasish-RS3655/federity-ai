// pubsub alternative router to publish and resolve IPNS names
// Debashish Buragohain

// works by subscribing to a pubsub topic for each IPNS name that we try to resolve.
// updated IPNS records are shared on these topics so an update must occur before the name is resolvable.

// this router is only suitable for networks where IPNS updates are frequent and multiple peers are listening
// on the topics, otherwise update messages may fail to be published with insufficient peers errors


import { createHelia, libp2pDefaults } from "helia";
import { ipns } from "@helia/ipns";
import { pubsub } from "@helia/ipns/routing";
import { unixfs } from "@helia/unixfs";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";


// cooler way to add and modify libp2p properties within helia
const libp2pOptions = libp2pDefaults();
libp2pOptions.services.pubsub = gossipsub();

const helia = await createHelia({
    libp2p: libp2pOptions
});

const name = ipns(helia, {
    routers: [
        pubsub(helia)
    ]
});

const keyInfo = await helia.libp2p.services.keychain.createKey('my-key', 'RSA');
const peerId = await helia.libp2p.services.keychain.exportPeerId(keyInfo.name);

const fs = unixfs(helia);
const filecid = await fs.addBytes([0, 1, 2, 3, 4, 5]);

await name.publish(peerId, filecid);

// resolve the name finally
const { cid, path } = await name.resolve(peerId);

console.log('resolved cid:', cid);
console.log('resolved path:', path);
