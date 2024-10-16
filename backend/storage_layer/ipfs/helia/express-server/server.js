// ipfs server with node js
// Debashish Buragohain

const express = require('express');
const multer = require('multer');
const app = express();
const upload = multer();       // first endpoint
app.use(express.json());       // second endpoint

// hashmap for relating the filename to the cid
let hashMap = new Map();
async function createNode() {
    const initIime = Date.now();
    console.log("Creating IPFS node....");
    const { createHelia } = await import('helia');
    const { unixfs } = await import('@helia/unixfs');
    try {
        const helia = await createHelia();
        const fs = unixfs(helia);
        console.log("Created IPFS node in", Date.now() - initIime, 'ms.');
        return fs;
    }
    catch (err) {
        throw new Error(err.message);
    }
}

createNode()
    .then(fs => serverStart(fs))
    .catch(err => console.error("Error creating IPFS node:", err.message));

async function serverStart(fs) {
    // fs is the unix file system instance that we just defined above
    app.post('/upload', upload.single('file'), async (req, res) => {
        const data = req.file.buffer;
        const cid = await fs.addBytes(data);
        hashMap.set(req.file.originalname, cid);
        res.status(200).send('file uploaded.');
    });
    app.get('/fetch', async (req, res) => {
        // well be sending the filename in the body
        const filename = req.body.filename;
        const cid = hashMap(filename);
        // if the hash id does not exists
        if (!cid) {
            res.status(404).send('could not find the file.');
        }
        let text;
        const decoder = new TextDecoder();
        for await (const chunks of fs.cat(cid)) {
            text = decoder.decode(chunks, { stream: true });
        }
        res.status(200).send(text);
    })


    app.listen(3000, () => {
        console.log('IPFS api endpoint listening.')
    })
}