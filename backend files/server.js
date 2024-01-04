const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const port = 3000;
app.use(express.json());
const session = require('express-session');
app.use(cors());
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
//Firebase 
const admin = require('firebase-admin');
const serviceAccount = require('./cs308fire-firebase-adminsdk-3258q-016c92bbad.json');
const fs = require('fs').promises;
const { addUserRatingsToUsersCollection } = require('./songimport'); // Adjust the path to the actual location of songimport.js
const passport = require('passport');
const SpotifyStrategy = require('passport-spotify').Strategy;
let publicAccessToken = ''; // Token for public data access

admin.initializeApp({
   credential: admin.credential.cert(serviceAccount)
});
const firestore = admin.firestore();
app.use(session({
    secret: 'your_secret_key', // This secret key should be a random, secure string
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set secure to true if using https
  }));
  
// Passport spotify
passport.use(new SpotifyStrategy({
    clientID: 'c30b5791c77b448ab12f973c3b7451cf',
    clientSecret: '3a5201442fdd4fb794514aeb3816b8c0',
    callbackURL: 'http://localhost:3000/auth/spotify/callback'
  },
  function(accessToken, refreshToken, expires_in, profile, done) {
    profile.userAccessToken = accessToken; // Add the token to the user profile
    profile.spotifyId = profile.id;
    return done(null, profile);
  }
));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(user, done) {
    done(null, user); // Serialize the whole user object
  });
  passport.deserializeUser(function(obj, done) {
    done(null, obj); // Deserialize the user profile object
  });
//Spotify 
const clientId = 'c30b5791c77b448ab12f973c3b7451cf'; // Replace with your Spotify Client ID
const clientSecret = '3a5201442fdd4fb794514aeb3816b8c0'; // Replace with your Spotify Client Secret
let accessToken = '';
let publicTokenExpirationEpoch;

