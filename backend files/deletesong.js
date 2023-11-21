import { db } from './app.js';
import { collection, getDocs, query, where, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

const auth = getAuth();
onAuthStateChanged(auth, (user) => {
    if (user) {
        attachEventListeners(user);
    } else {
        alert("Please log in to delete songs.");
        window.location.href = 'login.html'; // Uncomment to redirect
    }
});
function attachEventListeners(user) {
    document.getElementById('delete-song-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const songName = document.getElementById('delete-song-name').value.trim();
        const artistName = document.getElementById('delete-artist-name').value.trim();
        deleteSong(songName, artistName, user);
    });

    document.getElementById('delete-album-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const albumName = document.getElementById('album-name').value.trim();
        deleteAlbum(albumName, user);
    });

    document.getElementById('delete-artist-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const artistName = document.getElementById('artist-name').value.trim();
        deleteArtistSongs(artistName, user);
    });
}

// Function to delete a song
async function deleteSong(songName, artistName, user) {
    const songCollectionRef = collection(db, "song");
    const q = query(songCollectionRef, where("name", "==", songName), where("artist", "==", artistName), where("userId", "==", user.email)); // Filter by user
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


// Function to delete an entire album
async function deleteAlbum(albumName, user) {
    const songCollectionRef = collection(db, "song");
    const q = query(songCollectionRef, where("album", "==", albumName), where("userId", "==", user.email)); // Filter by user
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        alert("Album not found.");
        return;
    }

    querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
    });
    alert("Album deleted successfully.");
}
// Function to delete all songs by an artist
async function deleteArtistSongs(artistName, user) {
    const songCollectionRef = collection(db, "song");
    const q = query(songCollectionRef, where("artist", "==", artistName), where("userId", "==", user.email)); // Filter by user
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        alert("No songs found for this artist.");
        return;
    }

    querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
    });
    alert("All songs by the artist deleted successfully.");
}

