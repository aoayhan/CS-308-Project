import { db } from './app.js';
import { collection, writeBatch, doc } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

const auth = getAuth();

document.getElementById('upload-button').addEventListener('click', () => {
    const jsonInput = document.getElementById('json-input').value;
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const songs = JSON.parse(jsonInput);
                await uploadSongs(songs, user);
                alert('Songs uploaded successfully!');
            } catch (error) {
                console.error('Error parsing JSON or uploading songs:', error);
                alert('Failed to upload songs. Please check the JSON format.');
            }
        } else {
            alert("Please log in to upload songs.");
            window.location.href = 'login.html'; // Uncomment to redirect

        }
    });
});

async function uploadSongs(songs, user) {
    const batch = writeBatch(db);
    const songCollectionRef = collection(db, "song");

    songs.forEach(song => {
        if (song.name && song.artist && song.album && song.year) {
            const docRef = doc(songCollectionRef);
            batch.set(docRef, {
                ...song,
                userId: user.email // Include the user's email with each song
            });
        }
    });

    await batch.commit();
}
