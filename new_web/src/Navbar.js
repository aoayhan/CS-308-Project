// Navbar.js
import React from 'react';
import { Link } from 'react-router-dom'; // Make sure to install react-router-dom if you haven't already
import './navbar.css'; // Your CSS file for styling the navbar

function Navbar() {
    return (
        <nav className="navbar">
            <ul className="navbar-nav"> {/* className must match your navbar.css classes */}
                <li className="nav-item">
                    <Link to="/tracks" className="nav-link">Tracks</Link>
                </li>
                <li className="nav-item">
                    <Link to="/friends" className="nav-link">Friends</Link>
                </li>
                <li className="nav-item">
                    <Link to="/recommendations" className="nav-link">Recommendations</Link>
                </li>
                {/* Add other navigation links as needed */}
            </ul>
        </nav>
    );
}

export default Navbar;
