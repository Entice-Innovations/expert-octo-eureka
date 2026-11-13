
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo1.png";
import "../styles/pages/ForgotPassword.css";

import {
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetCustomerPassword,
} from "../services/customerService";

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loginValue, setLoginValue] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  // STEP 1 - SEND EMAIL OTP
  const handleSendOtp = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!loginValue.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetOtp(loginValue.trim());

      setMessage("OTP sent to your registered email address.");
      setStep(2);
    } catch (error) {
      setError(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 - VERIFY OTP
  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    clearMessages();

    if (otp.trim().length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const data = await verifyPasswordResetOtp(
        loginValue.trim(),
        otp.trim()
      );

      setResetToken(data.resetToken);
      setMessage("OTP verified successfully.");
      setStep(3);
    } catch (error) {
      setError(error.message || "Unable to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 3 - RESET PASSWORD
  const handleResetPassword = async (event) => {
    event.preventDefault();
    clearMessages();

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await resetCustomerPassword(
        loginValue.trim(),
        resetToken,
        newPassword
      );

      setMessage(
        "Password reset successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setError(error.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  // BACK BUTTON
  const handleBack = () => {
    clearMessages();

    if (step === 1) {
      navigate("/login");
      return;
    }

    if (step === 2) {
      setOtp("");
    }

    if (step === 3) {
      setNewPassword("");
      setConfirmPassword("");
    }

    setStep(step - 1);
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card">

        {/* BRAND */}
        <div className="forgot-brand">
          <div className="brand-mark">
            <img src={logo} alt="Infinity Pixel Studios" />
          </div>

          <div>
            <h1>Infinity Pixel</h1>
            <span>STUDIOS</span>
          </div>
        </div>

        {/* STEP 1 - EMAIL */}
        {step === 1 && (
          <>
            <div className="forgot-heading">
              <h2>Forgot Password?</h2>
              <p>
                Enter your registered email address
                to reset your password.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="forgot-form">
              <label>Email Address</label>

              <input
                type="email"
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
                placeholder="Enter your registered email"
                autoComplete="username"
                required
              />

              {error && <div className="forgot-error">{error}</div>}
              {message && <div className="forgot-success">{message}</div>}

              <button
                type="submit"
                className="forgot-submit"
                disabled={loading}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>

            <button
              type="button"
              className="back-login"
              onClick={() => navigate("/login")}
            >
              ← Back to Login
            </button>
          </>
        )}

        {/* STEP 2 - VERIFY OTP */}
        {step === 2 && (
          <>
            <div className="forgot-heading">
              <h2>Verify OTP</h2>
              <p>
                Enter the 6-digit OTP sent to your
                registered email address.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="forgot-form">
              <label>Enter OTP</label>

              <input
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value.replace(/\D/g, "").slice(0, 6)
                  )
                }
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                className="otp-input"
                autoFocus
                required
              />

              {error && <div className="forgot-error">{error}</div>}
              {message && <div className="forgot-success">{message}</div>}

              <button
                type="submit"
                className="forgot-submit"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>

            <div className="step-actions">
              <button
                type="button"
                onClick={handleBack}
                className="secondary-button"
              >
                ← Back
              </button>
            </div>
          </>
        )}

        {/* STEP 3 - NEW PASSWORD */}
        {step === 3 && (
          <>
            <div className="forgot-heading">
              <h2>Create New Password</h2>
              <p>
                Your OTP has been verified.
                Create a new password for your account.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="forgot-form">
              <label>New Password</label>

              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                required
              />

              <label>Confirm Password</label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                required
              />

              <p className="password-hint">
                Password must contain at least 6 characters.
              </p>

              {error && <div className="forgot-error">{error}</div>}
              {message && <div className="forgot-success">{message}</div>}

              <button
                type="submit"
                className="forgot-submit"
                disabled={loading}
              >
                {loading ? "Updating Password..." : "Reset Password"}
              </button>
            </form>
          </>
        )}

        {/* PROGRESS */}
        <div className="forgot-progress">
          <span className={step >= 1 ? "progress-dot active" : "progress-dot"} />
          <span className="progress-line" />
          <span className={step >= 2 ? "progress-dot active" : "progress-dot"} />
          <span className="progress-line" />
          <span className={step >= 3 ? "progress-dot active" : "progress-dot"} />
        </div>

        {/* FOOTER */}
        <div className="forgot-footer">
          <span>Remember your password?</span>
          <Link to="/login">Login</Link>
        </div>

      </div>
    </div>
  );
}

export default ForgotPassword;
