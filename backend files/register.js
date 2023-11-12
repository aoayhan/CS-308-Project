import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { app } from './app.js'; // Import the Firebase app initialization

const auth = getAuth(app);

function registerUser(email, password) {
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            var user = userCredential.user;
            // Handle post-registration actions
            alert("Registration successful for " + email);

        })
        .catch((error) => {
            var errorCode = error.code;
            var errorMessage = error.message;
            alert("Registration failed: " + errorMessage);
        });
}

document.getElementById('registration-form').addEventListener('submit', function(event){
    event.preventDefault();
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    registerUser(email, password);
});
