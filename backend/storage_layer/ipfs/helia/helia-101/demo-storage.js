// sample blockstore usage
// Debashish Buragohain


// we create a new blockstore usage
import { unixfs } from "@helia/unixfs";
import { MemoryBlockstore } from "blockstore-core";
import { createHelia } from "helia";

// the blockstore is where we store the blocks that make up files.
// this blockstore stores everything in memory.
//   - https://www.npmjs.com/package/blockstore-fs - a filesystem blockstore (for use in node)
//   - https://www.npmjs.com/package/blockstore-idb - an IndexDB blockstore (for use in browsers)
//   - https://www.npmjs.com/package/blockstore-level - a LevelDB blockstore (for node or browsers,
// though storing files in a database is rarely a good idea)


const blockstore = new MemoryBlockstore();

// create helia node with the blockstore specified
const helia = await createHelia({
    blockstore
})

// create a filesystem on top of Helia, in this case it's UnixFS
const fs = unixfs(helia);

const encoder = new TextEncoder();

// add bytes to the node
const cid = await fs.addBytes(encoder.encode("Hello world 201"));
console.log('Added file:', cid.toString());


// create a second helia node using the same bolckstore
const helia2 = await createHelia({
    blockstore
});

// create a second filesystem
const fs2 = unixfs(helia2);
const decoder = new TextDecoder();
let text = '';

// read the file from the blockstore using the second Helia node
for await (const chunk of fs2.cat(cid)) {
    text += decoder.decode(chunk, {
        stream: true
    });
}

// guesss this is autoconnecting to the other node, actually is wonderful though
console.log('Added file content:', text);