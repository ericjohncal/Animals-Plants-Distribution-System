import React from "react";
import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ onReportClick }) {
    return (
        <nav className="navbar">
            <Link to="/" className="navbar-logo">
                <div className="logo-icon">🌿</div>
                <div>
                    <div className="logo-name">WildAtlas</div>
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

            <button className="report-btn" onClick={onReportClick}>
                Report sighting
            </button>
        </nav>
    );
}