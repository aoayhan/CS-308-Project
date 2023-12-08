// src/App.js
import React, { useEffect, useState } from 'react';
import LoginPage from './LoginPage';
import { auth } from './firebase-config'; // Adjust the path based on where your firebase-config.js is located
import { onAuthStateChanged } from "firebase/auth";
import HomePage from './HomePage';
import {BrowserRouter as Router, Route, Navigate, Routes} from 'react-router-dom';
import Tracks from "./Tracks";
function App() {
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUser(user);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    return (
        <Router>
            <Routes>
                <Route path="/LoginPage" element={<LoginPage />} />
                <Route path="/" element={currentUser ? <Navigate to="/home" /> : <LoginPage />} />
                <Route path="/HomePage" element={<HomePage />} />
                <Route path="/Tracks" element={<Tracks />} />
                {/* Other routes can be added here */}
            </Routes>
        </Router>
    );
}

export default App;