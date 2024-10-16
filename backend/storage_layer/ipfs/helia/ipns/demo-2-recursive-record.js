// publishing a recursive record
// a recursice record is one that points to another record rather than to a value
// Debashish Buragohain

import { createHelia } from "helia";
import { ipns } from "@helia/ipns";
import { unixfs } from "@helia/unixfs";

const helia = await createHelia();
const name = ipns(helia);

// create a public key to publish as an IPNS name
const keyInfo = await helia.libp2p.services.keychain.createKey('my-key', 'RSA');
const peerId = await helia.libp2p.services.keychain.exportPeerId(keyInfo.name);

// store some data to publish
const fs = unixfs(helia);
const cid = await fs.addBytes(Uint8Array.from([0, 1, 2, 3, 4]));

console.log('Publishing original file...');
// publish the name to ipns now
await name.publish(peerId, cid);

// create another public key to republish the original record
const recursiveKeyInfo = await helia.libp2p.services.keychain.createKey('my-recursive-key', 'RSA');
const recursivePeerId = await helia.libp2p.services.keychain.exportPeerId(recursiveKeyInfo.name);

console.log('Done. Publishing reference...');
// publish the recursive record now i.e. instead of providing a CID we provide the peerId
await name.publish(recursivePeerId, peerId);

// resolve the name recursively - it resolves until a CID is found
const result = await name.resolve(recursivePeerId);
console.info('resolved cid:', result.cid.toString());
console.log("verified:", result.cid.toString() == cid.toString());  // true