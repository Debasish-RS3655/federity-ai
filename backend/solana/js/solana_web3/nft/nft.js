//NodeJS code to upload an NFT Solana token on a locally hosted Solana RPC
//Debashish Buragohain

const solanaWeb3 = require("@solana/web3.js");
const Metaplex = require("@metaplex-foundation/js");
const Wallet = require("./wallet/wallet.js");
const fs = require('fs');

//get the current wallet
const wallet = Wallet.getWallet();

//for testing purposes, use our self hosted RPC
const RPC = solanaWeb3.clusterApiUrl('devnet')
const connection = new solanaWeb3.Connection(RPC);

//creating the metaplex instance
const metaplex = Metaplex
    .make(connection)
    .use(Metaplex.keypairIdentity(wallet))
    //.use(Metaplex.mockStorage())
    //.use(Metaplex.bundlrStorage())
    .use(Metaplex.bundlrStorage({
        address: 'https://devnet.bundlr.network',           //default devnet network
        //providerUrl: 'https://api.devnet.solana.com',     //rpc provider is set to the default devnet network only
        //replace this with our local rpc solana url
        providerUrl: 'http://127.0.0.1:8899',
        timeout: 60000,
    }))

//the NFT config object
const default_config = {
    uploadPath: 'uploads/',
    imgFileName: 'image.png',
    imgType: 'image/png',
    imgName: 'MY asset',
    description: 'My first asset to be uploaded on the blockchain!',
    attributes: [
        { trait_type: 'any trait that you want to give', value: 'some value that you want' },
        { trait_type: 'e.g. Type', value: 'e.g. basic' },
        { trait_type: 'e.g. Background', value: 'e.g. white' }
    ],
    //the royalties shared by the creators in basis points i.e. 550 means 5.5%
    sellerFeeBasisPoints: 500,      //500 bp = 5%
    symbol: 'ASSET_',
    //creators: an array of creators and their share of the royalties
    //the creator array is limited to 5 creators
    creators: [
        { address: wallet.publicKey, share: 100 }
    ]
};

//create an NFT class for creating on in the Solana environment
class NFT {
    //the one and all function to create the NFT
    static create(config = default_config) {
        this.uploadImage(config)
            .then(a => this.uploadMetaData(a))
            .then(a => this.mintNFT(a))
            .catch(err => console.error("Error creating NFT: ", err))
    }

    //uploading the image to the bundlr network
    static async uploadImage(nftConfig = {}) {
        const imgBuffer = fs.readFileSync(nftConfig.uploadPath + nftConfig.imgFileName);
        const imgMetaplexFile = metaplex.toMetaplexFile(imgBuffer, nftConfig.imgFileName);
        //finally upload the image to the storage, we are currently using bundlr as the storage provider
        const imgUri = await metaplex.storage().upload(imgMetaplexFile);
        console.log("Image URI: ", imgUri);
        return { imgUri, nftConfig };      //https://arweave.net/123
    }

    //when creating or updating an NFT, we will need a URI pointing to some JSON Metadata
    //describing the NFT. We can do this on-chain or off-chain
    //where the metadata will be stored will depend upon the selected storage driver
    static async uploadMetaData(imgUri = "", nftConfig = {}) {
        //https://arweave.net/756
        const { metadatauri } = await metaplex
            .nfts()
            .uploadMetadata({
                name: nftConfig.imgName,
                description: nftConfig.description,
                image: imgUri,          //https://arweave.net/123
                attributes: nftConfig.attributes,
                properties: {
                    files: [
                        {
                            type: nftConfig.imgType,
                            uri: imgUri
                        }
                    ]
                }
            });
        console.log("Metadata URI: ", metadatauri);
        return { metadatauri, nftConfig }
    }

    //function to finally mint the NFT, requiring the metadata string as an argument
    static async mintNFT(metadatauri = "", nftConfig = {}) {
        const { nft } = await metaplex
            .nfts()
            .create({
                uri: metadatauri,
                name: nftConfig.name,
                sellerFeeBasisPoints: nftConfig.sellerFeeBasisPoints,
                symbol: nftConfig.symbol,
                creators: nftConfig.creators,
                isMutable: false,
                //by default, future minting of the NFT is disabled
                //maxSupply: toBigNumber(0)
            })
        //so we can actually mint the tokens in the devnet
        console.log("Success!🎉");
        console.log(`Minted NFT: https://explorer.solana.com/address/${nft.address}?cluster=devnet`)
        console.log("NFT details: ", JSON.stringify(nft));
    }
}

//finally export our NFT class
module.exports = NFT;