import { FsBlockstore } from 'blockstore-fs';
import { join } from 'path';
const store = new FsBlockstore(join(__dirname, 'fs_store'));

