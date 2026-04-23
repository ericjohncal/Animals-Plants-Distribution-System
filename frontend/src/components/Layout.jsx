import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import ReportModal from "./ReportModal";

export default function Layout() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="app">
      <Navbar onReportClick={() => setModalOpen(true)} />

      <Outlet />

      <ReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={() => setModalOpen(false)}
      />
    </div>
  );
}