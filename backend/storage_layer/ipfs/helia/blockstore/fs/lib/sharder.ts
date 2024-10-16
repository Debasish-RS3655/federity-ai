// this code defines two classes 'NextToLast and 'FlatDirectory' implementing the 'ShardingStrategy' interface
// NextToLast class implements a sharding strategy where the last few characters of a multibase encoded CID are used as the directory to store the blocks into
// FlatDirectory class implements a strategy that stores all files in one directory useful for testing purposes only
// both classes have encoding and decoding methods to handle file paths and CIDs
// Debashish Buragohain

import path from 'node:path';
import { base32upper } from 'multiformats/bases/base32';    /// base32 uses upper case letters to represent numbers in a human readable form
import { CID, Version } from 'multiformats/cid';
import type { Multibase, MultibaseCodec } from 'multiformats/bases/interface';

/**
 * interface defining a sharding strategy
 * interface is an abstract type that defines the contract for objects
 */
export interface ShardingStrategy {
    extension: string;  // file extension to use
    // encoding function to generate directory and file name as an object
    encode(cid: CID): {
        dir: string,
        file: string
    }
    // decoding function to retrieve CID from path
    decode(path: string): CID
}

/**
 * interface defining initialization options for NextToLast strategy
 */
export interface NextToLastInit {
    extension?: string;     // File extension to use (default '.data')
    prefixLength?: number;  // Number of chars to take from the end of the CID
    base?: MultibaseCodec<string>
    // a codec for encoding and decoding data using a specific mutibase encoding scheme
    // the string type parameter indicates that the codec operates on strings
    // multibase is a protocol for encoding binary data using multiple base encoding schemes
    // here we are using base32 that uses upper case letters to represent numbers in the encoding process
}

/**
 * a sharding strategy that takes the last few characters of a multibase encoded CID and uses them
 * as the directory to store the block into. This prevents storing all blocks in a single directory which
 * would overwhelm most filesystems
 */
export class NextToLast implements ShardingStrategy {
    public extension: string;
    private readonly prefixLength: number;
    private readonly base: MultibaseCodec<string>

    constructor(init: NextToLastInit = {}) {
        this.extension = init.extension ?? '.data'; // set the given file extension or use the default .data extension
        this.prefixLength = init.prefixLength ?? 2; // set the prefix length or default it to 2
        this.base = init.base ?? base32upper;       // set or use the default base32 codec
    }

    // encode method to generate directory and the file names
    // give the cid and get the directory and file names
    encode(cid: CID): { dir: string; file: string; } {
        // encode the CID's multihash using the specified multibase codec
        // this is the name of the block to be stored        
        const str = this.base.encoder.encode(cid.multihash.bytes);      // we take out the multihash of the cid and convert it into binary form, which we will extract later
        // take the last few characters of the encoder output as the directory name
        const prefix = str.substring(str.length - this.prefixLength);

        return {
            dir: prefix,                    // the directory name
            file: `${str}${this.extension}` // full name with file extension
        }
    }

    decode(str: string): CID {
        let fileName = path.basename(str);          // extract the file name from the given path
        if (fileName.endsWith(this.extension)) {    // check if the file name ends with the given extension
            // remove the extension from the file name now
            fileName = fileName.substring(0, fileName.length - this.extension.length);
        }

        // first base32 decoder decodes the file name into the multihash bytes
        // then the cid decodes the multihash bytes back to the CID format
        return CID.decode(this.base.decoder.decode(fileName));
    }
}


/**
 *  A sharding strategy that does not do any sharding and stores all files in one directory.
 *  Only for testing... do not use in production.
 */
export class FlastDirectory implements ShardingStrategy {
    public extension: string;
    private readonly base: MultibaseCodec<string>

    constructor(init: NextToLastInit = {}) {
        this.extension = init.extension ?? '.data';
        this.base = init.base ?? base32upper;
    }

    // no sharding strategy applied directly base32 encode the file name
    encode(cid: CID): { dir: string; file: string; } {
        const str = this.base.encoder.encode(cid.multihash.bytes);
        return {
            dir: '',
            file: `${str}${this.extension}`
        };
    }

    // decode the filename back into the multihash bytes first and then back to the CID
    decode(str: string): CID {
        // str is the entire file path
        let fileName = path.basename(str);
        if (fileName.endsWith(this.extension)) {
            fileName = fileName.substring(0, fileName.length - this.extension.length);
        }
        return CID.decode(this.base.decoder.decode(fileName));
    }
}