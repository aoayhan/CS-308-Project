import { db } from './app.js';
import { collection, getDocs, query, where, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

// Function to delete a song
async function deleteSong(songName, artistName) {
    const songCollectionRef = collection(db, "song");
    const q = query(songCollectionRef, where("name", "==", songName), where("artist", "==", artistName));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        alert("Song not found.");
        return;
    }

    // Delete the song document
    try {
        querySnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
        });
        alert("Song deleted successfully.");
    } catch (error) {
        console.error("Error deleting song: ", error);
        alert("Error deleting song.");
    }
}

// Event listener for the delete song form
document.getElementById('delete-song-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const songName = document.getElementById('delete-song-name').value.trim();
    const artistName = document.getElementById('delete-artist-name').value.trim();
    deleteSong(songName, artistName);
});
