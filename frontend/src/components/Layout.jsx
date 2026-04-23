import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import ReportModal from "./ReportModal";
import AuthModal from "./AuthModal";

export default function Layout() {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const handleAuthOpen = (mode = "login") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="app">
      <Navbar
        onReportClick={() => setReportModalOpen(true)}
        onAuthClick={() => handleAuthOpen("login")}
        onRegisterClick={() => handleAuthOpen("register")}
      />

      <Outlet />

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={(sighting) => {
          window.dispatchEvent(new CustomEvent("sighting-created", { detail: sighting }));
          setReportModalOpen(false);
        }}
      />

      <AuthModal
        isOpen={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}