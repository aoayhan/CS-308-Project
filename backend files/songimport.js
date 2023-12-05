const admin = require('firebase-admin');
const serviceAccount = require('./cs308fire-firebase-adminsdk-3258q-016c92bbad.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firestore = admin.firestore();
const auth = admin.auth();

async function addUserRatingsToUsersCollection(email) {
    const userDocRef = firestore.collection('users').doc(email);

    try {
        const songsCollectionRef = firestore.collection('song');
        const querySnapshot = await songsCollectionRef.where('userId', '==', email).get();

        if (querySnapshot.empty) {
            console.log('No songs found for user:', email);
            return;
        }

        const ratings = [];

        querySnapshot.forEach(doc => {
            const songData = doc.data();
            // Check that all required fields are present and not undefined
            if (songData.name && songData.artist && songData.spotifyTrackId && typeof songData.rating !== 'undefined') {
                ratings.push({
                    songName: songData.name,
                    artistName: songData.artist,
                    rating: songData.rating,
                    spotifyTrackId: songData.spotifyTrackId // Include the Spotify Track ID
                });
            } else {
                console.log(`Incomplete song data found, skipping document with ID: ${doc.id}`);
            }
        });

        // Only perform the update if there are ratings to add
        if (ratings.length > 0) {
            await userDocRef.update({
                ratings: ratings
            });
            console.log('User ratings added to user document for:', email);
        } else {
            console.log('No complete song ratings to add for user:', email);
        }
    } catch (error) {
        console.error('Error adding user ratings to user document:', error);
    }
}

addUserRatingsToUsersCollection('asd@mail.com'); // Make sure the email is properly formatted as it is in Firestore

