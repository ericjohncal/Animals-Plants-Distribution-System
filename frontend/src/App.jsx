import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Layout from "./components/Layout";
import MapPage from "./pages/MapPage";

function PlaceholderPage({ title }) {
  return (
    <main className="main">
      <section className="section">
        <h1 className="hero-heading">{title}</h1>
        <p className="hero-sub">This page will be implemented soon.</p>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<MapPage />} />
          <Route path="/explore" element={<PlaceholderPage title="Explore" />} />
          <Route path="/about" element={<PlaceholderPage title="About" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
