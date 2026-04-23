import React from "react";
import "./Navbar.css";

export default function Navbar({ onReportClick }) {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <div className="logo-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="7" r="3" fill="#c0dd97" />
            <path d="M9 10 C5 10 3 13 3 16" stroke="#c0dd97" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M9 10 C13 10 15 13 15 16" stroke="#c0dd97" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M9 10 L9 16" stroke="#c0dd97" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div className="logo-name">WildAtlas</div>
          <div className="logo-sub">Species Distribution</div>
        </div>
      </div>

      <div className="navbar-links">
        <span>Map</span>
        <span>Species</span>
        <span>Data</span>
        <span>About</span>
      </div>

      <button className="report-btn" onClick={onReportClick}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6.5" cy="6.5" r="5.5" stroke="#c0dd97" strokeWidth="1.5" />
          <path d="M6.5 4V9M4 6.5H9" stroke="#c0dd97" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Submit a sighting
      </button>
    </nav>
  );
}
