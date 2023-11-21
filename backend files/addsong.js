import { db } from './app.js';
import { collection, addDoc, getDocs, where, query} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { getAuth, signOut } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

export async function addSongDetails(songName, album, artists, year, rating) {
    const songCollectionRef = collection(db, "song");
    const auth = getAuth();

    const user = auth.currentUser;

    if (!user) {
        alert("Please log in to add songs.");
        return;
    }
    // Splitting the artist string into an array
    const artistArray = artists.split(',').map(artist => artist.trim());
    const mainArtist = artistArray[0];
    const featuredArtists = artistArray.slice(1);

    // Check if the song already exists
    const songExistsQuery = query(songCollectionRef, where("name", "==", songName), where("artist", "==", mainArtist));
    const querySnapshot = await getDocs(songExistsQuery);

    if (!querySnapshot.empty) {
        alert("A song with this name and artist already exists.");
        return;
    }

    // Validate required fields
    if (!songName || !album || !mainArtist || !year) {
        console.error("Missing required song details: name, album, artist, year");
        alert("Please provide all required song details: name, album, artist, and year.");
        return;
    }

    // Prepare song data, including rating and featured artists if provided
    const songData = {
        name: songName,
        album: album,
        artist: mainArtist,
        year: year,
        userId: user.email,
        ...(rating && { rating: rating }),
        ...(featuredArtists.length > 0 && { feature: featuredArtists }) // Add featured artists if they exist
    };

    try {
        // Add a new document with the song details
        const docRef = await addDoc(songCollectionRef, songData);
        console.log("Song details added with ID: ", docRef.id);
    } catch (error) {
        console.error("Error adding song details: ", error);
    }
}
function logoutUser() {
    const auth = getAuth();
    signOut(auth).then(() => {
        window.location.href = 'login.html'; // Redirect to login page after logout
    }).catch((error) => {
        console.error("Error signing out: ", error);
    });
}
async function addSongToDatabase(songName, album, artist, year) {
    // Since the Spotify API does not provide a rating, you can set it to null or a default value
    const rating = null; // or any default value you deem appropriate

    try {
        await addSongDetails(songName, album, artist, year, rating);
        alert("Song added to database.");
    } catch (error) {
        console.error("Error adding song from Spotify to database: ", error);
        alert("Error adding song to database.");
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
    try {
        const response = await fetch('http://localhost:3000/spotify-search?q=' + encodeURIComponent(searchQuery));
        const data = await response.json();

        // Clear previous results
        document.getElementById('search-results').innerHTML = '';

        // Process and display results
        data.tracks.items.forEach(track => {
            const trackElement = document.createElement('div');
            trackElement.style.marginBottom = '10px';
    
            // Add track details
            trackElement.innerHTML = `
                Track: ${track.name}, 
                Artist: ${track.artists.map(artist => artist.name).join(", ")}, 
                Album: ${track.album.name}, 
                Year: ${track.album.release_date.split("-")[0]}
            `;
    
            // Create and append the Add button
            const addButton = document.createElement('button');
            addButton.textContent = 'Add to Database';
            addButton.onclick = () => addSongToDatabase(track.name, track.album.name, track.artists.map(artist => artist.name).join(", "), track.album.release_date.split("-")[0]);
            trackElement.appendChild(addButton);
    
            document.getElementById('search-results').appendChild(trackElement);
        });
    } catch (error) {
        console.error("Error in searching songs: ", error);
        // Handle errors, such as displaying a message to the user
    }
}
document.getElementById('logout-button').addEventListener('click', logoutUser);
document.getElementById('search-song-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const searchQuery = document.getElementById('search-query').value.trim();
    searchSongs(searchQuery);
});

