import React from "react";
import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ onReportClick, onAuthClick }) {
    const { user, isAuthenticated } = useAuth();

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-logo">
                <div className="logo-icon">🌿</div>
                <div>
                    <div className="logo-name">WildTrack</div>
                    <div className="logo-sub">Community sightings map</div>
                </div>
            </Link>

            <div className="navbar-links">
                <NavLink to="/" end>
                    Map
                </NavLink>
                <NavLink to="/explore">Explore</NavLink>
                <NavLink to="/about">About</NavLink>
            </div>

            <div className="navbar-actions">
                <button className="auth-btn" onClick={onAuthClick} type="button">
                    {isAuthenticated ? `Account${user?.name ? `: ${user.name}` : ""}` : "Login"}
                </button>

                {!isAuthenticated && (
                    <button className="register-btn" onClick={onAuthClick} type="button">
                        Register
                    </button>
                )}

                <button className="report-btn" onClick={onReportClick} type="button">
                    Report sighting
                </button>
            </div>
        </nav>
    );
}