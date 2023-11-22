import { db } from './app.js';
import { collection, query, getDocs, where } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

const auth = getAuth();
const ratingHistoryContainer = document.getElementById('rating-history-container');

onAuthStateChanged(auth, user => {
    if (user) {
        fetchRatingHistory(user);
    } else {
        ratingHistoryContainer.innerHTML = '<p>Please log in to view rating history.</p>';
    }
});

async function fetchRatingHistory(user) {
    const songCollectionRef = collection(db, "song");
    const userSongsQuery = query(songCollectionRef, where("userId", "==", user.email));

    const querySnapshot = await getDocs(userSongsQuery);
    querySnapshot.forEach(async songDoc => {
        const ratingHistoryRef = collection(songDoc.ref, "ratingHistory");
        const ratingHistorySnapshot = await getDocs(ratingHistoryRef);
        
        const songHistoryDiv = document.createElement('div');
        songHistoryDiv.innerHTML = `<h3>${songDoc.data().name}</h3>`;
        
        ratingHistorySnapshot.forEach(historyDoc => {
            const history = historyDoc.data();
            songHistoryDiv.innerHTML += `<p>Old Rating: ${history.oldRating}, New Rating: ${history.newRating}, Date: ${history.updatedAt.toDate()}</p>`;
        });

        ratingHistoryContainer.appendChild(songHistoryDiv);
    });
}
