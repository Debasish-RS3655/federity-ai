// a stake account creation
// Debashish Buragohain

const solanaWeb3 = require('@solana/web3.js');
const base58 = require("base58");

const connection = new solanaWeb3.Connection("https://nd-457-658-763.p2pify.com/5e1d206b93b3eefad4b8b6e2393669f4", {
    wsEndpoint: "wss://ws-nd-457-658-763.p2pify.com"
});

// creating a stake account here
const stakeAccount = solanaWeb3.Keypair.generate();


const privateKey = new Uint8Array(base58.decode(process.env.PRIVVATE_KEY));
// so we basically decoded the private key here
const walletKeyPair = solanaWeb3.Keypair.fromSecretKey(privateKey);

async function stake() {
    let createStakeAccountInstruction = solanaWeb3.StakeProgram.createAccount({
        fromPubkey: walletKeyPair.publicKey,
        stakePubkey: stakeAccount.publicKey,
        authorized: new solanaWeb3.Authorized(walletKeyPair.publicKey, walletKeyPair.publicKey),
        lamports: solanaWeb3.LAMPORTS_PER_SOL * 0.02
    })

    let createStakeAccountTransaction = new solanaWeb3.Transaction().add(createStakeAccountInstruction);
    createStakeAccountTransaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    createStakeAccountTransaction.feePayer = walletKeyPair.publicKey;

    // confirm the transaction of creating the stake account
    createStakeAccountTransaction = await solanaWeb3.sendAndConfirmTransaction(
        connection,
        createStakeAccountTransaction,
        [walletKeyPair, stakeAccount]
    );


    //defining the public key of the delegator that we are validating to    
    // get the public key of the selected validator
    const votePubKey = new solanaWeb3.PublicKey(`public key of the validator`);
    let delegateInstruction = solanaWeb3.StakeProgram.delegate({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: walletKeyPair.publicKey,
        votePubKey  
    })

    let delegateTransaction = new solanaWeb3.Transaction().add(delegateInstruction);
    delegateTransaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    delegateTransaction.feePayer = walletKeyPair.publicKey, // we pay the fee if we are the one who is staking the solana right
    delegateTransaction.sign(walletKeyPair);        //sign the deletgate transaction

    //finally send and confirm the transaction now
    delegateTransaction = new solanaWeb3.sendAndConfirmTransaction(
        connection,
        delegateTransaction,
        [walletKeyPair]
    )
}


stake();