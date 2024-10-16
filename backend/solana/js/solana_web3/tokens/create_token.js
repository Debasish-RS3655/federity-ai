//program to create our own fungible token
//Debashish Buragohain

const splToken = require('@solana/spl-token');
const web3 = require('@solana/web3.js');

//the winner will be the payer of the solana token
//we are using the seed to generate the keypair
//const payer = web3.Keypair.fromSeed(config.wallet.seed)

const payer = web3.Keypair.generate();
const mintAuthority = web3.Keypair.generate();
const freezeAuthority = web3.Keypair.generate();

const connection = new web3.Connection(
    web3.clusterApiUrl('devnet'),
    'confirmed'
);

(async () => {
    //here mint is the unique ID of the token
    const mint = await splToken.createMint(
        connection,
        payer,
        mintAuthority.publicKey,
        freezeAuthority.publicKey,
        9
        //we are using 9 decimals to match the CLI decimal default exactly
    )

    //finally dispaly the unique identifier of the token that we just created
    console.log("Token ID: ", mint.toBase58());
    //AQoKYV7tYpTrFZN6P5oUufbQKAUr9mNYGe1TTJC9wajM

    //now these tokens don't have any supply
    //show the supply of the newly created tokens
    const mintInfo = await splToken.getMint(
        connection,
        mint        //the token id
    )

    //display the supply of the token
    console.log("Token supply: ", mintInfo.supply)
    //0


    //----------------------------------------------------------------------------------
    //minting some coins into an account


    //first creating an account to hold a balance of the new token
    const tokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        payer.publicKey
    )

    //display the newly created or fetched token account address
    console.log(tokenAccount.address.toBase58());
    // 7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi
    //this is a newly created empty account now

    //get the complete account details
    const tokenAccountInfo = await splToken.getAccount(
        connection,
        tokenAccount.address
    )

    console.log(tokenAccountInfo.amount)    //0 balance in this account

    //now minting 100 tokens into this account
    await splToken.mintTo(
        connection,
        payer,
        mint,
        tokenAccount.address,    //where are we storing the minted tokens
        mintAuthority,
        //100000000000           //decimals are set to 9 so we add 9 zeros after the mint amount        
        formatDecimals(100)
    )

    function formatDecimals(amount = 0, decimals = 9) {
        //add the necessary number of 0s after the token amount
        let decimalString = ""
        for (let m = 0; m < decimals; m++) decimalString += "0"
        return parseInt(String(amount) + decimalString)
    }

    //check if the token supply and the account balance reflect the result of the minting
    const mintedInfo = await getMint(
        connection,
        mint    //token id
    )
    console.log(mintedInfo.supply)  //100
    
    //get the information of the account where 
    const tokenAccountInfomration = await getAccount(
        connection,
        tokenAccount.address
    )    
    console.log(tokenAccountInfomration.amount);    //100
})();
