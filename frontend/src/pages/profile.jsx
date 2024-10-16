// Debashish Buragohain
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
// need to decrypt the info that we encrypted during authentication
import { decrypt, encrypt } from '../lib/crypt';

export default function Profile({ gun, user, pair }) {
    // just an additional check for this.. won't become true in general imaginable conditions
    const navigate = useNavigate();
    useEffect(() => {
        if (!user.is) {
            console.log('user not logged in.. redirecting back to authentication page.');
            navigate('/auth');
        }
    }, []);

    const alias = user.is.alias;
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    // this setBio is available only after 
    const [bio, setBio] = useState('');
    // also including the set bio option here
    const [inputBio, setInputBio] = useState('');

    const handleBioChange = (e) => {
        setInputBio(e.target.value);
    }

    // run only during the first render
    useEffect(() => {

        // !!-- this is not how the user space works
        // !!-- look into this Rahul
        
        const userProfile = gun.get('~' + user.is.pub).get('profile');
        userProfile.get('name').once(async nameSig => {
            const decryptedName = await decrypt(nameSig, pair);
            console.log('decrypted name: ', decryptedName);
            setName(decryptedName);
        });
        userProfile.get('email').on(async emailSig => {
            const decryptedEmail = await decrypt(emailSig, pair);
            console.log('decrypted email: ', decryptedEmail);
            setEmail(decryptedEmail);
        });
        userProfile.get('bio').once(async bioSig => {
            const decryptedBio = await decrypt(bioSig, pair);
            console.log('decrypted bio: ', decryptedBio);
            setBio(decryptedBio);
        });
        return () => {
            // turn off the event listeners inside the clean up function
            userProfile.get('name').off();
            userProfile.get('email').off();
            userProfile.get('bio').off();
        }
    }, []);

    // finally encrypt and save to the gun js database
    const saveBio = async () => {
        const encryptedBio = await encrypt(inputBio, pair);
        const userProfile = gun.get('~' + pair.pub).get('profile');
        userProfile.get('bio').put(encryptedBio);
        // make sure the bio is reflected in the page too
        setBio(inputBio);
    }

    const clearBio = () => {
        setBio('');
    }

    return (
        <div>
            <Navbar />
            <h1>Welcome to your profile {alias}</h1>
            <br />
            {name !== '' && <h3>Name: {name}</h3>}
            {email !== '' && <h3>Email: {email}</h3>}
            {bio !== '' ?
                <div>
                    <p style={{ display: 'inline-block', marginRight: '10px', textAlign: 'justify' }}>Bio: {bio}</p>
                    <button style={{ display: 'inline-block' }} onClick={clearBio}>Edit bio</button>
                </div>
                :
                <div>
                    <label htmlFor="bio">Wanna add a bio??</label><br /><br />
                    <textarea
                        id="bio"
                        value={inputBio}
                        onChange={handleBioChange}
                        rows={5}
                        cols={50}
                        style={{
                            backgroundColor: 'darkgray',
                            color: 'black',
                            padding: '10px',
                            borderRadius: '5px',
                            border: 'none',
                            marginBottom: '10px',
                            fontFamily: 'Arial, sans-serif',
                            fontSize: '16px'
                        }}
                    ></textarea>
                    <br />
                    <button onClick={saveBio}>Save Bio</button>
                </div>
            }
        </div>
    );
}