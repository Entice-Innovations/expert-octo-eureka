
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo1.png";
import "../styles/pages/Login.css";
import { loginCustomer } from "../services/customerService";

function Login() {
  const navigate = useNavigate();

  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();
    if (loading) return;

    setError("");

    if (!loginValue.trim() || !password) {
      setError("Enter your email/mobile number and password.");
      return;
    }

    setLoading(true);

    try {
      // Login API is handled by customerService.js
      const data = await loginCustomer(
        loginValue.trim(),
        password
      );

      const customerId =
        data.customer?._id || data.customer?.id || data.id;

      if (!data.token || !customerId) {
        throw new Error(
          "Login information is incomplete. Please try again."
        );
      }

      // Keep the customer signed in across browser visits.
      const keys = [
        "customerToken",
        "customerId",
        "loggedInCustomerId",
        "customer",
      ];

      keys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      localStorage.setItem("customerToken", data.token);
      localStorage.setItem("customerId", String(customerId));
      localStorage.setItem("loggedInCustomerId", String(customerId));
      localStorage.setItem(
        "customer",
        JSON.stringify(data.customer || {})
      );

      navigate("/customer/dashboard", { replace: true });

    } catch (err) {
      console.error("Login error:", err);

      setError(
        err instanceof TypeError
          ? "Cannot connect to the server. Please try again."
          : err.message || "Login failed. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-visual">
        <div className="login-visual-image" />
        <div className="login-visual-overlay" />

        <Link to="/" className="login-brand">
          <img
            src={logo}
            alt="Infinity Pixel Studios"
            className="portal-logo"
          />
          <span className="login-brand-text">
            INFINITY PIXEL
            <small>STUDIOS</small>
          </span>
        </Link>

        <div className="login-visual-content">
          <p className="login-eyebrow">INFINITY PIXEL STUDIOS</p>
          <h1>
            Your memories,
            <br />
            <em>beautifully preserved.</em>
          </h1>
          <p className="login-visual-description">
            Your photography, payments and important documents,
            all in one place.
          </p>
          <div className="login-line" />
          <span className="login-caption">
            YOUR STORY · YOUR MOMENTS · YOUR MEMORIES
          </span>
        </div>

        <div className="login-visual-footer">
          <span>© Infinity Pixel Studios</span>
          <span>EST. 2026</span>
        </div>
      </section>

      <section className="login-form-section">
        <div className="login-form-wrapper">
          <div className="mobile-login-brand">
            <span className="mobile-brand-mark">IP</span>
            <span>
              INFINITY PIXEL
              <small>STUDIOS</small>
            </span>
          </div>

          <div className="login-heading">
            <span className="login-small-label">CLIENT PORTAL</span>
            <h2>
              Welcome <span>back.</span>
            </h2>
            <p>Sign in to access your photography portal.</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-field">
              <label htmlFor="loginValue">
                EMAIL OR MOBILE NUMBER
              </label>
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">
                  @
                </span>
                <input
                  id="loginValue"
                  type="text"
                  placeholder="Email or mobile number"
                  value={loginValue}
                  onChange={(e) => setLoginValue(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="password">PASSWORD</label>
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">
                  •
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>

              <div className="forgot-password-row">
                <Link
                  to="/forgot-password"
                  className="forgot-password-link"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <span>!</span> {error}
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              <span>
                {loading ? "SIGNING IN..." : "SIGN IN"}
              </span>
              {!loading && (
                <span className="login-arrow">↗</span>
              )}
            </button>
          </form>

          <div className="login-divider">
            <span />
            <p>NEW TO INFINITY PIXEL?</p>
            <span />
          </div>

          <Link to="/signup" className="signup-link">
            Create your client account <span>↗</span>
          </Link>

          <p className="login-security">
            Your account and personal information are protected.
          </p>
        </div>

        <div className="login-corner-detail">
          <span>01</span>
          <span>CLIENT ACCESS</span>
        </div>
      </section>
    </div>
  );
}

export default Login;
