import { db } from './app.js';
import { collection, query, getDocs, where } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

document.getElementById('export-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const artist = document.getElementById('artist-filter').value.trim();
    await exportRatingsData(artist);
});

async function exportRatingsData(artist) {
    const songCollectionRef = collection(db, "song");
    let q = songCollectionRef;

    if (artist) {
        q = query(songCollectionRef, where("artist", "==", artist));
    }

    try {
        const querySnapshot = await getDocs(q);
        // Exclude 'id' and 'userId' from each document
        const data = querySnapshot.docs.map(doc => {
            const { id, userId, ...rest } = doc.data(); 
            return rest; // Return the rest of the data, excluding 'id' and 'userId'
        });

        downloadJSON(data);
    } catch (error) {
        console.error("Error fetching data: ", error);
    }
}

function downloadJSON(data) {
    const dataStr = JSON.stringify(data);
    const blob = new Blob([dataStr], { type: 'application/json' });

    const elem = window.document.createElement('a');
    elem.href = window.URL.createObjectURL(blob);
    elem.download = "exported_data.json";
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
}
