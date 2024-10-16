// publish CIDs with an associated path
// i.e. files stored within directories
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
const fileCid = await fs.addBytes(Uint8Array.from([0, 1, 2, 3, 4]));

// store the file into a directory
const dirCid = await fs.addDirectory();        // the cid of the empty directory
// copy the file into folder we just created with a given name
// then calculate its CID
// for copying we need the file cid, the directory cid and the name of the file we want to save as
const updatedDirCid = await fs.cp(fileCid, dirCid, 'foo.txt');    

console.log('Created folder containing file cid:', updatedDirCid);

console.log('Publishing...');
// publish the name with the given path and file name
await name.publish(peerId, `/ipfs/${updatedDirCid}/foo.txt`);

// resolve the name now
const result = await name.resolve(peerId);

console.info('original file cid:', result.cid);
console.info('original file path:', result.path);