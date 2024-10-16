// CADE 
// version alpha:0.0.3
// Debashish Buragohain

import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Gun from 'gun';
import 'gun/sea';
import { useEffect, useState } from 'react';
import './App.css';
import Auth from './pages/auth';
import Feed from './pages/feed';
import Create from './pages/create';
import Home from './pages/home';
import Post from './pages/post';
import Profile from './pages/profile';
import Logout from './components/logout';
import Header from './components/Header';
import config from './config';

function App() {
  localStorage.clear();
  const [gun] = useState(Gun({
    peers: [config.defaultPeer],
    // peers: [window.location.origin + '/gun'],
    // defaulting to the radisk storage even in the browser
    radisk: true
  }));

  // user instance from the gun
  const [user] = useState(gun.user());
  // need to store the private keys of the user after authentication for decryption in the other components
  const [userPairs, setPairs] = useState(null);
  // event listeners only during the initial render
  useEffect(() => {
    gun.on('auth', (at) => {
      console.log('authentication was successful');
      console.log('Logged in:', sessionStorage.getItem('user.alias'));
      // store the key pairs after a successful authentication
      setPairs(at.sea);
      console.log('User logged in: ', user.is.pub);
    })

    return () => {
      gun.off();
    }
  }, []);

  return (
    <>
      <Header></Header>
      <Router>
        <Logout user={user} sessionStorage={sessionStorage} />
        <Routes>
          {/* we pass the gun and user instances directly as a parameter */}
          <Route path='/' element={<Home user={user} />}></Route>
          <Route path='/auth' element={<Auth gun={gun} user={user} sessionStorage={sessionStorage} />}></Route>
          {userPairs &&
            (<>
              <Route path='/post/*' element={<Post gun={gun} user={user} SEA={Gun.SEA} />}></Route>
              <Route path='/profile' element={<Profile gun={gun} user={user} pair={userPairs}></Profile>}></Route>
              <Route path='/feed' element={<Feed gun={gun} user={user} />}></Route>
              <Route path='/create' element={<Create gun={gun} user={user} SEA={Gun.SEA} />}></Route>
            </>)}
          {/* catch any unknown routes and route them back to the auth page */}
          <Route path='*' element={<Navigate to="/auth" replace></Navigate>}></Route>
        </Routes>
      </Router>
    </>)
}

export default App;