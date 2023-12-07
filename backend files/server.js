const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const port = 3000;
app.use(express.json());
app.use(cors());
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
//Firebase 
const admin = require('firebase-admin');
const serviceAccount = require('./cs308fire-firebase-adminsdk-3258q-016c92bbad.json');
const fs = require('fs').promises;
const { addUserRatingsToUsersCollection } = require('./songimport'); // Adjust the path to the actual location of songimport.js


admin.initializeApp({
   credential: admin.credential.cert(serviceAccount)
});
const firestore = admin.firestore();

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
        const existingSongQuery = await songCollectionRef
            .where('name', '==', songName)
            .where('album', '==', album)
            .where('artist', '==', artist)
            .get();

        if (!existingSongQuery.empty) {
            console.log('Song already exists in the database:', songName);
            return res.status(409).send('Song already exists');
        }
        await songCollectionRef.add(songDocument);

        await addUserRatingsToUsersCollection(userId);
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
        // First, delete the song from the 'song' collection
        const songCollectionRef = admin.firestore().collection('song');
        const querySnapshot = await songCollectionRef
            .where('name', '==', songName)
            .where('artist', '==', artist)
            .where('userId', '==', userId)
            .get();

        if (querySnapshot.empty) {
            return res.status(404).send('Song not found');
        }

        // Delete all matching documents
        querySnapshot.forEach(doc => {
            doc.ref.delete();
        });

        const usersRef = admin.firestore().collection('users');
        const usersSnapshot = await usersRef.where('email', '==', userId).get();

        if (usersSnapshot.empty) {
            console.log('User not found:', userId);
            return res.status(404).send('User not found');
        }

        // Assuming there's only one document per user
        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();
        const ratings = Array.isArray(userData.ratings) ? userData.ratings : [];

        const updatedRatings = ratings.filter(rating => 
            !(rating.songName === songName && rating.artistName === artist)
        );

        if (updatedRatings.length !== ratings.length) {
            await userDoc.ref.update({ ratings: updatedRatings });
        }

        res.send('Song deleted successfully and ratings updated');
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
    const songNameQuery = req.query.name;

    if (!songNameQuery) {
        return res.status(400).send('Song name is required');
    }

    try {
        const songCollectionRef = admin.firestore().collection('song');
        const querySnapshot = await songCollectionRef.get(); // Retrieve all songs

        const searchLower = songNameQuery.toLowerCase();
        const filteredSongs = [];

        querySnapshot.forEach(doc => {
            const song = doc.data();
            if (song.name && song.name.toLowerCase().includes(searchLower)) {
                filteredSongs.push(song);
            }
        });

        if (filteredSongs.length === 0) {
            return res.status(404).send('No songs found with this name');
        }

        res.status(200).json(filteredSongs);
    } catch (error) {
        console.error('Error searching for song:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/api/add-batch-songs', upload.single('songsFile'), async (req, res) => {
    // 'songsFile' is the name attribute of the file input in your form or the key used in Postman

    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    try {
        // Read the file using the path from multer's req.file
        const songsData = await fs.readFile(req.file.path, 'utf8');
        const songs = JSON.parse(songsData); // Parse the JSON data into a JavaScript array

        if (!Array.isArray(songs) || songs.length === 0) {
            return res.status(400).send('Invalid song data');
        }

        const songCollectionRef = admin.firestore().collection('song');
        const batch = admin.firestore().batch();

        songs.forEach(song => {
            if (song.name && song.artist && song.album && song.year) {
                const docRef = songCollectionRef.doc();
                batch.set(docRef, song);
            }
        });

        await batch.commit();

        // Delete the temporary file after processing
        await fs.unlink(req.file.path);

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
    const { userId } = req.body;
    
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
    const userEmail = req.query.userEmail; // This should be dynamically retrieved from authentication in a real scenario

    console.log('Starting song recommendation process for:', userEmail);
    if (!userEmail) {
        return res.status(400).send('User email is required');
    }

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
            .slice(0, 3);

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
app.get('/api/recommend-friends-songs', async (req, res) => {
    const { userEmail } = req.body;

    console.log('Starting friend song recommendation process for:', userEmail);

    try {
        const userRef = admin.firestore().collection('users').doc(userEmail);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            console.log('User not found:', userEmail);
            return res.status(404).send('User not found');
        }

        const userFriends = userDoc.data().friends || [];
        if (userFriends.length === 0) {
            return res.status(404).send('User has no friends to get recommendations from');
        }

        let recommendations = [];

        for (const friendEmail of userFriends) {
            const friendRecommendations = {
                friend: friendEmail,
                songs: []
            };

            const friendRef = admin.firestore().collection('users').doc(friendEmail);
            const friendDoc = await friendRef.get();

            if (!friendDoc.exists) {
                console.log('Friend not found:', friendEmail);
                continue; // Skip to next friend if this one doesn't exist
            }

            const friendRatings = friendDoc.data().ratings || [];
            const topFriendSongs = friendRatings
                .filter(rating => rating.rating && rating.rating >= 4)
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 5); // Take top 5 rated songs from friend

            for (const seedTrack of topFriendSongs) {
                if (!seedTrack.spotifyTrackId) {
                    console.log(`No Spotify track ID for friend's song: ${seedTrack.songName}`);
                    continue; // Skip to next song if no Spotify ID
                }

                const spotifyResponse = await fetch(`https://api.spotify.com/v1/recommendations?seed_tracks=${seedTrack.spotifyTrackId}&limit=2`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (!spotifyResponse.ok) {
                    console.error('Spotify API responded with error:', spotifyResponse.status);
                    continue; // Skip to next song if API call fails
                }

                const spotifyRecommendations = await spotifyResponse.json();

                friendRecommendations.songs.push(...spotifyRecommendations.tracks.map(track => ({
                    songName: track.name,
                    artistName: track.artists.map(artist => artist.name).join(", "),
                    albumName: track.album.name
                })));
            }

            if (friendRecommendations.songs.length > 0) {
                recommendations.push(friendRecommendations);
            }
        }

        console.log('Processed recommendations for all friends:', recommendations);

        // Structure the response with headers
        let structuredRecommendations = "";
        recommendations.forEach(rec => {
            structuredRecommendations += `From ${rec.friend}\n`;
            rec.songs.forEach(song => {
                structuredRecommendations += `${song.songName} by ${song.artistName}\n`;
            });
        });

        res.status(200).send(structuredRecommendations);

    } catch (error) {
        console.error('Error generating friend song recommendations:', error);
        res.status(500).send('Internal Server Error');
    }
});
