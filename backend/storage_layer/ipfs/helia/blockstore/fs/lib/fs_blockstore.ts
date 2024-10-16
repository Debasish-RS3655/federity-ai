// custom implementation of the fs blockstore
// Debashish Buragohain

import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';  // to convert callbacks into promises
import { Errors } from 'blockstore-core';
import fwa from 'fast-write-atomic';    // atomic writes ensure that data is fully written or not at all and not partially written for concurrent execution types
import glob from 'it-glob';             // file matching similar to the shell matches
import map from 'it-map';               // maps async iterables
import parallelBatch from 'it-parallel-batch'; // execute promise returning functions in parallel and emit the results in the same order as input
import { NextToLast, type ShardingStrategy } from './sharder.ts';
import type { Blockstore, Pair } from 'interface-blockstore';
import type { AwaitIterable } from 'interface-store';
import type { CID } from 'multiformats/cid';

// promisifying the fast write atomic function
const writeAtomic = promisify(fwa);

/**
 * write a file atomically
 */
// the filename and the contents in a Uint8Array format
async function writeFile(file: string, contents: Uint8Array): Promise<void> {
    try {
        await writeAtomic(file, contents);  // write atomically
    }
    catch (err: any) {
        if (err.code === 'EPERM' && err.syscall === 'rename') {
            // handle Windows-specific error when renaming a file
            // make sure we can read and write to this file
            await fs.access(file, fs.constants.F_OK | fs.constants.W_OK);
            // the file was created by another context
            return;
        }
        throw err;  // propagate other errors
    }
}


export interface FsBlockstoreInit {
    // init options for the FsBlockstore class
    createIfMissing?: boolean;  // if true and the blockstore location does not exists then create it
    errorIfExists?: boolean;    // if true and the blockstore location exists, throw an error
    extension?: string;         // file extension to use when storing the blocks
    putManyConcurrency: number; // number of blocks to put in parallel when .putMany is called
    getManyConcurrency: number; // number of blocks to read in parallel when .getMany is called
    deleteManyConcurrency: number; // number of blocks to delete in parallel when .deleteMany is called
    shardingStrategy: ShardingStrategy; // control how CIDs map to paths and back
}

// a blockstore backed by the file system
export class FsBlockstore implements Blockstore {
    public path: string;          // path to the blockstore
    private readonly createIfMissing: boolean;  // create blockstore if exists
    private readonly errorIfExists: boolean;    // throw an error if blockstore exists
    private readonly putManyConcurrency: number;
    private readonly getManyConcurrency: number;
    private readonly deleteManyConcurrency: number;
    private readonly shardingStrategy: ShardingStrategy;

    constructor(location: string, init: FsBlockstoreInit = {}) {
        // initialize the blockstore instance
        this.path = path.resolve(location);      // resolve to an absolute location
        this.createIfMissing = init.createIfMissing ?? true;    // by default create if missing
        this.errorIfExists = init.errorIfExists ?? false;       // no error if already exists, we overwrite it
        this.deleteManyConcurrency = init.deleteManyConcurrency ?? 50;  // delete 50 blocks in parallel by default
        this.getManyConcurrency = init.getManyConcurrency ?? 50 // by default read 50 blocks by default in parallel
        this.putManyConcurrency = init.putManyConcurrency ?? 50 // by default write 50 blocks in parallel
        this.shardingStrategy = init.shardingStrategy ?? new NextToLast();  // default to put blocks in directories with the last two characters as the directory name
    }

    // opening the directory where the block would be stored
    async open(): Promise<void> {
        try {
            await fs.access(this.path, fs.constants.F_OK | fs.constants.W_OK);
            // the fact that this section is executed means that the directory does exists
            // otherwise the catch block will be executed
            if (this.errorIfExists) {
                // if true we throw an error if the directory already exists 
                throw Errors.openFailedError(new Error(`Blockstore directory: ${this.path} already exists`));
            }
        }
        catch (err: any) {
            // if the directory does not exist error
            if (err.code === 'ENOENT') {
                // if the blockstore directory does not exist then we create it if set to true
                if (this.createIfMissing) {
                    // create the directory ourselves
                    await fs.mkdir(this.path, { recursive: true });
                    return;
                }
                else {
                    // if createIfMissing is false, throw an error indicating blockstore directory does not exist
                    throw Errors.openFailedError(new Error(`Blockstore directory ${this.path} does not exist`));
                }
            }
            // propagate errors other than directory exists and does not exists error
            throw err;
        }
    }

    // close directory function
    async close(): Promise<void> {
        // placeholder for the close functonality
        // we don't actually require to close the directory here
        await Promise.resolve();
    }

    // put the data
    async put(key: CID, val: Uint8Array): Promise<CID> {
        const { dir, file } = this.shardingStrategy.encode(key);   // get directory and file names from sharding strategy
        // dir is the last two letters extracted from the base32 encoded multihash byte
        // file is the entire base32 encoded form of the multihash bytes
        try {
            // put will always create a new directory if does not exists
            if (dir != null && dir !== '') {
                // actually create the directory of which name we got through the sharding process
                await fs.mkdir(path.join(this.path, dir), {
                    recursive: true
                });
            }

            // !!---- don't know why but we are creating a new directory even if it already exists and might contain other files
            

            // write block data to file
            // path is the directory name that we give entirely to the fsBlockstore
            await writeFile(path.join(this.path, dir, file));   
        }
        catch(err: any) {

        }
    }
}