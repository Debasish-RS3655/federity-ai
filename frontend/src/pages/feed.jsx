import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import "../styles/feed.css";
import { onceHandler } from '../utility/gunHandlers';

export default function Feed({ gun, user }) {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);

    // this needs to run as soon as the user is logged in
    useEffect(() => {
        if (!user.is) {
            navigate('/auth');
        }

        // !-- totally experimental 
        // !-- using the RAW image without chunking and any security operations            
        // get the uploaded images in the first render itself
        // gun.get('raw').map().once((post) => {
        //     setPosts((prevPosts) => [... new Set([...prevPosts, post])]);
        // });

        // all the uploaded images are updated and displayed automatically here
        gun.get('uploads').map().once(searchHash => gunFetch(searchHash));

        // devised the gun fetch as a function itself
        async function gunFetch(searchHash = "MC2evDgzCJKECLOiX8pgt6CJnw0W7wjAGqEA+abs5GE=") {
            // list of successfully uploaded images
            // krisha image: SQMGguJa3eE/36g+KBLDniqhdy1vsSL7FhedIAc16jI=
            // screenshot image: q/fqai8SUprB3Ds+2F8zTNYEgTMHyxhy0uCEZlv3lJ8= 
            // profile image: IIG2gtY0sUR3/hE6+7R51uxig+gx5QrOMjNqUcKabeU=
            // blue rovier image: AxNFQqN7gq6w130olcKrzV51YTQjikLxZF1HoNjtCgk=
            // eve:  8HxHqZETNDByo7N52muZS6HZsngEiVzKAYUbELzZmNs=
            // radha krishna: EjevENSFK+W65FmO6oK4C8KIjKkDWmCrmSWPKY47bGk=
            // wall cladding: ciyWe1lxlXEie/HWJDonTkkWZ1gUa09pzHb0DTxlUDk=
            // radha krishna 2: SGpBJYB398FBw1xqpXtJpTWSPUPPkGnLvX7RZ7cD6MM=
            // radha krishna 3: 9RB9pWSl78RLuS0+ulxjfW6p2QWOOJGJqxRmYcGs2mQ=
            // vishnu: MC2evDgzCJKECLOiX8pgt6CJnw0W7wjAGqEA+abs5GE=
            // baymax: GM6XaroXLHh8GXEp+i/MT85PBRlIz3etxuS8ksdz+iw=
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
    }, [user.is]);

    function postNavigate(postHash) {
        console.log("lets navigate to " + postHash);
        navigate('/post/' + postHash)
    }
    return (
        <>
            <Navbar />
            {user.is.alias && <h1>Feed of {user.is.alias}</h1>}
            <div className='feed-gallery'>
                {posts.length == 0 && <h3>You don't have any items in your feed. Upload to view them here.</h3>}            
                {posts.map((post, index) => (
                    <div key={index} className='image-box' onClick={() => postNavigate(post.hash)}>
                        <img src={post.img} alt={`Image ${index}`}></img>
                        <p>{post.creator}</p>
                    </div>
                ))}
            </div>
        </>
    )
}