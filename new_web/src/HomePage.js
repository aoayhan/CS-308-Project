import React from 'react';
import { Link } from 'react-router-dom';
import './homepage.css';
import './navbar.css';
import './Tracks';

function HomePage() {
    return (
        <>
            <nav className="navbar">
                <ul>
                    <li><Link to="/tracks">Tracks</Link></li>
                    <li><Link to="/friends">Friends</Link></li>
                    <li><Link to="/recommendations">Recommendations</Link></li>
                </ul>
            </nav>
            <div className="home-container">
                <h1 className="home-header">Welcome to the Home Page</h1>
                <button className="home-button">Some Action</button>
                <h2>Your music is here</h2>
                {/* Content for songs, friends, recommendations will go here */}
            </div>
        </>
    );
}

export default HomePage;
