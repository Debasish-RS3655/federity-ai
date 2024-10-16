import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { fsBlockStore } from './lib/fs_custom.js';

const helia = await createHelia({
    blockstore: new fsBlockStore()
});


const fs = unixfs(helia);

const cid = await fs.addBytes(new TextEncoder().encode("hello world"));
console.log('cid:', cid);