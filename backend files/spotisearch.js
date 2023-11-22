const express = require('express');
const fetch = require('node-fetch');
const btoa = require('btoa');
const app = express();

const clientId = 'bf75c821e4df4ebf9808a680b5c702a4';
const clientSecret = '6679207e99094bb7a84eaf0d9d745089';

let accessToken = '';
let tokenExpirationEpoch;

const getSpotifyToken = async () => {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
        },
        body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpirationEpoch = (new Date().getTime() / 1000) + data.expires_in - 300; // Subtract 5 minutes for a buffer
};

// Refresh the token periodically
setInterval(() => {
    if (new Date().getTime() / 1000 > tokenExpirationEpoch) {
        getSpotifyToken();
    }
}, 1000 * 60 * 5); // Check every 5 minutes

// Initial token fetch
getSpotifyToken();

// API endpoint for your frontend to use
app.get('/spotify-search', async (req, res) => {
    const query = req.query.q; // Assume there's a query parameter 'q'
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&market=TR&limit=6`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const data = await response.json();
    res.send(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
