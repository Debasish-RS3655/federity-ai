// code to send a solana transaction
// Debashish Buragohain

const web3 =require('@solana/web3.js');
const base58 = require('base58');

// chainstack rpc provider connection
// also including the ws endpoint for this thing
const connection = new web3.Connection("https://nd-457-658-763.p2pify.com/5e1d206b93b3eefad4b8b6e2393669f4", {
    wsEndpoint: "wss://ws-nd-457-658-763.p2pify.com"
});

// we are using a general text based private key for this thing
const privateKey = new Uint8Array(base58.decode(process.env.PRIVVATE_KEY));

// so we basically decoded the private key here
const account = web3.Keypair.fromSecretKey(privateKey);

// the recepient wallet address
const account2 = web3.Keypair.generate();

(async () => {
    const transaction = new web3.Transaction().add(
        web3.SystemProgram.transfer({
            fromPubkey: account.publicKey,
            toPubkey: account2.publicKey,
            lamports: web3.LAMPORTS_PER_SOL * 0.001
        })
    );

    const signature = await web3.sendAndConfirmTransaction(
        connection, 
        transaction,
        [account]      //need to sign the transaction by the sender so thats what we are doing
    )
})();