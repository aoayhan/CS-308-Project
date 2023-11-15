// Import Firebase modules
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { app } from './app.js'; // Import the Firebase app initialization from your existing app.js

// Get a reference to the Firebase Auth object
const auth = getAuth(app);

// Function to log in the user
function loginUser(email, password) {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            var user = userCredential.user;
            alert("Login successful! Welcome, " + user.email);
            window.location.href = 'addsong.html';
        })
        .catch((error) => {
            var errorCode = error.code;
            var errorMessage = error.message;
            alert("Invalid Credentials");
        });
}

// Event listener for the login form
document.getElementById('login-form').addEventListener('submit', function(event){
    event.preventDefault();
    var email = document.getElementById('login-email').value;
    var password = document.getElementById('login-password').value;
    loginUser(email, password);
});