// custom protocol applied to mDNS 
// mDNS is already enabled by default for discovery
// Debashish Buragohain

// each node starts up and broadcasts their presence using mDNS (enabled by default)
// when the client node discovers the server, it will open a protocol stream to the server
// the server node will send the CID the server node is providing to the client
// the client node will request for the content for that CID via heliaDagBor.get(CID.parse(msg))
// once the content is received the client will send an ACK message to the server and close the stream
// the server node will receive the ACK message and close the stream
// the server and the client will both shut down
// (both scripts should run in any order)

/* 
no WAN functionality is enabled, so only nodes in the local network can help with peer discovery, and only nodes
on the local network can be discovered. For connecting nodes outside of WAN, we'll need to connect to a bootstrap
node and add the kadDHT service for random connection approaches


See if you can get ping/pong messages working without the nodes shutting down
Run the server node from one computer on your local network, and the client node from another computer on your local network
Try removing the shutdown code from the scripts, and see if you can get multiple clients to connect
See if you can get the server to respond with a list of CIDs in it's blockstore, and have the client choose which one to request
See if you can connect to bootstrap nodes with one of your nodes, and use the other node as a LAN only node.
*/
import { dagCbor } from '@helia/dag-cbor';
import { createHelia } from 'helia';
import { lpStream } from 'it-length-prefixed-stream';
import { PROTOCOL } from './utils.js';

const helia = await createHelia();
const heliaDagCbor = dagCbor(helia);

// test JSON string
const str = `${new Date().toLocaleString()}: My test string that you only know if I send you the CID for it`;
// this is how we add and create the cid for cbor files
const cid = await heliaDagCbor.add(str);
const cidString = cid.toString();

console.log('CID: %s', cidString);

// handle the custom protocol --> expected interaction is:
//
// 1. client opens stream to server
// 2. server sends CID to client
// 3. client responds with ACK message
// 4. both ends close the stream
helia.libp2p.handle(PROTOCOL, ({ stream }) => {
    // lpStream will prefix every message send with the length and handle
    // reading the correct number of butes from the remote

    // open the stream for reading and writing
    const lp = lpStream(stream);
    console.log('server on. Waiting for connection.');

    Promise.resolve().then(async () => {
        console.log('server sending CID');
        // send the cid in binary form
        await lp.write(cid.bytes);
        console.log('server waiting for client ACK');
        // wait and read the ack sent by the client in binary
        const ack = await lp.read();
        console.info('server received:', new TextDecoder().decode(ack.subarray()));
        // after receiving the ack we close the stream with the client
        console.log('server close stream.');
        await lp.unwrap().close();
    })
    .catch(err => {
        console.error('server error:', err);
        // errorly closing the stream
        lp.unwrap().abort(err);
    })
    .finally(async () => {
        console.log('server finished.');
        await helia.stop();
        process.exit(0);
    });
})