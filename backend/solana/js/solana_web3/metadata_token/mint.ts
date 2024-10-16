//program to mint the tokens
//Debashish Buragohain

import {
    Transaction, SystemProgram, Keypair, Connection, PublicKey,
    sendAndConfirmTransaction
} from '@solana/web3.js';
//TOKEN_2022_PROGRAM_ID, createInitializeMintInstruction2
import {
    MINT_SIZE, TOKEN_PROGRAM_ID, createInitializeMintInstruction, getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction, createMintToInstruction
} from '@solana/spl-token';
import { DataV2, createMetadataAccountV3 } from "@metaplex-foundation/mpl-token-metadata";
import { bundlrStorage, keypairIdentity, Metaplex, UploadMetadataInput } from "@metaplex-foundation/js";
import secret from "./secret/guideSecret.json";


