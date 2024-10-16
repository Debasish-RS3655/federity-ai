//program to handle the wallets
//Debashish Buragohain

const solanaWeb3 = require("@solana/web3.js");
const fs = require("fs");

//the wallet class to create and retrieve a wallet
class Wallet {
    //creating a new wallet and airdrop a sol into the wallet
    static async generate(airdrop = true) {
        const keypair = solanaWeb3.Keypair.generate();
        const secret = keypair.secretKey
            .toString()
            .split(',')
            .map(value => Number(value));

        fs.writeFile('./datatbase/wallet.json', JSON.stringify(secret), 'utf8', function (err) {
            if (err) console.error("Error in saving keypair: ", err);
            else console.log("Wrote secret key to wallet.json");
        });

        if (airdrop) {
            //airdropping a SOL into this test wallet
            const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'));
            let airdropSignature = await connection.requestAirdrop(
                keypair.publicKey,
                solanaWeb3.LAMPORTS_PER_SOL
            );
            await connection.confirmTransaction({ signature: airdropSignature })
        }
    }

    //function to receive the wallet address
    static getWallet() {
        return solanaWeb3.Keypair
            .fromSecretKey(new Uint8Array(fs.readFileSync("./database/wallet.json", 'utf-8')))
    }

    //function to get the mint authority
    static getMintAuthority() {
        return solanaWeb3.Keypair
            .fromSecretKey(new Uint8Array(fs.readFileSync("./database/mintAuthority.json", 'utf-8')));
    }

    //function to get the freeze authority
    static getFreezeAuthority() {
        return solanaWeb3.Keypair
            .fromSecretKey(new Uint8Array(fs.readFileSync("./database/freezeAuthority.json", 'utf-8')));
    }

    //function to get the payer
    static getPayer() {
        return solanaWeb3.Keypair
            .fromSecretKey(new Uint8Array(fs.readFileSync("./database/payer.json", 'utf-8')));
    }
}

module.exports = Wallet;