//A token account resides inside a user's wallet

//program to send tokens to other users
//Debashish Buragohain

const web3 = require('@solana/web3.js');
const splToken = require('@solana/spl-token');

//we consider the mint token id that we created in the create tokens program
(async mint => {
    //connect to the cluster
    const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');

    //the sender will airdrop SOL
    //airdropping means allocating space in our account on Solana
    //or requesting lamports to be stored in our Solana wallet
    const fromWallet = web3.Keypair.generate();
    //because we need some solana to perform transactions, we create a fake money in this way
    const fromAirdopSignature = await connection.requestAirdrop(
        fromWallet.publicKey,
        web3.LAMPORTS_PER_SOL);

    //wait for the airdrop confirmation
    await connection.confirmTransaction({ signature: fromAirdopSignature });

    //the receiver's wallet
    //generate a new wallet to receive newly minted token
    const toWallet = web3.Keypair.generate();

    //create a new token mint
    const mint = await splToken.createMint(
        connection, 
        fromWallet,             //the payer
        fromWallet.publicKey,   //the mint authority
        null,   //the freeze authority
        9   //the decimals
    )

    //get the token address of the fromWallet address, and if it does not exist, create it
    const fromTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,             //the payer if a new token address is to be created
        mint,                   //the token id of the mint
        fromWallet.publicKey,   //the owner of the tokens i.e. the wallet holder's address
    )

    //get the token account for the receiver wallet, create new if it does not exist
    const toTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
        connection, 
        fromWallet,     //surely the sender is the payer of the gas fees right?
        mint,           //the token id of our token
        toWallet.publicKey //the owner of this token address
    )

    //mint 1 new token to the from wallet address
    let signature = await splToken.mintTo(
        connection,
        fromWallet,                 //the payer for the minting
        mint,                       //the mint token id
        fromTokenAccount.address,   //the token address where we are going to mint the token
        fromWallet.publicKey,       //the minting authority   
        1000000000
    )
    console.log('mint tx: ', signature);

    //transfer this new token to the receiver's account that we created
    signature = await splToken.transfer(
        connection,     //the connection to use
        fromWallet,     //payer of the transaction fees
        fromTokenAccount.address,    //the sender's token address
        toTokenAccount.address,      //the receiver's token address
        fromWallet.publicKey,        //the owner of the token address i.e. the sender's wallet address
        1                            //the amount of tokens to be transferred
    )
    
    //transfer the token while paying for the creation of the receiver token address
    signature = await splToken.transfer(
        connection,
        toWallet,                   //idk why the receiver is the payer of the transaction fees
        fromTokenAccount.address,   //the source account
        toTokenAccount.address,     //the receiver account
        fromWallet.publicKey,       //the owner of the token address
        1,                          //the amount of the tokens to transfer
        [fromWallet, toWallet]      //multiple signers
    )

})();