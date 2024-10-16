//access the solana wallet from javascript
//Debasish Buragohain

/*
//Bundle scripts for web3
<!-- Development (un-minified) -->
<script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.js"></script>
<!-- Production (minified) -->
<script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js"></script>
*/

const solanaWeb3 = require("@solana/web3.js");

//generating a new keypair
let keypair = solanaWeb3.Keypair.generate();

//keypair from a secret key
const secretKey = "";
keypair = solanaWeb3.Keypair.fromSecretKey(secretKey);

//create and send transactions
function transact() {
    //creating fake accounts to send and receive solanas
    const fromKeypair = solanaWeb3.Keypair.generate();
    const toKeypair = solanaWeb3.Keypair.generate();
    //create a transaction class
    const transaction = new solanaWeb3.Transaction();
    //this creates the transaction that is ready to be signed
    transaction.add(
        solanaWeb3.SystemProgram.transfer({
            fromPubkey: fromKeypair.publicKey,
            toPubkey: toKeypair,
            lamports: solanaWeb3.LAMPORTS_PER_SOL   
            //so we are basically sending one sol to the receiving user         
        })
    )

    //now what we need is to sign the transaction and send it over the network
    // You would want to sign a transation using a wallet than using the keypair

    let sign_keypair = fromKeypair;

    //define which solana network we are connecting to: mainnet-beta, devnet, testnet
    const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl("devnet"));
    
    //send the transaction, alert the user and also confirm it from the receiver user
    solanaWeb3.sendAndConfirmTransaction(connection, transaction, [sign_keypair])
    //this indicates that more than one wallets can sign a transaction

    //if we don't want to wait for the transaction to be confirmed by the user
}


//function for creating some space in the account
async function allocateSpaceInAccount() {
    const keypair = solanaWeb3.Keypair.generate();
    //someone needs to pay one SOL to confirm the transaction
    const payer = solanaWeb3.Keypair.generate();
    //create a connection with the devnet solana network
    const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'))
    //tokens issued on the devnet have NO value so it is no problem to lose them
    let airdropSignature = await connection.requestAirdrop(
        payer.publicKey,
        solanaWeb3.LAMPORTS_PER_SOL,
    );

    await connection.confirmTransaction(airdropSignature)
}