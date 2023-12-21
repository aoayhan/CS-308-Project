// src/ImportSong.js
import React, { useState } from 'react';
import axios from 'axios';
import Navbar from './Navbar'; // Import the Navbar component if needed
import './import-song.css'; // Import your CSS for styling

function ImportSong() {
    const [file, setFile] = useState(null);
    const [artistName, setArtistName] = useState(''); // Added state for artist name
    const [message, setMessage] = useState('');

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        try {
            if (!file) {
                setMessage('Please select a file');
                return;
            }

            const formData = new FormData();
            formData.append('songsFile', file);

            const response = await axios.post('http://localhost:3000/api/add-batch-songs', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setMessage(response.data);
        } catch (error) {
            console.error('Error uploading batch songs:', error);
            setMessage('An error occurred while uploading songs');
        }
    };

    const handleExport = async () => {
        try {
            if (!artistName) {
                setMessage('Please enter an artist name');
                return;
            }

            const response = await axios.get('http://localhost:3000/api/export-songs', {
                params: {
                    artist: artistName, // Use the entered artist name
                },
                responseType: 'blob', // Set responseType to 'blob' for binary data
            });

            const blob = new Blob([response.data], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = 'exported-songs.json';
            link.click();
        } catch (error) {
            console.error('Error exporting songs:', error);
            setMessage('An error occurred while exporting songs');
        }
    };

    return (
        <>
            <Navbar />

            <div className="main-content">
                <div className="import-song-container">
                    <h1 className="import-song-title">Import Songs</h1>

                    <input type="file" onChange={handleFileChange} />
                    <button onClick={handleUpload}>Upload</button>

                    {/* New input field for artist name */}
                    <input
                        type="text"
                        placeholder="Enter artist name"
                        value={artistName}
                        onChange={(e) => setArtistName(e.target.value)}
                    />

                    <button onClick={handleExport}>Export</button>

                    {message && <p className="import-song-message">{message}</p>}
                </div>
            </div>
        </>
    );
}

export default ImportSong;
