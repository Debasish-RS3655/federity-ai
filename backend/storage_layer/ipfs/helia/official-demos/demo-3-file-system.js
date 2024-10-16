import { createNode } from '../lib/create-node.js';
import { unixfs } from '@helia/unixfs';

// create two nodes
const nodeA = await createNode();
const nodeB = await createNode();

// connect them 
await nodeA.libp2p.dial(nodeB.libp2p.getMultiaddrs());

// add a file
const input = new TextEncoder().encode("hello world.");

// create the unixfs data format inside nodeA
const fsA = unixfs(nodeA);
const fileCid = await fsA.addBytes(input);
console.info('created new file. fileCid:', fileCid);
const emptyDirCid = await fsA.addDirectory();
console.info('created empty directory. emptyDirCid:', emptyDirCid);
// copy the file into the directory that we just created with a name
let updatedDirCid = await fsA.cp(fileCid, emptyDirCid, 'file.txt');
console.info('directory updated. updatedDirCID:', updatedDirCid);
console.info('   ');


// switch to the other node and create another unixfs
const fsB = unixfs(nodeB);
console.log(fsB);
for await (const entry of fsB.ls(updatedDirCid)) {
    console.info('-', entry.name, entry.cid);
}

// stop the nodes
await nodeA.stop();
await nodeB.stop();
