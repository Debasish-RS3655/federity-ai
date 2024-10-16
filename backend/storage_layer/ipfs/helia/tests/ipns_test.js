// ipfs is a system for creating and updating mutable links to ipfs content
// ipns allows for publishing the latest version of any ipfs content
// even though the underlying IPFS hash has changed


import { createHelia } from "helia";
import { ipns } from "@helia/ipns";
import { unixfs } from "@helia/unixfs";

const helia = await createHelia();  // helia node creation
console.log("helia node peer id:", peerId);

const ipnsInstance = ipns(helia);
const input = new TextEncoder().encode("hello world");
const fsA = unixfs(helia);
const fileCid = await fsA.addBytes(input);

console.log("file created with CID:", fileCid.toString());
// publish a record
const published = await ipnsInstance.publish("key", fileCid, peerId);
console.log('Published record with CID:', published);

// retrieve a record using the key
const retrieved = await ipnsInstance.resolve("key");
console.log("Retrieved data:", retrieved);
