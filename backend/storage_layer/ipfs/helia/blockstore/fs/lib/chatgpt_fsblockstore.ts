import fs from 'node:fs/promises'; // Importing the promises-based 'fs' module from Node.js
import path from 'node:path'; // Importing the 'path' module from Node.js
import { promisify } from 'node:util'; // Importing 'promisify' from the 'util' module
import { Errors } from 'blockstore-core'; // Importing 'Errors' from 'blockstore-core'
import fwa from 'fast-write-atomic'; // Importing 'fast-write-atomic'
import glob from 'it-glob'; // Importing 'it-glob'
import map from 'it-map'; // Importing 'it-map'
import parallelBatch from 'it-parallel-batch'; // Importing 'it-parallel-batch'
import { NextToLast, type ShardingStrategy } from './sharding.js'; // Importing 'NextToLast' class and 'ShardingStrategy' type from './sharding.js'
import type { Blockstore, Pair } from 'interface-blockstore'; // Importing 'Blockstore' and 'Pair' types from 'interface-blockstore'
import type { AwaitIterable } from 'interface-store'; // Importing 'AwaitIterable' type from 'interface-store'
import type { CID } from 'multiformats/cid'; // Importing 'CID' type from 'multiformats/cid'

const writeAtomic = promisify(fwa); // Promisifying 'fast-write-atomic' function

/**
 * Write a file atomically
 */
async function writeFile(file: string, contents: Uint8Array): Promise<void> {
    try {
        await writeAtomic(file, contents); // Write contents to the file atomically
    } catch (err: any) {
        if (err.code === 'EPERM' && err.syscall === 'rename') {
            // Handle Windows-specific error when renaming a file
            // Make sure we can read & write to this file
            await fs.access(file, fs.constants.F_OK | fs.constants.W_OK);
            // The file was created by another context
            return;
        }
        throw err; // Propagate other errors
    }
}

export interface FsBlockstoreInit {
    // Initialization options for FsBlockstore class
    createIfMissing?: boolean; // If true and the blockstore location does not exist, create it
    errorIfExists?: boolean; // If true and the blockstore location exists, throw an error
    extension?: string; // The file extension to use when storing blocks
    putManyConcurrency?: number; // Number of blocks to put in parallel when `.putMany` is called
    getManyConcurrency?: number; // Number of blocks to read in parallel when `.getMany` is called
    deleteManyConcurrency?: number; // Number of blocks to delete in parallel when `.deleteMany` is called
    shardingStrategy?: ShardingStrategy; // Control how CIDs map to paths and back
}

/**
 * A blockstore backed by the file system
 */
export class FsBlockstore implements Blockstore {
    public path: string; // Path to the blockstore
    private readonly createIfMissing: boolean; // Flag to create blockstore if missing
    private readonly errorIfExists: boolean; // Flag to throw an error if blockstore exists
    private readonly putManyConcurrency: number; // Number of blocks to put in parallel
    private readonly getManyConcurrency: number; // Number of blocks to read in parallel
    private readonly deleteManyConcurrency: number; // Number of blocks to delete in parallel
    private readonly shardingStrategy: ShardingStrategy; // Strategy for sharding

    constructor(location: string, init: FsBlockstoreInit = {}) {
        // Initialize FsBlockstore instance with provided parameters or defaults
        this.path = path.resolve(location); // Resolve and set the blockstore location
        this.createIfMissing = init.createIfMissing ?? true; // Set createIfMissing or default to true
        this.errorIfExists = init.errorIfExists ?? false; // Set errorIfExists or default to false
        this.deleteManyConcurrency = init.deleteManyConcurrency ?? 50; // Set deleteManyConcurrency or default to 50
        this.getManyConcurrency = init.getManyConcurrency ?? 50; // Set getManyConcurrency or default to 50
        this.putManyConcurrency = init.putManyConcurrency ?? 50; // Set putManyConcurrency or default to 50
        this.shardingStrategy = init.shardingStrategy ?? new NextToLast(); // Set shardingStrategy or default to NextToLast
    }

    async open(): Promise<void> {
        try {
            await fs.access(this.path, fs.constants.F_OK | fs.constants.W_OK); // Check if blockstore directory exists and is writable
            if (this.errorIfExists) {
                // If errorIfExists is true, throw an error if blockstore directory already exists
                throw Errors.openFailedError(new Error(`Blockstore directory: ${this.path} already exists`));
            }
        } catch (err: any) {
            if (err.code === 'ENOENT') {
                // If blockstore directory doesn't exist
                if (this.createIfMissing) {
                    // If createIfMissing is true, create the blockstore directory recursively
                    await fs.mkdir(this.path, { recursive: true });
                    return;
                } else {
                    // If createIfMissing is false, throw an error indicating blocstore directory doesn't exist
                    throw Errors.openFailedError(new Error(`Blockstore directory: ${this.path} does not exist`));
                }
            }
            // Propagate other errors
            throw err;
        }
    }

    async close(): Promise<void> {
        // Placeholder for close functionality
        await Promise.resolve();
    }

    async put(key: CID, val: Uint8Array): Promise<CID> {
        // Store the block data identified by the key in the blockstore
        const { dir, file } = this.shardingStrategy.encode(key); // Get directory and file names from sharding strategy
        try {
            // Create directory if needed
            if (dir != null && dir !== '') {
                await fs.mkdir(path.join(this.path, dir), {
                    recursive: true
                });
            }
            // Write block data to file
            await writeFile(path.join(this.path, dir, file), val);
            return key; // Return the provided key
        } catch (err: any) {
            // If an error occurs, throw a putFailedError
            throw Errors.putFailedError(err);
        }
    }

    async * putMany(source: AwaitIterable<Pair>): AsyncIterable<CID> {
        // Store multiple blocks in parallel
        yield* parallelBatch(
            map(source, ({ cid, block }) => {
                return async () => {
                    await this.put(cid, block); // Store block
                    return cid; // Return the CID of the stored block
                };
            }),
            this.putManyConcurrency // Number of blocks to store in parallel
        );
    }

    async get(key: CID): Promise<Uint8Array> {
        // Retrieve block data identified by the key from the blockstore
        const { dir, file } = this.shardingStrategy.encode(key); // Get directory and file names from sharding strategy
