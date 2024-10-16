//view all the tokens that we own
//Debashish Buragohain

const splToken = require('@solana/spl-token');
const web3 = require('@solana/web3.js');

(async () => {
    //create a connection to the devnet
    const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');
    //get the token account
    const tokenAccounts = await connection.getTokenAccountsByOwner(
        new web3.PublicKey('enter your public key here'), //8YLKoCu7NwqHNS8GzuvA2ibsvLrsg22YMfMDafxh1B15
        {
            programId: splToken.TOKEN_PROGRAM_ID
        }
    );

    //now display the fetched token accounts
    console.log("Token                                         Balance");
    console.log("------------------------------------------------------------")
    tokenAccounts.value.forEach(tokenAccount => {        
        const accountData = splToken.AccountLayout.decode(tokenAccount.account.data);
        //display the individual account data
        console.log(`${new web3.PublicKey(accountData.mint)}   ${accountData.amount}`)
    })
})


/*
Token                                         Balance
------------------------------------------------------------
7e2X5oeAAJyUTi4PfSGXFLGhyPw2H8oELm1mx87ZCgwF  84
AQoKYV7tYpTrFZN6P5oUufbQKAUr9mNYGe1TTJC9wajM  100
AQoKYV7tYpTrFZN6P5oUufbQKAUr9mNYGe1TTJC9wajM  0
AQoKYV7tYpTrFZN6P5oUufbQKAUr9mNYGe1TTJC9wajM  1
*/