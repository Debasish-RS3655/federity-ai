import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
    return (
        <>
            <Link to="/feed" style={{ marginRight: '40px' }}>Feed</Link>
            <Link to="/create" style={{ marginRight: '40px' }}>Create</Link>
            <Link to="/profile">Profile</Link>
        </>)
}