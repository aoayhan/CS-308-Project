const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const port = 3000;
app.use(express.json());
app.use(cors());

//Spotify 
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
getSpotifyToken();// Initial token fetch

//Firebase 
const admin = require('firebase-admin');
const serviceAccount = require('./cs308fire-firebase-adminsdk-3258q-016c92bbad.json');

admin.initializeApp({
   credential: admin.credential.cert(serviceAccount)
});

app.get('/', (req, res) => {
    res.send('Hello World!');
 });
 const authenticate = async (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(403).send('Invalid token');
    }
};

 app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
 
app.post('/api/add-song', async (req, res) => {
    console.log("Received request for adding a song");
    const { songName, album, artist, year, rating, userId } = req.body;

    if (!songName || !album || !artist || !year || !userId) {
        return res.status(400).send('Missing required song details or user ID');
    }

    try {
        // Search for the song on Spotify to get the track ID
        const query = `${songName} artist:${artist}`;
        const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&market=TR&limit=1`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const searchData = await searchResponse.json();

        // Check if the search returned a track
        if (!searchData.tracks || searchData.tracks.items.length === 0) {
            console.log('Spotify track not found for:', songName);
            return res.status(404).send('Spotify track not found');
        }

        const spotifyTrackId = searchData.tracks.items[0].id; // Get the track ID of the first result

        // Add the song details along with the Spotify track ID to Firestore
        const songCollectionRef = admin.firestore().collection('song');
        const songDocument = {
            name: songName,
            album: album,
            artist: artist,
            year: year,
            rating: rating || null,
            userId: userId, // Storing user's ID with the song
            spotifyTrackId: spotifyTrackId // Storing the Spotify track ID
        };

        await songCollectionRef.add(songDocument);
        res.status(201).send('Song added successfully with Spotify track ID');
    } catch (error) {
        console.error('Error adding song to Firestore:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.delete('/api/delete-song', async (req, res) => {
    const { songName, artist, userId } = req.body;

    if (!songName || !artist || !userId) {
        return res.status(400).send('Song name, artist, and user ID are required');
    }

    try {
        const songCollectionRef = admin.firestore().collection('song');
        const querySnapshot = await songCollectionRef
            .where('name', '==', songName)
            .where('artist', '==', artist)
            .where('userId', '==', userId)
            .get();

        if (querySnapshot.empty) {
            return res.status(404).send('Song not found');
        }

        querySnapshot.forEach(doc => {
            doc.ref.delete();
        });

        res.send('Song deleted successfully');
    } catch (error) {
        console.error('Error deleting song:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.delete('/api/delete-songs-by-artist', async (req, res) => {
    const { artist } = req.body;

    if (!artist) {
        return res.status(400).send('Artist name is required');
    }

    try {
        const songCollectionRef = admin.firestore().collection('song');
        const querySnapshot = await songCollectionRef.where('artist', '==', artist).get();
        
        if (querySnapshot.empty) {
            return res.status(404).send('No songs found for this artist');
        }

        querySnapshot.forEach(doc => {
            doc.ref.delete();
        });

        res.send('All songs by the artist deleted successfully');
    } catch (error) {
        console.error('Error deleting songs by artist:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.delete('/api/delete-songs-by-album', async (req, res) => {
    const { album } = req.body;

    if (!album) {
        return res.status(400).send('Album name is required');
    }

    try {
        const songCollectionRef = admin.firestore().collection('song');
        const querySnapshot = await songCollectionRef.where('album', '==', album).get();
        
        if (querySnapshot.empty) {
            return res.status(404).send('No songs found in this album');
        }

        querySnapshot.forEach(doc => {
            doc.ref.delete();
        });

        res.send('All songs in the album deleted successfully');
    } catch (error) {
        console.error('Error deleting songs by album:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/api/export-songs', async (req, res) => {
    const artist = req.query.artist;

    if (!artist) {
        return res.status(400).send('Artist name is required');
    }

    try {
        const songCollectionRef = admin.firestore().collection('song');
        const querySnapshot = await songCollectionRef.where('artist', '==', artist).get();

        if (querySnapshot.empty) {
            return res.status(404).send('No songs found for this artist');
        }

        const songs = querySnapshot.docs.map(doc => doc.data());

        res.setHeader('Content-Disposition', 'attachment; filename=songs.json');
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(songs);

    } catch (error) {
        console.error('Error exporting songs:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/spotify-search', async (req, res) => {
    const query = req.query.q;
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&market=TR&limit=6`, {
      headers: {
          'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await response.json();
  
    // Process the data to only include song name, artist name, album name, and popularity
    const simplifiedTracks = data.tracks.items.map(track => ({
      songName: track.name,
      artistName: track.artists.map(artist => artist.name).join(", "),
      albumName: track.album.name,
      popularity: track.popularity
    }));
  
    // Send the simplified data
    res.json(simplifiedTracks);
});
app.get('/api/search-song', async (req, res) => {
    const songName = req.query.name;

    if (!songName) {
        return res.status(400).send('Song name is required');
    }

    try {
        const songCollectionRef = admin.firestore().collection('song');
        const querySnapshot = await songCollectionRef.where('name', '==', songName).get();

        if (querySnapshot.empty) {
            return res.status(404).send('No songs found with this name');
        }

        const songs = querySnapshot.docs.map(doc => doc.data());
        res.status(200).json(songs);
    } catch (error) {
        console.error('Error searching for song:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/api/add-batch-songs', async (req, res) => {
    const songs = req.body;

    if (!Array.isArray(songs) || songs.length === 0) {
        return res.status(400).send('Invalid song data');
    }

    try {
        const songCollectionRef = admin.firestore().collection('song');
        const batch = admin.firestore().batch();

        songs.forEach(song => {
            if (song.name && song.artist && song.album && song.year) {
                const docRef = songCollectionRef.doc();
                batch.set(docRef, song);
            }
        });

        await batch.commit();
        res.status(201).send('Songs added successfully');
    } catch (error) {
        console.error('Error adding batch songs:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/api/view-songs', async (req, res) => {
    // Assuming you retrieve and verify the user ID from the request
    // For example, let's say the user ID is stored in req.userId after verification
    //const userId = req.userId; // Replace with actual logic to retrieve user's ID
    const userId = "a@mail.com";
    try {
        const songCollectionRef = admin.firestore().collection('song');
        const querySnapshot = await songCollectionRef.where('userId', '==', userId).get();

        if (querySnapshot.empty) {
            return res.status(404).json({ message: 'No songs found' });
        }

        const songs = querySnapshot.docs.map(doc => doc.data());
        res.status(200).json(songs);
    } catch (error) {
        console.error('Error fetching user songs:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/api/addFriend', async (req, res) => {
    const { userEmail, friendEmail } = req.body;

    if (!userEmail || !friendEmail) {
        return res.status(400).send('Missing userEmail or friendEmail');
    }

    try {
        const userRef = admin.firestore().collection('users').doc(userEmail);
        const friendRef = admin.firestore().collection('users').doc(friendEmail);

        // Retrieve the current friend lists for both users
        const userDoc = await userRef.get();
        const friendDoc = await friendRef.get();

        // Check if both users exist
        if (!userDoc.exists || !friendDoc.exists) {
            return res.status(404).send('One or both users not found');
        }

        const userFriends = userDoc.data().friends || [];
        const friendFriends = friendDoc.data().friends || [];

        // Check if they are already friends
        if (userFriends.includes(friendEmail) && friendFriends.includes(userEmail)) {
            return res.status(409).send('Users are already friends');
        }

        // Start a batch write
        const batch = admin.firestore().batch();

        // Add friendEmail to userEmail's friends list
        batch.update(userRef, {
            friends: admin.firestore.FieldValue.arrayUnion(friendEmail)
        });

        // Add userEmail to friendEmail's friends list
        batch.update(friendRef, {
            friends: admin.firestore.FieldValue.arrayUnion(userEmail)
        });

        // Commit the batch write
        await batch.commit();

        res.status(200).send('Friend added successfully');
    } catch (error) {
        console.error('Error adding friend: ', error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/api/deleteFriend', async (req, res) => {
    const { userEmail, friendEmail } = req.body;

    if (!userEmail || !friendEmail) {
        return res.status(400).send('Missing userEmail or friendEmail');
    }

    try {
        const userRef = admin.firestore().collection('users').doc(userEmail);
        const friendRef = admin.firestore().collection('users').doc(friendEmail);

        // Retrieve the current friend lists for both users
        const userDoc = await userRef.get();
        const friendDoc = await friendRef.get();

        // Check if both users exist
        if (!userDoc.exists || !friendDoc.exists) {
            return res.status(404).send('One or both users not found');
        }

        const userFriends = userDoc.data().friends || [];
        const friendFriends = friendDoc.data().friends || [];

        // Check if they are actually friends
        if (!userFriends.includes(friendEmail) || !friendFriends.includes(userEmail)) {
            return res.status(409).send('Users are not friends');
        }

        // Start a batch write
        const batch = admin.firestore().batch();

        // Remove friendEmail from userEmail's friends list
        batch.update(userRef, {
            friends: admin.firestore.FieldValue.arrayRemove(friendEmail)
        });

        // Remove userEmail from friendEmail's friends list
        batch.update(friendRef, {
            friends: admin.firestore.FieldValue.arrayRemove(userEmail)
        });

        // Commit the batch write
        await batch.commit();

        res.status(200).send('Friend deleted successfully');
    } catch (error) {
        console.error('Error deleting friend: ', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/api/recommend-songs', async (req, res) => {
    const userEmail = "asd@mail.com"; // This should be dynamically retrieved from authentication in a real scenario

    console.log('Starting song recommendation process for:', userEmail);

    try {
        const userRef = admin.firestore().collection('users').doc(userEmail);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            console.log('User not found:', userEmail);
            return res.status(404).send('User not found');
        }

        console.log('User document retrieved successfully:', userEmail);

        const userRatings = userDoc.data().ratings || [];
        console.log(`Found ${userRatings.length} ratings for user:`, userEmail);

        const topRatedSongs = userRatings
            .map(rating => ({
                ...rating,
                rating: parseInt(rating.rating) // Ensure the rating is an integer
            }))
            .filter(rating => !isNaN(rating.rating) && rating.rating >= 4)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 2);

        console.log('Top rated songs determined:', topRatedSongs);

        if (topRatedSongs.length === 0) {
            console.log('No highly rated songs found to use as seed for recommendations');
            return res.status(200).json({ message: 'No recommendations found due to lack of highly rated songs' });
        }

        const numRecommendationsPerTrack = 2;
        const recommendations = [];

        for (const seedTrack of topRatedSongs) {
            if (!seedTrack.spotifyTrackId) {
                console.log(`No Spotify track ID for song: ${seedTrack.songName}`);
                continue; // Skip this iteration if there is no Spotify track ID
            }

            const spotifyResponse = await fetch(`https://api.spotify.com/v1/recommendations?seed_tracks=${seedTrack.spotifyTrackId}&limit=${numRecommendationsPerTrack}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!spotifyResponse.ok) {
                console.error('Spotify API responded with error:', spotifyResponse.status);
                continue; // Skip this iteration if the Spotify API call fails
            }

            const spotifyRecommendations = await spotifyResponse.json();

            const trackRecommendations = spotifyRecommendations.tracks.map(track => ({
                songName: track.name,
                artistName: track.artists.map(artist => artist.name).join(", "),
                albumName: track.album.name
            }));

            // Add the recommendations to the array, limiting to 2 per seed track
            recommendations.push(...trackRecommendations.slice(0, numRecommendationsPerTrack));
        }

        console.log('Processed recommendations:', recommendations);

        res.status(200).json(recommendations);

    } catch (error) {
        console.error('Error generating song recommendations:', error);
        res.status(500).send('Internal Server Error');
    }
});