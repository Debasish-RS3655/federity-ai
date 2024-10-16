// fs based custom blockstore
// Debashish Buragohain

import { BaseBlockstore } from "blockstore-core/base";
import { writeFileSync, readFileSync, existsSync, unlinkSync, readdirSync } from 'fs';
import { CID } from 'multiformats/cid';

class fsBlockStore extends BaseBlockstore {
    put(key, val, options) {
        // key is the cid
        // val is a Uint8Array
        // returns the cid after saving   
        try {
            writeFileSync(`/fs_store/${key.toString()}.txt`, val);
            console.log('saved block to fs.');
            return key;
        }
        catch (err) {
            throw new Error('Error putting block:', err);
        }
    }

    get(key, options) {
        // key is the cid
        // returns the Uint8Array after getting
        try {
            const blockBuffer = readFileSync(`/fs_store/${key.toString()}.txt`);
            return new Uint8Array(blockBuffer);
        }
        catch (err) {
            throw new Error('Error getting block:', err);
        }
    }

    has(key, options) {
        // returns boolean value
        // key is the cid
        try {
            return existsSync(`/fs_store/${key.toString()}.txt`);
        }
        catch (err) {
            throw new Error('Error in block has', err);
        }
    }

    delete(key, options) {
        // returns void
        // key is the cid 
        try {
            unlinkSync(`/fs_store/${key.toString()}.txt`);
        }
        catch (err) {
            throw new Error('Error deleting block:', err);
        }
    }

    getAll(options) {
        // retuns all the blocks in this node i.e. inside the fs folder
        // {cid: CID
        // block: Uint8Array}
        const blocks = [];
        try {
            const cids = readdirSync('/fs_store');
            for (let i = 0; i < cids.length; i++) {
                const blockBuffer = readFileSync(`/fs_store/${cids[i]}.txt`);
                blocks.push({
                    cid: CID(cids[i]),
                    block: Uint8Array(blockBuffer)
                })
            }
            return blocks;
        }
        catch(err) {
            throw new Error('Error in node getAll:', err);
        }
    }
}
export { fsBlockStore }