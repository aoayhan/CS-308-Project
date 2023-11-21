const express = require('express');
const fetch = require('node-fetch');
const app = express();
const cors = require('cors');

app.use(cors());

const clientId = 'bf75c821e4df4ebf9808a680b5c702a4'; // Replace with your Spotify Client ID
const clientSecret = '6679207e99094bb7a84eaf0d9d745089'; // Replace with your Spotify Client Secret

let accessToken = '';
let tokenExpirationEpoch;

const getSpotifyToken = async () => {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
        },
        body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    accessToken = data.access_token;
    const expiresIn = data.expires_in || 3600; // Default to 1 hour if not specified
    tokenExpirationEpoch = (new Date().getTime() / 1000) + expiresIn - 300; // Subtract 5 minutes to refresh token early
};

// Refresh the token periodically
setInterval(() => {
    if (new Date().getTime() / 1000 > tokenExpirationEpoch) {
        getSpotifyToken();
    }
}, 1000 * 60 * 5); // Check every 5 minutes

// Initial token fetch
getSpotifyToken();

// Your server's other endpoints and logic...

const PORT = 3000; // Use your preferred port
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.get('/spotify-search', async (req, res) => {
  const query = req.query.q;
  const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&market=TR&limit=6`, {
      headers: {
          'Authorization': `Bearer ${accessToken}`
      }
  });
  const data = await response.json();
  res.send(data);
});