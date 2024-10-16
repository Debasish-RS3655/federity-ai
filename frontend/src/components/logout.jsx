// simple component to handle the logout from gun
// Debashish Buragohain

import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Logout({ user, sessionStorage }) {
    const navigate = useNavigate();
    // if any logout logic is to be implemented then it needs to be here
    // the gun.on('bye) listener does not work
    function handleLogout() {
        let is = user.is;
        is ? console.log('User to log out: ', is.alias) : console.log('No user to log out.');
        user.leave();
        if (user.is !== is) {
            console.log('Logged out successfully.');
            sessionStorage.clear();
            navigate('/auth');
        }
    }

    return (
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
            <button onClick={handleLogout}>Logout</button>
        </div>
    )
}