import React from 'react';
import Navbar from './Navbar';
import UserRecommendations from './UserRecommendations';
import FriendRecommendations from './FriendRecommendations';
import './recommend.css';

function Recommend() {
    return (
        <>
            <Navbar />
                    <UserRecommendations />
                    <FriendRecommendations />
        </>
    );
}

export default Recommend;
