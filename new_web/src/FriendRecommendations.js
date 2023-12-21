// src/FriendRecommendations.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { auth } from './firebase-config';
import Navbar from './Navbar'; // Import the Navbar component if needed
import './recommend.css'; // Import your CSS for styling

function FriendRecommendations() {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFriendRecommendations = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const userEmail = user.email;

                    const response = await axios.get('http://localhost:3000/api/recommend-friends-songs', {
                        params: { userEmail }
                    });

                    // Split the structured recommendations into an array for display
                    const recommendationsArray = response.data.split('\n');

                    setRecommendations(recommendationsArray);
                    setLoading(false);
                } else {
                    console.log('No user is logged in');
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error getting friend recommendations:', error);
                // Handle errors, such as setting an error state to display in the UI
                setLoading(false);
            }
        };

        fetchFriendRecommendations();
    }, []);

    return (
        <>
            <Navbar />

            <div className="main-content">
                <div className="recommendations-container">
                    <h1 className="recommendations-title">Friend Recommended Songs</h1>
                    {loading ? (
                        <p>Loading friend recommendations...</p>
                    ) : recommendations.length > 0 ? (
                        <ul className="recommendations-list">
                            {recommendations.map((recommendation, index) => (
                                <li key={index} className="recommendation-item">
                                    {recommendation}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No friend recommendations found.</p>
                    )}
                </div>
            </div>
        </>
    );
}

export default FriendRecommendations;
