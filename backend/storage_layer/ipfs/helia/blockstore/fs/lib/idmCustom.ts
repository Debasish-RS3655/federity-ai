/**
 * @packageDocumentation
 *  
 * A blockstore implementation that stores blocks in [IDB][]
 * a single file in itself
 * @example
 * 
 * ```js
 * import { IDBBlockstore } from 'blockstore-idb'
 *
 * const store = new IDBBlockstore('path/to/store')
 * ```
 */

import {
    BaseBlockstore,
    Errors
} from 'blockstore-core';
import { openDB, type IDBPDatabase, deleteDB } from 'idb';
import { base32upper } from 'multiformats/bases/base32';
import { CID } from 'multiformats/cid';
import * as raw from 'multiformats/codecs/raw';
import type { Pair } from 'interface-blockstore';
import type { AbortOptions, AwaitIterable } from 'interface-store';
import type { MultibaseCodec } from 'multiformats/bases/interface';
import * as Digest from 'multiformats/hashes/digest';

export interface IDBBlockstoreInit {
    /**
     * A prefix to use for all database keys. (default: ')
     */
    prefix?: string

    /**
     * The database version (default: 1)
     */
    version?: number

    /**
     * The mulibase codec to use
     * (default base32upper)
    */
    base?: MultibaseCodec<string>
}


export class IDBBlockstore extends BaseBlockstore {
    private readonly location: string
    private readonly version: number
    // !! need to change this to realm database type
    private db?: IDBPDatabase
    private readonly base: MultibaseCodec<string>


    // these will remain similar in our implementation
    constructor(location: string, init: IDBBlockstoreInit = {}) {
        // we use super inside the constructor of the derived class to call the constructor of the base class        
        super();        // here we are calling the constructor of the BaseBlockStore

        this.location = `${init.prefix ?? ''}${location}`; // by default we kept the prefix to ''
        this.version = init.version ?? 1;                  // version defaulted to 1

        this.base = init.base ?? base32upper;              // base32 encoder by default
    }

    // returns the base32 encoded string from the multihash bytes of CID
    #encode(cid: CID): string {
        return `/${this.base.encoder.encode(cid.multihash.bytes)}`
    }

    // returns the CID from the base32 encoded string
    #decode(key: string): CID {
        return CID.createV1(raw.code, Digest.decode(this.base.decoder.decode(key.substring(1))));
    }

    // open a database    
    async open (): Promise<void> {
        try {
            const location = this.location;     // provide the location of the database

            // open the database instance and set it to the db variable here
            this.db = await openDB(location, this.version, {
                
            })
        }
        catch(err) {

        }
    }
}