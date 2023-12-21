// src/RecommendationComponent.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { auth } from './firebase-config';
import Navbar from './Navbar'; // Import the Navbar component if needed
import './recommend.css'; // Import your CSS for styling

function UserRecommendations() {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const userEmail = user.email;

                    const response = await axios.get('http://localhost:3000/api/recommend-songs', {
                        params: { userEmail }
                    });

                    setRecommendations(response.data);
                    setLoading(false);
                } else {
                    console.log('No user is logged in');
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error getting recommendations:', error);
                // Handle errors, such as setting an error state to display in the UI
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    return (
        <>
            <Navbar />

            <div className="main-content">
                <div className="recommendations-container">
                    <h1 className="recommendations-title">Recommended Songs</h1>
                    {loading ? (
                        <p>Loading recommendations...</p>
                    ) : recommendations.length > 0 ? (
                        <ul className="recommendations-list">
                            {recommendations.map((song, index) => (
                                <li key={index} className="recommendation-item">
                                    <strong>{song.songName}</strong> by {song.artistName} from the album {song.albumName}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No recommendations found.</p>
                    )}
                </div>
            </div>
        </>
    );
}

export default UserRecommendations;