const getPublicSpotifyToken = async () => {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
        },
        body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    publicAccessToken = data.access_token;
    const expiresIn = data.expires_in || 3600; // Default to 1 hour if not specified
    publicTokenExpirationEpoch = (new Date().getTime() / 1000) + expiresIn - 300; // Subtract 5 minutes to refresh token early
};
// Refresh the token periodically
setInterval(() => {
    if (new Date().getTime() / 1000 > publicTokenExpirationEpoch) {
        getPublicSpotifyToken();
    }
}, 1000 * 60 * 5); // Check every 5 minutes
getPublicSpotifyToken();// Initial token fetch

 app.get('/', (req, res) => {
    res.sendFile(__dirname + '/succ.html');
});
 app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email and password are required.');
    }

    try {
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
        });

        // After successful creation, add the user to the Firestore 'users' collection
        await admin.firestore().collection('users').doc(email).set({
            email: email,
            friends: [],
            pendingRequests: []
        });

        res.status(201).send(`User created successfully: ${userRecord.uid}`);
    } catch (error) {
        console.error('Error creating new user:', error);
        res.status(500).send(error.message);
    }
});
app.post('/api/add-song', async (req, res) => {
    console.log("Received request for adding a song");
    const { songName, album, artist, year, rating, userId } = req.body;

    if (!songName || !album || !artist || !year || !userId) {
        return res.status(400).send('Missing required song details or user ID');
    }

    try {
        // Refresh the Spotify public access token
        await getPublicSpotifyToken();
        const publSpotifyAccessToken = publicAccessToken;

        // Search for the song on Spotify to get the track ID
        const query = `${songName} artist:${artist}`;
        const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&market=TR&limit=1`, {
            headers: { 'Authorization': `Bearer ${publSpotifyAccessToken}` }
        });

        const searchData = await searchResponse.json();

        // Check if the search returned a track
        if (!searchData.tracks || searchData.tracks.items.length === 0) {
            console.log('Spotify track not found for:', songName);
            return res.status(404).send('Spotify track not found');
        }

        const spotifyTrackId = searchData.tracks.items[0].id;
        const artistSpotifyId = searchData.tracks.items[0].artists[0].id;

        // Prepare the song document
        const songDocument = {
            name: songName,
            album: album,
            artist: artist,
            year: year,
            rating: rating || null,
            userId: userId,
            spotifyTrackId: spotifyTrackId
        };

        // Check if the song already exists in the 'song' collection
        const songCollectionRef = admin.firestore().collection('song');
        const existingSongQuery = await songCollectionRef
            .where('name', '==', songName)
            .where('album', '==', album)
            .where('artist', '==', artist)
            .get();

        if (!existingSongQuery.empty) {
            console.log('Song already exists in the database:', songName);
            return res.status(409).send('Song already exists');
        }

        // Add the song to the 'song' collection
        await songCollectionRef.add(songDocument);

        // Also update/add to the artist's document in 'artists' collection
        const artistRef = firestore.collection('artists').doc(artistSpotifyId);
        const artistDoc = await artistRef.get();

        if (artistDoc.exists) {
            // Artist exists, append the song to the artist's songs
            await artistRef.update({
                artistSongs: admin.firestore.FieldValue.arrayUnion(songDocument)
            });
        } else {
            // Artist does not exist, create a new artist document
            await artistRef.set({
                artistName: artist,
                artistSongs: [songDocument]
            });
        }

        // Additional user ratings update (if this function exists)
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
    const { artist, userEmail } = req.body;  // Assuming you send the userEmail in the body of the request

    if (!artist || !userEmail) {
        return res.status(400).send('Artist name and user email are required');
    }

    try {
        const songCollectionRef = admin.firestore().collection('song');
        // Add a condition to the query to match the userId field with the provided userEmail
        const querySnapshot = await songCollectionRef.where('artist', '==', artist).where('userId', '==', userEmail).get();
        
        if (querySnapshot.empty) {
            return res.status(404).send('No songs found for this artist associated with the given user');
        }

        querySnapshot.forEach(doc => {
            doc.ref.delete();
        });

        res.send('All songs by the artist for the given user deleted successfully');
    } catch (error) {
        console.error('Error deleting songs by artist for user:', error);
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
          'Authorization': `Bearer ${publicAccessToken}`
      }
    });
    const data = await response.json();
  
    // Process the data to only include song name, artist name, album name, and year of release
    const simplifiedTracks = data.tracks.items.map(track => ({
      songName: track.name,
      artistName: track.artists.map(artist => artist.name).join(", "),
      albumName: track.album.name,
      year: track.album.release_date.split("-")[0] // Extracts the year from the release date
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
app.post('/api/view-songs', async (req, res) => {
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
                    'Authorization': `Bearer ${publicAccessToken}`
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
    const userEmail = req.query.userEmail;


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
                .slice(0, 3); // Take top 5 rated songs from friend

            for (const seedTrack of topFriendSongs) {
                if (!seedTrack.spotifyTrackId) {
                    console.log(`No Spotify track ID for friend's song: ${seedTrack.songName}`);
                    continue; // Skip to next song if no Spotify ID
                }

                const spotifyResponse = await fetch(`https://api.spotify.com/v1/recommendations?seed_tracks=${seedTrack.spotifyTrackId}&limit=2`, {
                    headers: {
                        'Authorization': `Bearer ${publicAccessToken}`
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
app.post('/api/send-friend-request', async (req, res) => {
    const { fromUserEmail, toUserEmail } = req.body;

    // Add a friend request to the 'toUserEmail' pending requests
    const toUserRef = admin.firestore().collection('users').doc(toUserEmail);
    const fromUserRef = admin.firestore().collection('users').doc(fromUserEmail);

    try {
        await admin.firestore().runTransaction(async (transaction) => {
            const toUserDoc = await transaction.get(toUserRef);
            if (!toUserDoc.exists) {
                throw new Error('Recipient user does not exist');
            }
            const fromUserDoc = await transaction.get(fromUserRef);
            if (!fromUserDoc.exists) {
                throw new Error('Sender user does not exist');
            }

            // Add to the recipient's pending requests if not already there
            const pendingRequests = toUserDoc.data().pendingRequests || [];
            if (pendingRequests.includes(fromUserEmail)) {
                throw new Error('Friend request already sent');
            }
            transaction.update(toUserRef, {
                pendingRequests: admin.firestore.FieldValue.arrayUnion(fromUserEmail)
            });
        });

        res.status(200).send('Friend request sent successfully');
    } catch (error) {
        console.error('Error sending friend request:', error);
        res.status(500).send(error.message);
    }
});
app.get('/api/view-friend-requests', async (req, res) => {
    const userEmail = req.query.userEmail;

    const userRef = admin.firestore().collection('users').doc(userEmail);
    try {
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).send('User not found');
        }

        const pendingRequests = userDoc.data().pendingRequests || [];
        res.status(200).json({ pendingRequests });
    } catch (error) {
        console.error('Error viewing friend requests:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/api/accept-friend-request', async (req, res) => {
    const { userEmail, friendEmail } = req.body;

    const userRef = admin.firestore().collection('users').doc(userEmail);
    const friendRef = admin.firestore().collection('users').doc(friendEmail);

    try {
        await admin.firestore().runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            const friendDoc = await transaction.get(friendRef);
            if (!userDoc.exists || !friendDoc.exists) {
                throw new Error('One or both users not found');
            }

            // Remove the friendEmail from the user's pending requests
            transaction.update(userRef, {
                pendingRequests: admin.firestore.FieldValue.arrayRemove(friendEmail),
                friends: admin.firestore.FieldValue.arrayUnion(friendEmail)
            });

            // Add the userEmail to the friend's friends list
            transaction.update(friendRef, {
                friends: admin.firestore.FieldValue.arrayUnion(userEmail)
            });
        });

        res.status(200).send('Friend request accepted');
    } catch (error) {
        console.error('Error accepting friend request:', error);
        res.status(500).send(error.message);
    }
});
app.post('/api/reject-friend-request', async (req, res) => {
    const { userEmail, friendEmail } = req.body;

    const userRef = admin.firestore().collection('users').doc(userEmail);

    try {
        await userRef.update({
            pendingRequests: admin.firestore.FieldValue.arrayRemove(friendEmail)
        });

        res.status(200).send('Friend request rejected');
    } catch (error) {
        console.error('Error rejecting friend request:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/api/get-user-friends', async (req, res) => {
    const userEmail = req.query.userEmail; // You can also get this from authentication token after decoding

    if (!userEmail) {
        return res.status(400).send('User email is required');
    }

    try {
        const userRef = admin.firestore().collection('users').doc(userEmail);
        const doc = await userRef.get();

        if (!doc.exists) {
            return res.status(404).send('User not found');
        }

        const userFriends = doc.data().friends || [];
        res.status(200).json({ friends: userFriends });
    } catch (error) {
        console.error('Error getting user friends:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/api/rate-song', async (req, res) => {
    const { songId, userId, newRating } = req.body;

    if (!songId || !userId || isNaN(newRating)) {
        return res.status(400).send('Invalid input');
    }

    try {
        const songRef = admin.firestore().collection('song').doc(songId);
        const songDoc = await songRef.get();

        if (!songDoc.exists) {
            return res.status(404).send('Song not found');
        }

        // Update rating and add to rating history
        const currentRating = songDoc.data().rating;
        await songRef.update({ rating: newRating });
        if (currentRating !== undefined) {
            const ratingHistoryRef = songRef.collection('ratingHistory');
            await ratingHistoryRef.add({
                oldRating: currentRating,
                newRating,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                userId
            });
        }

        res.status(200).send('Rating updated successfully');
    } catch (error) {
        console.error('Error rating song:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/api/update-rating', async (req, res) => {
    console.log("Request received to update rating"); // Log when a request is received
    const { songName, userId, artistName, newRating } = req.body;

    console.log(`Request body:`, req.body); // Log the body of the request

    if (!songName || !userId || !artistName || newRating === undefined) {
        console.log('Missing required fields'); // Log missing required fields
        return res.status(400).send('Song name, user ID, artist name, and new rating are required');
    }

    try {
        const songsRef = admin.firestore().collection('song');
        const querySnapshot = await songsRef.where('name', '==', songName)
                                             .where('userId', '==', userId)
                                             .where('artist', '==', artistName)
                                             .get();

        if (querySnapshot.empty) {
            console.log(`Song not found with provided details`); // Log if the song does not exist
            return res.status(404).send('Song not found');
        }

        const songDoc = querySnapshot.docs[0]; // Assuming the first document is the correct one
        console.log(`Updating rating for song: ${songName}`); // Log updating existing rating
        await songDoc.ref.update({ rating: newRating });

        console.log(`Rating updated successfully for song: ${songName}`); // Log successful update
        res.status(200).send('Rating updated successfully');
    } catch (error) {
        console.error('Error updating rating:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/api/get-friends-top-songs', async (req, res) => {
    const userEmail = req.query.userEmail;

    if (!userEmail) {
        return res.status(400).send('User email is required');
    }

    try {
        // Fetch the user's document to get the friend list
        const userRef = admin.firestore().collection('users').doc(userEmail);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).send('User not found');
        }

        const userFriends = userDoc.data().friends || [];

        let friendsTopSongs = [];

        // Fetch top 3 rated songs of each friend
        for (const friendEmail of userFriends) {
            const friendSongsRef = admin.firestore().collection('song');
            const querySnapshot = await friendSongsRef.where('userId', '==', friendEmail)
                                                     .orderBy('rating', 'desc')
                                                     .limit(3)
                                                     .get();

            let friendSongs = [];
            querySnapshot.forEach(doc => {
                friendSongs.push(doc.data());
            });

            if (friendSongs.length > 0) {
                friendsTopSongs.push({
                    friendEmail,
                    songs: friendSongs
                });
            }
        }

        res.status(200).json(friendsTopSongs);
    } catch (error) {
        console.error('Error fetching friends\' top songs:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/api/top-songs-from-era', async (req, res) => {
    console.log("Request received to get top songs from an era"); // Log when a request is received

    const { userId, startYear, endYear, limit } = req.query;

    if (!userId || !startYear || !endYear || !limit) {  
        return res.status(400).send('All parameters are required');
    }

    try {
        const songsRef = admin.firestore().collection('song');
        const querySnapshot = await songsRef
            .where('userId', '==', userId)
            .where('year', '>=', parseInt(startYear))
            .where('year', '<=', parseInt(endYear))
            .orderBy('year')
            .orderBy('rating', 'desc')
            .limit(parseInt(limit))
            .get();

        let song = [];
        querySnapshot.forEach(doc => {
            song.push(doc.data());
        });

        res.status(200).json(song);
    } catch (error) {
        console.error('Error getting top songs from era:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/api/create-friend-group', async (req, res) => {
    const { userEmail, groupName } = req.body;
    console.log("Request received to create friend group"); // Log when a request is received

    if (!userEmail || !groupName) {
        return res.status(400).send('Missing required fields: userEmail and groupName');
    }

    // Sanitize groupName to make it a valid Firestore document ID if necessary
    const sanitizedGroupName = groupName.replace(/[^a-zA-Z0-9]/g, '_'); // Example of sanitization

    try {
        const userRef = admin.firestore().collection('users').doc(userEmail);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).send('User not found');
        }

        // Check if a group with the same name already exists
        const existingGroupRef = admin.firestore().collection('friendGroups').doc(sanitizedGroupName);
        const existingGroupDoc = await existingGroupRef.get();
        if (existingGroupDoc.exists) {
            return res.status(409).send(`A friend group with the name '${groupName}' already exists.`);
        }

        await existingGroupRef.set({
            name: groupName,
            createdBy: userEmail,
            members: [userEmail],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).send(`Friend group '${groupName}' created successfully`);
    } catch (error) {
        console.error('Error creating friend group:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/api/add-friends-to-group', async (req, res) => {
    const { userEmail, groupName, friendEmails } = req.body;

    if (!userEmail || !groupName || !Array.isArray(friendEmails)) {
        return res.status(400).send('Missing required fields: userEmail, groupName, and friendEmails');
    }

    // Sanitize groupName to make it a valid Firestore document ID if necessary
    const sanitizedGroupName = groupName.replace(/[^a-zA-Z0-9]/g, '_'); // Example of sanitization

    try {
        // Verify the user
        const userRef = admin.firestore().collection('users').doc(userEmail);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).send('User not found');
        }

        // Verify the friend group by name
        const groupRef = admin.firestore().collection('friendGroups').doc(sanitizedGroupName);
        const groupDoc = await groupRef.get();
        if (!groupDoc.exists) {
            return res.status(404).send('Friend group not found');
        }

        // Check if the user is authorized to add friends (e.g., the creator or a member of the group)
        const groupData = groupDoc.data();
        if (groupData.createdBy !== userEmail && !groupData.members.includes(userEmail)) {
            return res.status(403).send('User is not authorized to add friends to this group');
        }

        // Check if all friends to be added are in the user's friend list
        const userFriends = userDoc.data().friends || [];
        const nonFriendEmails = friendEmails.filter(email => !userFriends.includes(email));
        if (nonFriendEmails.length > 0) {
            return res.status(400).send(`These emails are not your friends: ${nonFriendEmails.join(', ')}`);
        }

        // Add friends to the group
        await groupRef.update({
            members: admin.firestore.FieldValue.arrayUnion(...friendEmails)
        });

        res.status(200).send('Friends added to the group successfully');
    } catch (error) {
        console.error('Error adding friends to the group:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/api/remove-friends-from-group', async (req, res) => {
    const { userEmail, groupName, memberEmails } = req.body;

    if (!userEmail || !groupName || !Array.isArray(memberEmails)) {
        return res.status(400).send('Missing required fields: userEmail, groupName, and memberEmails');
    }

    // Sanitize groupName to make it a valid Firestore document ID if necessary
    const sanitizedGroupName = groupName.replace(/[^a-zA-Z0-9]/g, '_'); // Example of sanitization

    try {
        // Verify the friend group by name
        const groupRef = admin.firestore().collection('friendGroups').doc(sanitizedGroupName);
        const groupDoc = await groupRef.get();
        if (!groupDoc.exists) {
            return res.status(404).send('Friend group not found');
        }

        // Check if the user is the creator of the group
        const groupData = groupDoc.data();
        if (groupData.createdBy !== userEmail) {
            return res.status(403).send('User is not authorized to remove friends from this group');
        }

        // Remove friends from the group
        await groupRef.update({
            members: admin.firestore.FieldValue.arrayRemove(...memberEmails)
        });

        res.status(200).send('Friends removed from the group successfully');
    } catch (error) {
        console.error('Error removing friends from the group:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/api/analyze-group-favorites', async (req, res) => {
    const { groupName } = req.body;

    if (!groupName) {
        return res.status(400).send('Missing required field: groupName');
    }

    const sanitizedGroupName = groupName.replace(/[^a-zA-Z0-9]/g, '_');

    try {
        const groupRef = admin.firestore().collection('friendGroups').doc(sanitizedGroupName);
        const groupDoc = await groupRef.get();

        if (!groupDoc.exists) {
            return res.status(404).send('Friend group not found');
        }

        const groupData = groupDoc.data();
        const memberEmails = groupData.members;
        let groupTopSongs = [];

        for (const memberEmail of memberEmails) {
            const userDoc = await admin.firestore().collection('users').doc(memberEmail).get();

            if (!userDoc.exists) {
                console.log(`User document not found for email: ${memberEmail}`);
                continue;
            }

            const userRatings = userDoc.data().ratings || [];
            const topRatings = userRatings.sort((a, b) => b.rating - a.rating).slice(0, 3);

            topRatings.forEach(song => {
                groupTopSongs.push({
                    userEmail: memberEmail,
                    songName: song.songName, // Assuming you have songId in the ratings
                    ...song
                });
            });
        }

        console.log(`Top songs to add: ${JSON.stringify(groupTopSongs)}`);

        if (groupTopSongs.length > 0) {
            await groupRef.update({ topSongs: groupTopSongs });
            console.log('Group favorites updated successfully.');
        } else {
            console.log('No top songs to add.');
        }

        res.status(200).send('Group favorites analyzed and top songs added successfully');
    } catch (error) {
        console.error('Error analyzing group favorites:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/api/clear-group-top-songs', async (req, res) => {
    const { groupName } = req.body;

    if (!groupName) {
        return res.status(400).send('Missing required field: groupName');
    }

    const sanitizedGroupName = groupName.replace(/[^a-zA-Z0-9]/g, '_');

    try {
        const groupRef = admin.firestore().collection('friendGroups').doc(sanitizedGroupName);
        const groupDoc = await groupRef.get();

        if (!groupDoc.exists) {
            return res.status(404).send('Friend group not found');
        }

        // Clear the topSongs field by setting it to an empty array
        await groupRef.update({ topSongs: [],
            playlistLink: admin.firestore.FieldValue.delete(),
            recommendedPlaylistLink: admin.firestore.FieldValue.delete()
        });

        res.status(200).send('Top rated songs, playlist link and recommended playlist link have been cleared from the group.');
    } catch (error) {
        console.error('Error clearing data from group:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/auth/spotify', passport.authenticate('spotify', {
    scope: ['playlist-modify-private', 'playlist-modify-public']
}));
app.get('/auth/spotify/callback', passport.authenticate('spotify', { failureRedirect: '/auth/spotify' }),
  function(req, res) {
    // Successful authentication
    res.redirect('/');
});
app.post('/create-playlist', async (req, res) => {
    //if (!req.isAuthenticated()) {
      //return res.status(401).send('User not authenticated with Spotify');
    //}
  
    try {
      // Assume req.user contains the authenticated user's data
      const userSpotifyAccessToken = "BQCro7eVip71TvD0uJW_kn_07OHcQnbUIT0M5aGpcmNpj8ZMT1jq4hCT9O0ZOiPBUBQvZeWIwJMUWj1zw-S_LSvplw9PAahZ6Eas7cndOlPNfSYURYRErBft6dqk3tuhS2Wk6eKWFQzCrgsaY5B9vnAORscCDQwu-epuZLg4GjCHFWL4EB6EZzHuu6DbT_dSlZVvvFWy4CMHdf4kwQqW_QJKNX2riCt-i5iP1LPb6SChdodLktQ4ANQCwxYTbw";
      const friendGroupId = req.body.friendGroupId; // The friend group ID should be sent in the request body
  
      // Fetch the friend group name from Firestore
      const friendGroupDoc = await firestore.collection('friendGroups').doc(friendGroupId).get();
      if (!friendGroupDoc.exists) {
        return res.status(404).send('Friend group not found');
      }
  
      const friendGroupName = friendGroupDoc.data().name;
  
      // Use the Spotify API to create a new playlist with the name of the friend group
      const createPlaylistResponse = await fetch(`https://api.spotify.com/v1/users/${"anilozanayhan"}/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userSpotifyAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: friendGroupName,
          public: false // Set to true if you want the playlist to be public
        })
      });
  
      const playlistData = await createPlaylistResponse.json();
  
      // Handle success or failure
      if (!createPlaylistResponse.ok) {
        throw new Error(`Spotify API error: ${playlistData.error.message}`);
      }
  
      await addSongsToPlaylist(playlistData.id, friendGroupId, userSpotifyAccessToken);
      const playlistLink = playlistData.external_urls.spotify;
      await firestore.collection('friendGroups').doc(friendGroupId).update({
        playlistLink: playlistLink
      });
    res.status(201).send({ playlistId: playlistData.id, message: 'Playlist created and songs added successfully' });
  } catch (error) {
    console.error('Error in creating Spotify playlist or adding songs', error);
    res.status(500).send('Internal Server Error');
  }
});
async function addSongsToPlaylist(playlistId, friendGroupId, accessToken) {
    const friendGroupDoc = await firestore.collection('friendGroups').doc(friendGroupId).get();
    if (!friendGroupDoc.exists) {
      throw new Error('Friend group not found');
    }
    const topSongs = friendGroupDoc.data().topSongs;
    const trackUris = topSongs.map(song => `spotify:track:${song.spotifyTrackId}`);
  
    const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uris: trackUris })
    });
    if (!addTracksResponse.ok) {
        const addTracksData = await addTracksResponse.json();
        throw new Error(`Spotify API error: ${addTracksData.error.message}`);
      }
}
app.post('/create-recommendation-playlist', async (req, res) => {
    const { friendGroupId } = req.body;
    const userSpotifyAccessToken = "BQCro7eVip71TvD0uJW_kn_07OHcQnbUIT0M5aGpcmNpj8ZMT1jq4hCT9O0ZOiPBUBQvZeWIwJMUWj1zw-S_LSvplw9PAahZ6Eas7cndOlPNfSYURYRErBft6dqk3tuhS2Wk6eKWFQzCrgsaY5B9vnAORscCDQwu-epuZLg4GjCHFWL4EB6EZzHuu6DbT_dSlZVvvFWy4CMHdf4kwQqW_QJKNX2riCt-i5iP1LPb6SChdodLktQ4ANQCwxYTbw";
  
    try {
      const friendGroupDoc = await firestore.collection('friendGroups').doc(friendGroupId).get();
      if (!friendGroupDoc.exists) {
        return res.status(404).send('Friend group not found');
      }
      const topSongs = friendGroupDoc.data().topSongs;
  
      // Create a new playlist
      const playlistName = `Recommended Songs for ${friendGroupDoc.data().name}`;
      const createPlaylistResponse = await fetch(`https://api.spotify.com/v1/users/anilozanayhan/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userSpotifyAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: playlistName,
          public: false
        })
      });
      const playlistData = await createPlaylistResponse.json();
      if (!createPlaylistResponse.ok) {
        throw new Error(`Spotify API error: ${playlistData.error.message}`);
      }
  
      // Loop through topSongs in batches of five
      for (let i = 0; i < topSongs.length; i += 5) {
        const seedTracks = topSongs.slice(i, i + 5).map(song => song.spotifyTrackId);
  
        // Get recommendations based on seed tracks
        const recommendationsResponse = await fetch(`https://api.spotify.com/v1/recommendations?seed_tracks=${seedTracks.join(',')}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${userSpotifyAccessToken}` }
        });
        const recommendationsData = await recommendationsResponse.json();
        if (!recommendationsResponse.ok) {
          throw new Error(`Spotify API error: ${recommendationsData.error.message}`);
        }
  
        // Add the recommended tracks to the playlist
        const trackUris = recommendationsData.tracks.map(track => track.uri);
        const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistData.id}/tracks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userSpotifyAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uris: trackUris })
        });
        if (!addTracksResponse.ok) {
          const addTracksData = await addTracksResponse.json();
          throw new Error(`Spotify API error: ${addTracksData.error.message}`);
        }
      }
  
      // Update Firestore with the playlist link
      await firestore.collection('friendGroups').doc(friendGroupId).update({
        recommendedPlaylistLink: playlistData.external_urls.spotify
      });
  
      res.status(201).send({ playlistId: playlistData.id, message: 'Recommendation playlist created successfully' });
    } catch (error) {
      console.error('Error in creating recommendation Spotify playlist', error);
      res.status(500).send('Internal Server Error');
    }
});
const sourceFirebaseApp = admin.initializeApp({
      
    }),
    databaseURL: "https://console.firebase.google.com/project/cs308fire/firestore/data/~2F" // Use your Firebase project's database URL here
}, 'source');
const destFirebaseApp = admin.initializeApp({
      
    }),
    databaseURL: "https://console.firebase.google.com/project/supotifydb/firestore/data/~2F"
}, 'destination');
app.post('/api/transfer-all-collections', async (req, res) => {
  try {
    const sourceDb = admin.firestore(sourceFirebaseApp);
    const destDb = admin.firestore(destFirebaseApp);

    // Fetch the list of all collections from the source database
    const sourceCollections = await sourceDb.listCollections();
    for (const collection of sourceCollections) {
      const destCollectionRef = destDb.collection(collection.id);
      const sourceDocumentsSnapshot = await collection.get();

      // Perform the transfer in batches to avoid potential memory issues
      const batch = destDb.batch();
      sourceDocumentsSnapshot.docs.forEach(doc => {
        const destDocRef = destCollectionRef.doc(doc.id);
        batch.set(destDocRef, doc.data());
      });
      await batch.commit();
    }

    res.status(200).send('All collections transferred successfully');
  } catch (error) {
    console.error('Error transferring collections:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.post('/api/rate-artist', async (req, res) => {
    const { artist, rating, userId } = req.body;
    await getPublicSpotifyToken();
    const publSpotifyAccessToken = publicAccessToken;

    if (!artist || !rating || !userId) {
        return res.status(400).send('Missing required fields');
    }
    const intRating = parseInt(rating, 10);
    try {
        // Search Spotify for the artist and get their ID
        const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artist)}&type=artist`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publSpotifyAccessToken}` }
        });
        const searchData = await searchResponse.json();
        const artistItems = searchData.artists.items;

        if (artistItems.length === 0) {
            throw new Error('Artist not found on Spotify');
        }

        const artistSpotifyId = artistItems[0].id;

        // Create an entry for the artist in the 'artists' collection
        const artistRef = firestore.collection('artists').doc(artist); // Use artist name as the document ID

        const artistDoc = await artistRef.get();
        if (!artistDoc.exists) {
            // Create a new artist document
            await artistRef.set({
                artist,
                rating: intRating,
                userId,
                artistSpotifyId,
                artistSongs: [] // Initialize with an empty array
            });
        }
        // Find songs by the artist in the 'song' collection and add them
        const songsSnapshot = await firestore.collection('song').where('artist', '==', artist).get();
        const artistSongs = [];
        songsSnapshot.forEach(doc => {
            const song = doc.data();
            if (song.userId === userId) { // Check if the song belongs to the same user
                artistSongs.push({
                    name: song.name,
                    album: song.album,
                    year: song.year,
                    rating: typeof song.rating !== 'undefined' ? song.rating : null, // Use null if rating is undefined
                    userId: song.userId,
                    spotifyTrackId: song.spotifyTrackId
                });
            }
        });

        // Update the artist document with the songs
        
        if (artistSongs.length > 0) {
            // Update the artist document with the songs
            await artistRef.update({ artistSongs }).catch(e => console.error(e));
        } 
        else {
            console.log('No songs to update for this artist and user.'); 
        }

        res.status(201).send({ artistId: artistRef.id, message: 'Artist rated and songs added successfully' });
    } catch (error) {
        console.error('Error rating artist:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/api/top-rated-artists', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).send('Missing required user ID');
    }

    try {
        const artistsRef = firestore.collection('artists');
        const querySnapshot = await artistsRef
            .where('userId', '==', userId)
            .orderBy('rating', 'desc')
            .limit(5)
            .get();

        if (querySnapshot.empty) {
            return res.status(404).send('No top rated artists found for this user');
        }

        const topArtists = querySnapshot.docs.map(doc => doc.data());

        res.status(200).json(topArtists);
    } catch (error) {
        console.error('Error fetching top rated artists:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/api/user-friend-groups', async (req, res) => {
    const { userEmail } = req.body;

    if (!userEmail) {
        return res.status(400).send('Missing required user email');
    }

    try {
        // Query all friend groups where the user is a member
        const friendGroupsRef = firestore.collection('friendGroups');
        const querySnapshot = await friendGroupsRef.where('members', 'array-contains', userEmail).get();

        if (querySnapshot.empty) {
            return res.status(404).send('No friend groups found for this user');
        }

        // Construct the response data
        const friendGroupsData = querySnapshot.docs.map(doc => {
            const groupData = doc.data();
            // Exclude 'createdAt' and 'createdBy' from the details
            const { createdAt, createdBy, ...rest } = groupData;
            return rest;
        });

        res.status(200).json(friendGroupsData);
    } catch (error) {
        console.error('Error retrieving friend groups:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/api/average-rating-by-year', async (req, res) => {
    const userEmail = req.body.userEmail; // Expecting to receive the userEmail in the request body

    if (!userEmail) {
        return res.status(400).send('Missing required field: userEmail');
    }

    try {
        // Fetch only the songs that belong to the user
        const songsSnapshot = await firestore.collection('song')
            .where('userId', '==', userEmail)
            .get();

        let yearRatings = {};
        // Initialize a map to hold total ratings and count of songs per year
        let ratingsMap = {};

        songsSnapshot.forEach(doc => {
            const { year, rating } = doc.data();
            if (rating !== null && rating !== undefined) { // Ensure that the rating is not null or undefined
                if (!ratingsMap[year]) {
                    ratingsMap[year] = { totalRating: 0, count: 0 };
                }
                ratingsMap[year].totalRating += rating;
                ratingsMap[year].count++;
            }
        });

        // Calculate the average rating for each year
        for (const [year, data] of Object.entries(ratingsMap)) {
            yearRatings[year] = (data.totalRating / data.count).toFixed(2);
        }

        res.status(200).json(yearRatings);
    } catch (error) {
        console.error('Error fetching average rating by year:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/api/compare-artist-song-ratings', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).send('Missing required user ID');
    }

    try {
        const artistsRef = firestore.collection('artists');
        const artistsSnapshot = await artistsRef
            .where('userId', '==', userId)
            .orderBy('rating', 'desc')
            .limit(5)
            .get();

        if (artistsSnapshot.empty) {
            return res.status(404).send('No top-rated artists found for this user');
        }

        let artistComparisonData = [];

        for (const artistDoc of artistsSnapshot.docs) {
            const artistData = artistDoc.data();

            // Calculate average song rating for the artist
            const songsRef = firestore.collection('song');
            const songsSnapshot = await songsRef
                .where('userId', '==', userId)
                .where('artist', '==', artistData.artist)
                .get();

            let totalSongRating = 0;
            let songCount = 0;

            songsSnapshot.forEach(songDoc => {
                const songData = songDoc.data();
                if (songData.rating) {
                    totalSongRating += songData.rating;
                    songCount++;
                }
            });

            const averageSongRating = songCount > 0 ? parseFloat((totalSongRating / songCount).toFixed(2)) : 0;

            // Add the comparison data
            artistComparisonData.push({
                artist: artistData.artist,
                artistRating: artistData.rating,
                averageSongRating: averageSongRating
            });
        }

        res.status(200).json(artistComparisonData);
    } catch (error) {
        console.error('Error comparing artist and song ratings:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/api/get-top-artist', async (req, res) => {
    const userEmail = req.query.userEmail;

    if (!userEmail) {
        return res.status(400).send('User email is required');
    }

    try {
        const songsRef = admin.firestore().collection('song');
        // Fetch only the songs with ratings
        const querySnapshot = await songsRef
            .where('userId', '==', userEmail)
            .where('rating', '!=', null)
            .get();

        let artistRatings = {};

        querySnapshot.forEach(doc => {
            const song = doc.data();
            const { artist, rating } = song;
            if (rating !== null) {
                if (!artistRatings[artist]) {
                    artistRatings[artist] = {
                        totalRating: rating,
                        count: 1
                    };
                } else {
                    artistRatings[artist].totalRating += rating;
                    artistRatings[artist].count += 1;
                }
            }
        });

        let topArtist = null;
        let highestAverage = 0;
        let songAverageRating = 0;

        for (const artist in artistRatings) {
            const averageRating = artistRatings[artist].totalRating / artistRatings[artist].count;
            if (averageRating > highestAverage) {
                highestAverage = averageRating;
                topArtist = artist;
                songAverageRating = averageRating.toFixed(2); // Get average rating to 2 decimal places
            }
        }

        if (topArtist) {
            // Construct the Twitter share URL with the text message
            const tweetText = `My favorite SUpotify artist is #${topArtist} . I rated them ${songAverageRating}. What is yours?`;
            const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

            // Redirect to the Twitter share URL
            res.redirect(twitterShareUrl);
        } else {
            res.status(404).send('No top artist found');
        }
    } catch (error) {
        console.error('Error fetching top artist and creating share link:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/api/get-least-liked-artist', async (req, res) => {
    const userEmail = req.query.userEmail;

    if (!userEmail) {
        return res.status(400).send('User email is required');
    }

    try {
        const songsRef = admin.firestore().collection('song');
        // Fetch only the songs with ratings
        const querySnapshot = await songsRef
            .where('userId', '==', userEmail)
            .where('rating', '!=', null)
            .get();

        let artistRatings = {};

        querySnapshot.forEach(doc => {
            const song = doc.data();
            const { artist, rating } = song;
            if (rating !== null) {
                if (!artistRatings[artist]) {
                    artistRatings[artist] = {
                        totalRating: rating,
                        count: 1
                    };
                } else {
                    artistRatings[artist].totalRating += rating;
                    artistRatings[artist].count += 1;
                }
            }
        });

        let leastLikedArtist = null;
        let lowestAverage = Number.MAX_VALUE;

        for (const artist in artistRatings) {
            const averageRating = artistRatings[artist].totalRating / artistRatings[artist].count;
            if (averageRating < lowestAverage) {
                lowestAverage = averageRating;
                leastLikedArtist = artist;
            }
        }

        if (leastLikedArtist) {
            // Construct the Twitter share URL with the text message
            const tweetText = `My least liked SUpotify artist is #${leastLikedArtist}. What is yours?`;
            const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

            // Redirect to the Twitter share URL
            res.redirect(twitterShareUrl);
        } else {
            res.status(404).send('No least liked artist found');
        }
    } catch (error) {
        console.error('Error fetching least liked artist and creating share link:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/api/artist-popularity', async (req, res) => {
    try {
        const songsRef = admin.firestore().collection('song');
        const querySnapshot = await songsRef.get();

        let artistCounts = {};

        querySnapshot.forEach(doc => {
            const song = doc.data();
            const { artist } = song;
            if (artist) {
                artistCounts[artist] = (artistCounts[artist] || 0) + 1;
            }
        });

        // Convert the artistCounts object into an array and sort it
        let sortedArtists = Object.keys(artistCounts).map(artist => {
            return { artist: artist, count: artistCounts[artist] };
        });

        sortedArtists.sort((a, b) => b.count - a.count);

        // Limit to top 10 artists
        sortedArtists = sortedArtists.slice(0, 10);

        res.status(200).json(sortedArtists);
    } catch (error) {
        console.error('Error fetching artist popularity:', error);
        res.status(500).send('Internal Server Error');
    }
});
