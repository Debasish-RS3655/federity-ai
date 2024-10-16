//sending our minted solana tokens to a specific recipient token account
//the recipient token account must already exist and be of the same Token type


//maybe we are minting the tokens to someone else's address and then that person is
//sending the tokens back to us

//Debashish Buragohain

const web3 = require('@solana/web3.js');
const splToken = require('@solana/spl-token');

(async () => {
    const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');
    //sender wallet 
    const wallet = web3.Keypair.generate();
    const auxiliaryKeypair = web3.Keypair.generate();

    //request an allocation of lamports to the specified wallet address
    const airdropSignature = await connection.requestAirdrop(
        wallet.publicKey,
        web3.LAMPORTS_PER_SOL
    )

    //finalize and confirm and put the SOLs into our account
    await connection.confirmTransaction({ signature: airdropSignature });

    //create the token here
    const mint = await splToken.createMint(
        connection,
        wallet,     //the sender's waller is the payer of the new token minting
        wallet.publicKey,   //the mint authority
        wallet.publicKey,   //the freeze authority
        9,                  //decimals
    )

    //create a custom token account
    const auxiliaryTokenAccount = await splToken.createAccount(
        connection,
        wallet,     //the sender is always the payer
        mint,       //the minted token id
        wallet.publicKey,        //the owner of the wallet where we are creating the token account        
    )

    //create a token account for storing our tokens
    //associatedTokenAccount stores the ID of the account just created
    //this account is owned by us though
    const associatedTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        wallet, //payer
        mint,   //token id
        wallet.publicKey,   //the wallet owner
        auxiliaryKeypair    //allow owner off curve
    )

    await splToken.mintTo(
        connection,
        wallet,
        mint,
        associatedTokenAccount.address, //where the tokens will be minted
        wallet,     //the authority (this will be us)
        50          //the amount to be minted
    )

    //get the complete details of the account that store 
    const accountInfo = await splToken.getAccount(connection, associatedTokenAccount.address)
    console.log(accountInfo.amount);    //50

    await splToken.transfer(
        connection,
        wallet,     //the transaction fee payer
        associatedTokenAccount.address,  //the sender's token address
        auxiliaryTokenAccount,           //the receiver's token adress
        //wallet.publicKey 
        wallet,  //this is the owner of the source account
        50       //the amount to be transferred
    );

    //get the token account information
    const auxAccountInfo = await splToken.getAccount(connection, auxiliaryTokenAccount);
    console.log(auxAccountInfo.amount)      //50
})();