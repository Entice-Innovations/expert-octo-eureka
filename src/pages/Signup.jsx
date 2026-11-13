
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo1.png";
import "../styles/pages/Signup.css";
import {
  registerCustomer,
  loginCustomer,
} from "../services/customerService";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSignup = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (loading) return;

    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Register customer through customerService.js
      const registerData = await registerCustomer({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });

      let token = registerData.token;
      let customer =
        registerData.customer || registerData.data?.customer;

      let customerId =
        customer?._id ||
        customer?.id ||
        registerData.id ||
        registerData.customerId;

      // Step 2: Login if registration didn't return a token or ID.
      if (!token || !customerId) {
        let loginData;

        try {
          loginData = await loginCustomer(
            email.trim().toLowerCase(),
            password
          );
        } catch (loginError) {
          setSuccess(
            "Your account was created successfully. Please sign in to continue."
          );
          return;
        }

        token = loginData.token;
        customer = loginData.customer || customer;

        customerId =
          customer?._id ||
          customer?.id ||
          loginData.id ||
          loginData.customerId;
      }

      // Step 3: Save session and navigate to dashboard.
      if (!token || !customerId) {
        setSuccess(
          "Your account was created successfully. Please sign in to continue."
        );
        return;
      }

      const storageKeys = [
        "customerToken",
        "customerId",
        "loggedInCustomerId",
        "customer",
      ];

      storageKeys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      localStorage.setItem("customerToken", token);
      localStorage.setItem("customerId", String(customerId));
      localStorage.setItem("loggedInCustomerId", String(customerId));
      localStorage.setItem("customer", JSON.stringify(customer || {}));

      navigate("/customer/dashboard", { replace: true });

    } catch (err) {
      console.error("Signup error:", err);

      setError(
        err instanceof TypeError
          ? "Cannot connect to the server. Please check that the backend is running."
          : err.message || "Something went wrong. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT SIDE */}
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
            Create your client account to access your photography,
            projects, payments and important documents in one place.
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

      {/* RIGHT SIDE */}
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
              Create your <span>account.</span>
            </h2>

            <p>Just a few details to get started.</p>
          </div>

          <form className="login-form" onSubmit={handleSignup}>
            {/* FULL NAME */}
            <div className="form-field">
              <label htmlFor="signupName">FULL NAME</label>
              <div className="input-wrapper">
                <span className="input-icon">♙</span>
                <input
                  id="signupName"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="form-field">
              <label htmlFor="signupEmail">EMAIL ADDRESS</label>
              <div className="input-wrapper">
                <span className="input-icon">@</span>
                <input
                  id="signupEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoCapitalize="none"
                  required
                />
              </div>
            </div>

            {/* MOBILE */}
            <div className="form-field">
              <label htmlFor="signupPhone">MOBILE NUMBER</label>
              <div className="input-wrapper">
                <span className="input-icon">☎</span>
                <input
                  id="signupPhone"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="form-field">
              <label htmlFor="signupPassword">PASSWORD</label>
              <div className="input-wrapper">
                <span className="input-icon">•</span>
                <input
                  id="signupPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
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
            </div>

            {/* ERROR */}
            {error && (
              <div className="login-error" role="alert">
                <span>!</span> {error}
              </div>
            )}

            {/* SUCCESS / SIGN IN FALLBACK */}
            {success && (
              <div
                role="status"
                style={{
                  margin: "16px 0",
                  padding: "14px",
                  borderRadius: "10px",
                  background: "#edf5eb",
                  border: "1px solid #b8d5b1",
                  color: "#26351f",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                {success}
                <p style={{ marginBottom: 0 }}>
                  <Link
                    to="/login"
                    style={{
                      color: "#26351f",
                      fontWeight: 700,
                      textDecoration: "underline",
                    }}
                  >
                    Go to Sign In →
                  </Link>
                </p>
              </div>
            )}

            {!success && (
              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                <span>
                  {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
                </span>
                {!loading && <span className="login-arrow">↗</span>}
              </button>
            )}
          </form>

          <div className="login-divider">
            <span />
            <p>ALREADY HAVE AN ACCOUNT?</p>
            <span />
          </div>

          <Link to="/login" className="signup-link">
            Sign in to your account <span>↗</span>
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

export default Signup;
