import { db } from './app.js';
import { collection, addDoc, getDocs, where, query} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';


export async function addSongDetails(songName, album, artist, year, rating) {
    const songCollectionRef = collection(db, "song");
    const songExistsQuery = query(songCollectionRef, where("name", "==", songName), where("artist", "==", artist));
    const querySnapshot = await getDocs(songExistsQuery);

    if (!querySnapshot.empty) {
        alert("A song with this name and artist already exists.");
        return;
    }
    // Validate required fields
    if (!songName || !album || !artist || !year) {
        console.error("Missing required song details: name, album, artist, year");
        alert("Please provide all required song details: name, album, artist, and year.");
        return;
    }

    // Prepare song data, including rating if provided
    const songData = {
        name: songName,
        album: album,
        artist: artist,
        year: year,
        ...(rating && { rating: rating }) // Include rating only if it's provided
    };

    try {
        // Add a new document with the song details
        const docRef = await addDoc(songCollectionRef, songData);
        console.log("Song details added with ID: ", docRef.id);
    } catch (error) {
        console.error("Error adding song details: ", error);
    }
}

document.getElementById('add-song-form').addEventListener('submit', function(event){
    event.preventDefault();

    // Get the values from the form
    var songName = document.getElementById('song-name').value.trim();
    var album = document.getElementById('song-album').value.trim();
    var artist = document.getElementById('song-artist').value.trim();
    var year = document.getElementById('song-year').value.trim();
    var rating = document.getElementById('song-rating').value.trim();

    // Call the function with all the song details
    addSongDetails(songName, album, artist, year, rating).then(() => {
        // Optionally clear the form or give feedback to the user after adding the song
        document.getElementById('song-name').value = '';
        document.getElementById('song-album').value = '';
        document.getElementById('song-artist').value = '';
        document.getElementById('song-year').value = '';
        document.getElementById('song-rating').value = '';
    });
});

async function searchSongs(searchQuery) {
    const songCollectionRef = collection(db, "song");
    
    // Use the imported 'query' function with 'where' to create your Firestore query
    const q = query(songCollectionRef, where("name", "==", searchQuery));

    try {
        const querySnapshot = await getDocs(q);

        // Clear previous results
        document.getElementById('search-results').innerHTML = '';

        if (querySnapshot.empty) {
            document.getElementById('search-results').innerText = 'No songs found.';
            return;
        }

        // Process and display results
        querySnapshot.forEach((doc) => {
            const song = doc.data();
            const songElement = document.createElement('div');
            songElement.innerText = `Name: ${song.name}, Album: ${song.album}, Artist: ${song.artist}, Year: ${song.year}, Rating: ${song.rating || 'N/A'}`;
            document.getElementById('search-results').appendChild(songElement);
        });
    } catch (error) {
        console.error("Error in searching songs: ", error);
    }
}

// Event listener for the search form
document.getElementById('search-song-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const searchQuery = document.getElementById('search-query').value.trim(); // Renamed variable to avoid conflict
    searchSongs(searchQuery);
});