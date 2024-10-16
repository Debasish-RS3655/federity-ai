// log everything displaying all the progress made so far
// Debashish Buragohain

import { unixfs } from "@helia/unixfs";
import { createNode } from "../lib/create-node.js";
import { ipns } from "@helia/ipns";
import { dht } from "@helia/ipns/routing";
import { createPeerId } from "../lib/create-key.js";

// create three nodes
const nodeA = await createNode();   // publisher 
const nodeB = await createNode();   // record host
const nodeC = await createNode();   // resolver

// connect them A <--> B <--> C
// publisher will not directly connect with the resolver
await nodeB.libp2p.dial(nodeA.libp2p.getMultiaddrs());
await nodeB.libp2p.dial(nodeC.libp2p.getMultiaddrs());

// add a file
const input = new TextEncoder().encode('hello world');
const fsA = unixfs(nodeA);
// add bytes to the unixfs and create the cid
const fileCid = await fsA.addBytes(input);

const nameA = ipns(nodeA, [
    dht(nodeA)
])

// ensure we will publish record with node B
const key = await createPeerId(nodeA, nodeB, nodeC);