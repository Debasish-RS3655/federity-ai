// home page won't do anything other than rerouting it back to the authentication page
// Debashish Buragohain

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home({ user }) {
    const navigate = useNavigate();
    useEffect(() => {
        if (!user.is) {
            navigate('/auth');
        }
        else navigate('/feed');
    }, []);
}