// the client for the helia lan discovery
// Debashish Buragohain

import { dagCbor } from "@helia/dag-cbor";
import { createHelia } from "helia";
import { lpStream } from "it-length-prefixed-stream";
import { CID } from "multiformats/cid";
import { PROTOCOL } from "./utils.js";


const helia = await createHelia();
const heliaDagCbor = dagCbor(helia);

helia.libp2p.addEventListener('peer:discovery', async event => {
    const remotePeerId = event.detail.id;
    console.log('client discovered server: %s', remotePeerId);

    // custom protocol handling
    //
    // 1. client opens stream to the server
    // 2. server sends CID to the client
    // 3. client responds with ACK message
    // 4. both ends close the stream
    helia.libp2p.dialProtocol(remotePeerId, PROTOCOL)
        .then(async stream => {
            // lpStream will prefix every message sent with the length and handle
            // reading the correct number of bytes from the remote        
            const lp = lpStream(stream);

            Promise.resolve()
                .then(async () => {
                    console.log('client reading CID');
                    const bytes = await lp.read();
                    // the remote sends the CID in bytes so we need to decode it
                    const cid = CID.decode(bytes);
                    console.log('client got CID data:', cid);
                    // sending the ack back to the frontend
                    console.log('client sending ACK');
                    await lp.write(new TextEncoder().encode('ACK'));
                    // close the stream after sending the ack
                    console.log('client close stream.');
                    await lp.unwrap().close();
                })
                .catch(err => {
                    console.error('client error:', err);
                    lp.unwrap().abort(err);
                })
                .finally(async () => {
                    console.log('client finished');
                    await helia.stop();
                    process.exit(0);
                });
        })
})