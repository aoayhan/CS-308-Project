const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require('/Users/anilayhan/Desktop/CS308 2/backend server/cs308fire-firebase-adminsdk-3258q-016c92bbad.json');
const app = express();

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://console.firebase.google.com/project/cs308fire/database/cs308fire-default-rtdb/data'
});

app.use(express.json());

// User Registration (Sign-Up) Endpoint
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password
    });

    res.status(201).json({ message: 'User created successfully', user: userRecord });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Login Endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRecord = await admin.auth().getUserByEmail(email);

    // Check if the provided password matches the stored password
    // You can implement your own password comparison logic here

    // For simplicity, let's assume the password matches for this example
    // In a real application, you should use a secure password hashing library
    // and compare the hashed password with the stored hashed password

    res.status(200).json({ message: 'Login successful', user: userRecord });
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
