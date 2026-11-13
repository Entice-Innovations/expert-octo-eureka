
import logo from "../../assets/logo.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/pages/AdminLogin.css";

import { apiRequest } from "../../services/adminService";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");

    const enteredEmail = email.trim();
    const enteredPassword = password;

    if (!enteredEmail || !enteredPassword) {
      setError("Please enter your admin email and password.");
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({
          email: enteredEmail,
          password: enteredPassword,
        }),
      });

      // Store admin login information
      localStorage.setItem("adminLoggedIn", "true");
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminId", data.admin.id);
      localStorage.setItem("adminName", data.admin.name);
      localStorage.setItem("adminEmail", data.admin.email);

      // Go to admin dashboard
      navigate("/admin/dashboard");

    } catch (error) {
      console.error("Admin login error:", error);

      setError(
        error instanceof TypeError
          ? "Unable to connect to the server. Please make sure the backend is running."
          : error.message || "Invalid admin email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-decoration decoration-one"></div>
      <div className="admin-login-decoration decoration-two"></div>

      <section className="admin-login-card">
        <div className="admin-login-brand">
          <div className="brand-mark">
            <img src={logo} alt="Infinity Pixel Studios" />
          </div>

          <div>
            <h1>Infinity Pixel Studios</h1>
            <p>ADMIN PORTAL</p>
          </div>
        </div>

        <div className="admin-login-heading">
          <span>STUDIO MANAGEMENT</span>
          <h2>Welcome back.</h2>
          <p>
            Sign in to manage customers, projects,
            payments and documents.
          </p>
        </div>

        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="admin-input-group">
            <label htmlFor="admin-email">Admin Email</label>

            <div className="admin-input-wrapper">
              <span className="admin-input-icon">✉</span>

              <input
                id="admin-email"
                type="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                autoComplete="username"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="admin-input-group">
            <label htmlFor="admin-password">Password</label>

            <div className="admin-input-wrapper">
              <span className="admin-input-icon">🔒</span>

              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                autoComplete="current-password"
                disabled={loading}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                disabled={loading}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <p className="admin-login-error">{error}</p>
          )}

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            <span>
              {loading ? "Signing in..." : "Enter Admin Portal"}
            </span>

            <span className="admin-login-arrow">
              {loading ? "…" : "↗"}
            </span>
          </button>
        </form>

        <button
          type="button"
          className="back-to-website"
          onClick={() => navigate("/")}
          disabled={loading}
        >
          ← Back to Website
        </button>

        <div className="admin-login-footer">
          <span>Infinity Pixel Studios</span>
          <span>•</span>
          <span>Secure Admin Access</span>
        </div>
      </section>
    </main>
  );
}

export default AdminLogin;
