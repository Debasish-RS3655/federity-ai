// publish a simple file to IPNS using helia
// Debashish Buragohain

import { createHelia } from "helia";
import { ipns } from "@helia/ipns";
import { unixfs } from "@helia/unixfs";

// helia instance
const helia = await createHelia();
// ipns instance within the helia instance
const name = ipns(helia);

// create a public key to publish as an IPFS name
const keyInfo = await helia.libp2p.services.keychain.createKey('my-key', 'RSA');
const peerId = await helia.libp2p.services.keychain.exportPeerId(keyInfo.name);
console.log('peer id:', peerId);

// store some data to publish
const fs = unixfs(helia);
// so for storing in helia we need it as a uint8array
const cid = await fs.addBytes(Uint8Array.from([0, 1, 2, 3, 4]));
console.log('created file with CID:', cid.toString());
console.log('Publishing...\n');
// publish the name
await name.publish(peerId, cid);
console.log('Published.. waiting to be resolved.');
// resolve the name --> find the cid provided we have the peer id as the key
const result = await name.resolve(peerId);
console.info(result.cid, result.path);