import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import cWorker from '../workers/chunk.worker';
import hWorker from '../workers/hash.worker';
import WebWorker from '../workers/WebWorker';
import { onceHandler, putHandler } from '../utility/gunHandlers';
// for the react native app we use the createHash function of the crypto module
// for the frontend we use the web crypto api
// import { createHash } from 'crypto';

export default function Create({ gun, user, SEA }) {
    const navigate = useNavigate();
    useEffect(() => {
        if (!user.is) {
            console.log('user not logged in.. redirecting back to authentication page.');
            navigate('/auth');
        }
    }, []);

    const [notice, setNotice] = useState('');
    // initialize and store the chunk worker inside a state hook
    const [chunkWorker, setChunkWorker] = useState(null);
    const [hashWorker, setHashWorker] = useState(null);
    const [hashWorker2, setHashWorker2] = useState(null);
    // the chunk array and the hashed chunk array
    const [imgChunk, setChunks] = useState([]);
    const [imgHashArray1, setImgHashArray1] = useState([]);
    const [imgHashArray2, setImgHashArray2] = useState([]);
    // selectedImg is stored in base64 encoded form
    const [selectedImg, setSelectedImg] = useState('');
    const [imgSize, setImgSize] = useState(null);
    // we create the hash of the image now
    const [imgHash, setImgHash] = useState(null);

    // const [chunkKeys, setChunkKeys] = useState([]);

    // initialize the web worker at the initial rendering of the page
    useEffect(() => {
        const cw = new WebWorker(cWorker);
        const hw = new WebWorker(hWorker);
        const hw2 = new WebWorker(hWorker);
        // event listener for receiving messages from the worker
        // two wokers for the hashing function
        cw.addEventListener('message', chunkWorkerHandler);
        hw.addEventListener('message', hashWorkerHandler);
        hw2.addEventListener('message', hashWorkerHandler);
        // save the worker instance to a state
        setChunkWorker(cw);
        setHashWorker(hw);
        setHashWorker2(hw2);
        return () => {
            // terminate the worker as a clean up function
            setChunkWorker(null);
            setHashWorker(null);
            setHashWorker2(null);
            cw.terminate();
            hw.terminate();
            hw2.terminate();
        }
    }, []);

    // we hash the image as soon as it is uploaded
    // and do not wait for the submit button to be pressed
    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {

            // !!-- underneath is the code for the react native
            // to create a hash of the uploaded image
            // first convert the binary image into an array buffer
            // const imgUint8Array = new Uint8Array(binaryImg.length);
            // for (let i = 0; i < binaryImg.length; i++)
            //     imgUint8Array[i] = binaryImg.charCodeAt(i) & 0xff;
            // const imgBuffer = imgUint8Array.buffer;
            // const hashSum = crypto.createHash('sha256');
            // hashSum.update(imgBuffer);            
            // // update the image hash state
            // !-- also encode the hash into the base64 format and not in the hex format
            // setImgHash(hashSum.digest('hex'));

            const base64Reader = new FileReader();
            // first read as data URL for the base64 encoding
            base64Reader.onload = async () => {
                // we set the base64 encoded image as the URL for displaying in the UI
                setSelectedImg(base64Reader.result);
                // remove the data:image/*;base64, prefix
                const withoutPrefix = base64Reader.result.split(',')[1];
                // !!-- react native code for the image size calculation
                // const binaryImg = Buffer.from(withoutPrefix, 'base64');
                // !!-- client side code for image size calculation
                const binaryImg = atob(withoutPrefix);
                const sizeBytes = binaryImg.length;
                // save to state for displaying the image size into the UI                
                setImgSize(sizeBytes);
                // need to calculate the hash inside this block itself
                const iHash = await SEA.work(base64Reader.result, null, null, { name: 'SHA-256' });
                console.log("selected image hash: ", iHash);
                setImgHash(iHash);
            }
            base64Reader.readAsDataURL(file);
        }
    }

    // once we click upload it sends the image to the worker to divide it into chunks
    const handleUpload = () => {
        if (selectedImg) {
            // send the image and the number of divisions to the worker
            chunkWorker.postMessage({
                image: selectedImg,                                     // the base64 encoded image
                noNodes: Math.ceil(imgSize / config.nodeByteSize)       // the number of divisions for that image
            });
        }
        else {
            console.error('No image selected for uploading.');
        }
    }

    // event handler for the chunk worker brought down here to make the code cleaner
    async function chunkWorkerHandler(e) {
        // then we set the chunks to be sent to the hasher worker
        setChunks(e.data);
    }

    useEffect(() => {
        // wait for the hash worker to be actually loaded and not changed values due to renders
        if (hashWorker !== null && hashWorker2 !== null) {
            // before sending this clear the hash array of the previous operations
            setImgHashArray1([]);
            setImgHashArray2([]);
            // divide the image into equal parts now
            let mid = imgChunk.length / 2;
            hashWorker.postMessage({
                worker: 1,      // also need to send the worker number for the organized working
                chunks: imgChunk.slice(0, mid)
            })
            hashWorker2.postMessage({
                worker: 2,
                chunks: imgChunk.slice(mid, imgChunk.length)
            })
        }
    }, [imgChunk]);

    // even the workers responded variable needs to be a state inside react
    // all the hash workers this one listener only
    function hashWorkerHandler(e) {
        const { hashedArray, worker } = e.data;
        // the worker number
        switch (worker) {
            case 1:
                setImgHashArray1(hashedArray);
                break;
            case 2:
                setImgHashArray2(hashedArray);
                break;
        }
    }

    // the upload part is handled inside an use effect when all the hashes are received
    useEffect(() => {
        if (imgHashArray1.length + imgHashArray2.length == imgChunk.length && imgHashArray1.length !== 0) {
            const hashedArray = imgHashArray1.concat(imgHashArray2);
            setImgHashArray1([]);               // no need to maintain in the states once we have the complete array
            setImgHashArray2([]);
            const postNode = gun.get('#' + imgHash);
            hashedArray.forEach(async (hash, index) => {
                const chunkNode = postNode.get(`c${index}#${hash}`);
                try {
                    await putHandler(chunkNode, imgChunk[index]);
                    console.log("uploaded chunk: ", index);
                    // atlast upload the creator and the chunk length
                    if (index == hashedArray.length - 1) {
                        const chunkLength = String(imgChunk.length);
                        console.log("chunk length: ", chunkLength);
                        const lengthHash = await SEA.work(chunkLength, null, null, { name: "SHA-256" });
                        const lengthNode = postNode.get('clength#' + lengthHash);
                        await putHandler(lengthNode, chunkLength);
                        // verifying the uploaded length
                        const searchLengthNode = postNode.get({ '.': { '*': 'clength' } }).map();
                        const searchedLength = await onceHandler(searchLengthNode);
                        console.log('uploaded chunk length: ', searchedLength);
                        // const creator = user.is.pub;
                        // !!-- experimental version, uploading the alias instead of the public key 
                        const creator = user.is.alias;
                        const creatorHash = await SEA.work(creator, null, null, { name: "SHA-256" });
                        const creatorNode = postNode.get('creator#' + creatorHash);
                        await putHandler(creatorNode, creator);
                        // verifying the uploaded creator
                        const searchCreatorNode = postNode.get({ '.': { '*': 'creator' } }).map();
                        const searchedCreator = await onceHandler(searchCreatorNode);
                        console.log("uploaded creator: ", searchedCreator);
                        setNotice(`Uploaded entire image with creator: ${searchedCreator} and chunks: ${searchedLength}`);
                        
                        // !!-- may not be applied to the actual prgram
                        // after upload write the hash of the uploaded image as a set to the gun js database so that it is auto fetched from the feed page
                        gun.get('uploads').set(imgHash);
                    }
                }
                catch (err) {
                    if (err.message.includes(`Failed to execute 'setItem' on 'Storage'`)) {
                        // this error means that the local storage is full now... clear everything at once
                        localStorage.clear();
                        // have to do something about this later... for now lets keep it like this only          
                        setNotice('Local storage error. Please logout and try again.')
                    }
                    else setNotice('Error uploading image.');
                    return console.error(err.message);
                }
            });
        }
    }, [imgHashArray1, imgHashArray2]);


    // totally for presentation purposes only
    // !! uploads the raw image directly as a set skipping all the chunkers and hashers
    const handleUncompressedUpload = () => {
        if (!selectedImg) return console.error("No image selected for uncompressed upload.");
        gun.get('raw').set({
            creator: user.is.alias,
            img: selectedImg
        }, function (ack) {
            if (ack.err) return console.error('Error in raw image upload:', ack.err);
            console.log('RAW image uploaded successfully.');
            setSelectedImg('');
            setImgSize(null);
            setImgHash(null);
            setNotice("Raw image successfully uploaded.");
        });
    }

    return (
        <>
            <Navbar />
            {user.is.alias && <h1>Welcome {user.is.alias} </h1>}
            <h2>Choose your NFTs to mint</h2>
            <br />
            <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                id="fileInput"
            />
            <label htmlFor="fileInput" style={{ cursor: 'pointer', padding: '10px 15px', backgroundColor: '#5b60c1aa', color: 'white', borderRadius: '5px' }}>
                Choose Image
            </label>
            <button onClick={handleUpload} style={{ marginLeft: '10px', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                Upload Image
            </button>
            <button onClick={handleUncompressedUpload} style={{ marginLeft: '10px', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                Upload Uncompressed
            </button>
            <br />
            {
                imgSize &&
                <div>
                    <h4>Image size: {(imgSize / 1024).toFixed(2)} KB</h4>
                </div>
            }
            {
                imgHash &&
                <div>
                    <h4>Image hash: {imgHash}</h4>
                </div>
            }
            {selectedImg &&
                <div>
                    <h2>Preview</h2>
                    <img src={selectedImg}
                        alt='selected'
                        style={{ maxWidth: '100%', maxHeight: '500px' }}
                    ></img>
                </div>
            }
            {
                imgChunk.length !== 0 &&
                <div>Divided image into {imgChunk.length} chunks</div>
            }
            {
                notice &&
                <h2>{notice}</h2>
            }
        </>
    )
}