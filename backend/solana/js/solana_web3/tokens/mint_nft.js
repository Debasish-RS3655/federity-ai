//program to mint an NFT on solana
//Debashish Buragohain

const splToken = require('@solana/spl-token');
const web3 = require('@solana/web3.js');

(async () => {
    //create a new connection
    const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');
    //generate a new wallet
    const wallet = web3.Keypair.generate();
    //now finally create the mint
    const mint = await splToken.createMint(
        connection,
        wallet.publicKey,   //the minting authority
        wallet.publicKey,   //the freezing authority
        0                   //NFTs have 0 decimal place
        //if a token account has amount = 250 and the mint account has decimals = 2, that means 
        //the token account actually owns 2.50 of that token. 
    )

    //then we create an account to hold this token
    const associatedTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        mint,
        wallet.publicKey
    )

    //now we mint only one token into this account
    await splToken.mintTo(
        connection,
        wallet, //payer
        mint,   //the token id
        associatedTokenAccount.address, //the destination
        wallet, //minting authority
        1       //we are creating only one NFT       
    );


    //now we disable future minting
    let transaction = new web3.Transaction()
        .add(splToken.createSetAuthorityInstruction(
            mint,                   //the account i.e. the token id
            wallet.publicKey,       //the current authority
            splToken.AuthorityType.MintTokens,  //minted tokens authority type
            null                    //we make no one the authority
        ))

    await web3.sendAndConfirmTransaction(
        connection,
        transaction,
        [wallet]
    )


    //now finally display the tokens in supply
    const accountInfo = await splToken.getAccount(
        connection,
        associatedTokenAccount.address
    )

    console.log(accountInfo.amount);    //1

    const mintInfo = await splToken.getMint(
        connection,
        mint
    );

    console.log(mintInfo);
    /*
    address: "7KqpRwzkkeweW5jQoETyLzhvs9rcCj9dVQ1MnzudirsM",
    mintAuthority: "559u4Tdr9umKwft3yHMsnAxohhzkFnUBPAFtibwuZD9z",
    supply: 1,
    decimals: 0,
    isInitialized: true,
    freezeAuthority: "vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg"
    */
})()