// page for displaying a single post
// Debashish Buragohain

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { onceHandler } from "../utility/gunHandlers";
import Navbar from "../components/Navbar";
import '../styles/post.css';

export default function Post({ gun, user, SEA }) {
    const location = useLocation();
    const { pathname } = location;
    const hash = pathname.replace('/post/', "");
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        gunFetch(hash);
    }, [hash]);


    async function gunFetch(searchHash) {
        try {
            const postNode = gun.get('#' + searchHash);
            const lengthNode = postNode.get({ '.': { '*': 'clength' } }).map();
            const creatorNode = postNode.get({ '.': { '*': 'creator' } }).map();
            const chunkLength = parseInt(await onceHandler(lengthNode));
            const creator = await onceHandler(creatorNode);
            console.log("retrieved chunk length:", chunkLength);
            console.log("retrieved creator: ", creator);
            let mergedImageArray = [];
            for (let i = 0; i < chunkLength; i++) {
                let chunkNode = postNode.get({ '.': { '*': `c${i}` } }).map();
                let chunkData = await onceHandler(chunkNode);
                mergedImageArray[i] = chunkData;
            }
            const mergedb64Img = mergedImageArray.join('');
            const mergedImageHash = await SEA.work(mergedb64Img, null, null, { name: "SHA-256" });
            if (mergedImageHash == searchHash) {
                console.log("Image hash verified.");
                // set the post to be displayed to the feed page now
                // setPosts([{
                //     img: mergedb64Img,
                //     creator: creator
                // }])
                // merge the current post with the posts already being displayed
                setPosts((prevPosts) => [... new Set([...prevPosts, {
                    img: mergedb64Img,
                    creator: creator,
                    hash: searchHash    // include the hash inside the post object for further navigation
                }])]);
            }
        }
        catch (err) {
            console.error("Error retrieving image: ", err.message);
        }
    }


    return (<>
        <Navbar></Navbar>
        <div className='post-gallery'>
            {posts.map((post, index) => (
                <div key={index} className='post-image-box'>
                    <img src={post.img} alt={`Image ${index}`}></img>
                    <p>
                        <b>Creator: </b>{post.creator}<br></br>
                        <b>Image hash: </b> {post.hash}
                    </p>
                </div>
            ))}
        </div>
    </>)
}