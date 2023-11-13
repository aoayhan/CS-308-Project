
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';


// Web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDdOI7OFmwajeufUvbp7I0_QbOKLK0whr4",
    authDomain: "cs308fire.firebaseapp.com",
    databaseURL: "https://cs308fire-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "cs308fire",
    storageBucket: "cs308fire.appspot.com",
    messagingSenderId: "351363273489",
    appId: "1:351363273489:web:0d0d6bd36e77b4c28772b0",
    measurementId: "G-0LVPP6YBVR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


export const db = getFirestore(app);

const auth = getAuth(app);
export { app };
