//the token manager for our token program
//Debashish Buragohain

const solanaWeb3 = require("@solana/web3.js");
const splToken = require("@solana/spl-token");     //the token manager program

const Wallet = require("./wallet/wallet");
const config = require("./config.json");
const wallet = Wallet.getWallet();                  //get the current wallet
const RPC = solanaWeb3.clusterApiUrl('devnet');

//create the connection to the solana cluster
const connection = new solanaWeb3.Connection(RPC);
//the payer should be both the mint authority and the freeze authority
class token {
    //create a new Solana token
    static async createToken() {
        try {
            const mint = await splToken.createMint(
                connection,
                Wallet.getPayer(),
                Wallet.getMintAuthority().publicKey,
                Wallet.getFreezeAuthority().publicKey,
                config.token_decimals
            )

            console.log('Success!!\nCreated token with id: ', mint.toBase58());
            //e.g. AQoKYV7tYpTrFZN6P5oUufbQKAUr9mNYGe1TTJC9wajM
            
            const mintInfo = await splToken.getMint()
        }
        catch (err) {
            console.error("Error in creating token: ", err.message);
        }
    }
}



