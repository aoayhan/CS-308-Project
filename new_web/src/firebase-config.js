// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDdOI7OFmwajeufUvbp7I0_QbOKLK0whr4",
    authDomain: "cs308fire.firebaseapp.com",
    databaseURL: "https://cs308fire-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "cs308fire",
    storageBucket: "cs308fire.appspot.com",
    messagingSenderId: "351363273489",
    appId: "1:351363273489:web:ad65c9a333fbc8f68772b0",
    measurementId: "G-M7Q7FT4GFR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);