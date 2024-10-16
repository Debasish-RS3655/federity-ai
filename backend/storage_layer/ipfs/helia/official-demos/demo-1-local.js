// simple put and get in helia
// Debashish Buragohain

import { createHelia } from 'helia';
import { sha256 } from 'multiformats/hashes/sha2';
import { CID } from 'multiformats/cid';
import * as raw from 'multiformats/codecs/raw';

// create a node
console.log("creating helia node..");
const node = await createHelia();
console.log("helia node created.");

// create a block
// input in the form of typed array of bytes of Uint8-Array
const input = new TextEncoder().encode("hello world");
const digest = await sha256.digest(input);
const cid = CID.createV1(raw.code, digest);

// put a block
await node.blockstore.put(cid, input);

// get a block with the given cid
const block = await node.blockstore.get(cid);

console.info(new TextDecoder().decode(block));