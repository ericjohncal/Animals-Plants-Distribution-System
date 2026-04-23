import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./AuthModal.css";

export default function AuthModal({ isOpen, mode = "login", onClose }) {
  const { user, login, register, logout, isAuthenticated } = useAuth();
  const [authMode, setAuthMode] = useState(mode);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    location: "",
  });

  useEffect(() => {
    setAuthMode(mode);
    setFormError("");
  }, [mode, isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      await login(loginData);
      onClose();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      await register(registerData);
      onClose();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const isLogin = authMode === "login";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isAuthenticated ? "Account" : isLogin ? "Login" : "Register"}</h2>
          <button className="modal-close" onClick={onClose} type="button">
            ×
          </button>
        </div>

        {!isAuthenticated && (
          <div className="auth-tabs">
            <button
              type="button"
              className={isLogin ? "auth-tab active" : "auth-tab"}
              onClick={() => setAuthMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={!isLogin ? "auth-tab active" : "auth-tab"}
              onClick={() => setAuthMode("register")}
            >
              Register
            </button>
          </div>
        )}

        {formError && <div className="auth-error">{formError}</div>}

        {isAuthenticated ? (
          <div className="account-card">
            <div className="account-row">
              <span className="account-label">Name</span>
              <span className="account-value">{user?.name || "—"}</span>
            </div>
            <div className="account-row">
              <span className="account-label">Email</span>
              <span className="account-value">{user?.email || "—"}</span>
            </div>
            <div className="account-row">
              <span className="account-label">Location</span>
              <span className="account-value">{user?.location || "—"}</span>
            </div>

            <button className="submit-btn" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        ) : isLogin ? (
          <form className="modal-form" onSubmit={handleLoginSubmit}>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            <button className="submit-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Log in"}
            </button>
          </form>
        ) : (
          <form className="modal-form" onSubmit={handleRegisterSubmit}>
            <div className="field">
              <label>Name</label>
              <input
                value={registerData.name}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={registerData.password}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, password: e.target.value }))
                }
                required
              />
            </div>

            <div className="field">
              <label>Location</label>
              <input
                value={registerData.location}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="Optional"
              />
            </div>

            <button className="submit-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Register"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}