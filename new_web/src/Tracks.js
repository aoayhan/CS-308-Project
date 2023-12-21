import React, { useState, useEffect } from 'react';
import { auth } from './firebase-config';
import axios from 'axios';
import './navbar.css'; // Import your Navbar component
import './tracks.css'; // Make sure to create and import your CSS for SongsPage

function SongsPage() {
    const [songs, setSongs] = useState([]);
    const [search, setSearch] = useState(''); // State to hold the search input

    useEffect(() => {
        fetchSongs(); // Fetch songs when the component mounts
    }, []);

    // Function to fetch all songs
    const fetchSongs = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const userEmail = user.email;
                const response = await axios.post('http://localhost:3000/api/view-songs', { userId: userEmail });
                setSongs(response.data);
            } else {
                console.log('No user is logged in');
            }
        } catch (error) {
            console.error('Error fetching songs:', error);
        }
    };

    // Function to handle search
    const handleSearch = async () => {
        if (!search.trim()) return; // If the search term is empty, do nothing

        try {
            const response = await axios.get(`http://localhost:3000/api/search-song?name=${encodeURIComponent(search)}`);
            setSongs(response.data); // Update the songs state with the search results
        } catch (error) {
            console.error('Error searching for songs:', error);
        }
    };

    return (
        <>
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search for a song..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                />
                <button onClick={handleSearch} className="search-button">Search</button>
            </div>
            <div className="song-list-container">
                <h1>Your Songs</h1>
                <ul>
                    {songs.map((song, index) => (
                        <li key={index}>{song.name} by {song.artist}</li>
                    ))}
                </ul>
            </div>
        </>
    );
}

export default SongsPage;
