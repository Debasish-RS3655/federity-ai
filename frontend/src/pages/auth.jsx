import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { encrypt } from '../lib/crypt';
import config from '../config';

// session storage contains the following fields
// user.alias
// user.tmp
// user.pub

const Auth = ({ gun, user, sessionStorage }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // additional properties required for the sign up stage
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [notification, setNotfication] = useState({ message: '', type: '' });

    useEffect(() => {
        // if the user is already logged in then directly jump to the feed page
        if (user.is) {
            navigate('/feed');
        }
    }, [])

    // defining the signin function here itself
    const signin = () => {
        // either take the provided login details or directly use the credentials saved in the sessionStorage
        const alias = username || sessionStorage.getItem('user.alias');
        const pass = password || sessionStorage.getItem('user.tmp');
        user.auth(alias, pass, function (at) {
            if (at.err) {
                setNotfication({
                    message: `Error logging in: ${at.err}`,
                    type: 'Error'
                });
                // if authentication fails we wont even be storing the user in the session
                // does not make any sense to clear it
                return;
            }

            if (at.put) {
                // store in the session storage now                
                sessionStorage.setItem('user.alias', at.put.alias);
                sessionStorage.setItem('user.tmp', pass);
                sessionStorage.setItem('user.pub', at.put.pub);
                console.log(sessionStorage.getItem('user.alias'));
                // setNotfication({
                //     message: `User logged in : ${at.put.alias}`,
                //     type: 'Notice'
                // });
                // navigate to the home page now
                navigate('/feed');
            }
        });
    }

    // auto sign in feature
    useEffect(() => {
        if (!user.is && sessionStorage.getItem('user.tmp')) {
            signin();
        }
    }, []);

    const handleNameChange = (e) => {
        setName(e.target.value);
    }

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    }

    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleToggleMode = () => {
        setIsSignUp(!isSignUp);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // if already displayed, React would not display the message itself
        setNotfication({
            message: 'Authenticating...',
            type: 'Notice'
        });
        // the sign up function
        if (isSignUp) {
            // invalid email detection
            let allowed;
            for (let i = 0; i < config.allowedEmailDomains.length; i++) {
                if (email.includes(config.allowedEmailDomains[i])) {
                    allowed = true;
                    break;
                }
            }
            if (!allowed) {
                return setNotfication({
                    message: `Entered email is invalid`,
                    type: 'Error'
                });
            }

            console.log('Creating user with Username:', username);
            user.create(username, password, function (ack) {
                if (ack.err) {
                    setNotfication({
                        message: `Error creating user: ${ack.err}`,
                        type: 'Error'
                    })
                }
                if (ack.pub) {
                    // maintain the username and the public key in the gun js database
                    // !!-- this part of the code is not necessary
                    // gun.get('users').get(username).put(gun.get('~@' + username));
                    console.log('Created new user:', ack.pub);
                    // the ack object contains only the public key and an ok variable
                    setNotfication({ message: '', type: '' });
                    // saved the session details of the newly created user here
                    sessionStorage.setItem('user.alias', username);
                    sessionStorage.setItem('user.tmp', password);
                    sessionStorage.setItem('user.pub', ack.pub);
                    // user authentication is necessary after the user creation
                    user.auth(username, password, async function (at) {
                        // add the private details of the user                        
                        const pair = at.sea;       // need all the set of keys for this operation                        
                        const encryptedName = await encrypt(name, pair);
                        const encryptedEmail = await encrypt(email, pair);
                        console.log('Encrypted name for upload:', encryptedName);
                        console.log('Encrypted email for upload:', encryptedEmail);
                        // finally store the encrypted email into the gun js database
                        const userProfile = gun.get('~' + ack.pub).get('profile');
                        userProfile.get('name').put(encryptedName);
                        userProfile.get('email').put(encryptedEmail);
                        console.log('User created and logged in:', user.is);
                        navigate('/feed');
                    });
                }
            });
        } else {
            console.log('Signing in with Username:', username);
            signin();
        }
    };

    return (
        <div>
            {notification.message && <div style={{ color: notification.type == 'Error' ? 'red' : 'whitesmoke' }}>{notification.message}</div>}
            <br /><br />
            <form onSubmit={handleSubmit}>
                {isSignUp &&
                    <div>
                        <label style={{ fontSize: '24px', color: 'white', marginBottom: '8px', display: 'block' }}>
                            Name:
                            <br />
                            <input
                                type="text"
                                value={name}
                                onChange={handleNameChange}
                                style={{
                                    padding: '10px',
                                    borderRadius: '5px',
                                    border: '1px solid white',
                                    backgroundColor: 'transparent',
                                    color: 'white',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </label>
                        <label style={{ fontSize: '24px', color: 'white', marginBottom: '8px', display: 'block' }}>
                            Email:
                            <br />
                            <input
                                type="text"
                                value={email}
                                onChange={handleEmailChange}
                                required
                                style={{
                                    padding: '10px',
                                    borderRadius: '5px',
                                    border: '1px solid white',
                                    backgroundColor: 'transparent',
                                    color: 'white',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </label>
                    </div>
                }
                <label style={{ fontSize: '24px', color: 'white', marginBottom: '8px', display: 'block' }}>
                    Username:
                    <br />
                    <input
                        type="text"
                        value={username}
                        onChange={handleUsernameChange}
                        required
                        style={{
                            padding: '10px',
                            borderRadius: '5px',
                            border: '1px solid white',
                            backgroundColor: 'transparent',
                            color: 'white',
                            width: '100%',
                            boxSizing: 'border-box',
                        }}
                    />
                </label>
                <br />
                <label style={{ fontSize: '24px', color: 'white', marginBottom: '8px', display: 'block' }}>
                    Password:
                    <br />
                    <input
                        type="text"
                        value={password}
                        onChange={handlePasswordChange}
                        required
                        style={{
                            padding: '10px',
                            borderRadius: '5px',
                            border: '1px solid white',
                            backgroundColor: 'transparent',
                            color: 'white',
                            width: '100%',
                            boxSizing: 'border-box',
                        }}
                    />
                </label>
                <br /><br />
                <button type="submit">{isSignUp ? 'Sign Up' : 'Sign In'}</button>
            </form>
            <br /><br />
            <p>
                {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}
                <button type="button" onClick={handleToggleMode}>
                    {isSignUp ? 'Go to sign in' : 'Go to sign up'}
                </button>
            </p>
        </div>
    );
};

export default Auth;
