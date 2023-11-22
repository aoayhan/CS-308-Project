import { db } from './app.js';
import { collection, addDoc, getDocs, getDoc, where, query, doc, updateDoc, arrayUnion, serverTimestamp} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

const auth = getAuth();

onAuthStateChanged(auth, (user) => {
    if (user) {
        fetchSongs(user);
    } else {
        alert("No user logged in");
        window.location.href = 'login.html'; // Uncomment to redirect

        // Optional: Redirect to login page or show a message
    }
});
async function fetchSongs(user) {
   
    const songCollectionRef = collection(db, "song");
    const q = query(songCollectionRef, where("userId", "==", user.email));

    const querySnapshot = await getDocs(q);

    let ratedSongs = [];
    let unratedSongs = [];

    querySnapshot.forEach((doc) => {
        const song = { id: doc.id, ...doc.data() };
        (song.rating !== undefined && song.rating !== null) ? ratedSongs.push(song) : unratedSongs.push(song);
    });

    // Sort rated songs alphabetically by name
    ratedSongs.sort((a, b) => a.name.localeCompare(b.name));
    // Sort unrated songs alphabetically by name
    unratedSongs.sort((a, b) => a.name.localeCompare(b.name));

    const songsContainer = document.getElementById('songs-container');
    songsContainer.innerHTML = '';

    // First display rated songs
    if (ratedSongs.length) {
        displaySongs(ratedSongs, 'Rated Songs');
    }
    // Then display unrated songs
    if (unratedSongs.length) {
        displaySongs(unratedSongs, 'Unrated Songs');
    }
}

function displaySongs(songs, title) {
    const songsContainer = document.getElementById('songs-container');
    const section = document.createElement('section');
    const sectionTitle = document.createElement('h2');
    sectionTitle.textContent = title;
    section.appendChild(sectionTitle);

    songs.forEach(song => {
        const songElement = document.createElement('div');
        const ratingInput = document.createElement('input');
        ratingInput.type = 'number';
        ratingInput.id = `rating-${song.id}`;
        ratingInput.min = 1;
        ratingInput.max = 10;
        ratingInput.value = song.rating || '';

        const rateButton = document.createElement('button');
        rateButton.textContent = 'Rate';
        rateButton.addEventListener('click', () => rateSong(song.id, ratingInput.value));

        songElement.innerHTML = `
            <p><strong>${song.name}</strong> by ${song.artist} - Album: ${song.album}, Year: ${song.year}</p>
            <label for="rating-${song.id}">Rating:</label>
        `;
        songElement.appendChild(ratingInput);
        songElement.appendChild(rateButton);

        section.appendChild(songElement);
    });

    songsContainer.appendChild(section);
}

async function rateSong(songId, newRating) {
    const parsedRating = parseInt(newRating, 10);
    const user = auth.currentUser;

    if (!user) {
        alert("You must be logged in to rate songs.");
        return;
    }

    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 10) {
        alert("Rating must be a number between 1 and 10.");
        return;
    }

    const songDocRef = doc(db, "song", songId);
    const ratingHistoryRef = collection(songDocRef, "ratingHistory");

    try {
        const songDoc = await getDoc(songDocRef);
        const currentRating = songDoc.data()?.rating;

        // Update the current rating
        await updateDoc(songDocRef, {
            rating: parsedRating
        });

        // Add the old rating to the rating history
        if (currentRating !== undefined && currentRating !== null) {
            await addDoc(ratingHistoryRef, {
                oldRating: currentRating,
                newRating: parsedRating,
                updatedAt: serverTimestamp(), // Correct usage
                userId: user.uid // User identifier
            });
        }

        alert("Rating updated successfully!");
    } catch (error) {
        console.error("Error updating song rating: ", error);
        alert("Error updating rating.");
    }
}
