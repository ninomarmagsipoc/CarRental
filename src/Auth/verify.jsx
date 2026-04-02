import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import "../Css/login.css";

function Verify() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email; // Must pass from Register page

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timer, setTimer] = useState(60); // 5 minutes countdown
  const [loading, setLoading] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // Format timer as mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Verify OTP
  const handleVerify = async () => {

    if (!otp) {
      setError("Please enter OTP.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `https://localhost:7263/api/auth/verify-otp?email=${email}&code=${otp}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Verification failed.");
        return;
      }

      setSuccess("Email verified successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error(err);
      setError("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (timer > 0) return; // Cooldown

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `https://localhost:7263/api/auth/send-otp?email=${email}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to resend OTP.");
        return;
      }

      setSuccess("OTP resent! Check your email.");
      setTimer(60); // reset 1 minute
    } catch (err) {
      console.error(err);
      setError("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="body1">
      <div className="login-overlay">
        <div className="login-card">
          <h1 className="logo-text">JKLM</h1>
          <span className="logo-sub">Car Rental</span>
          <p className="login-sub">Enter OTP sent to your email</p>

          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}

          <input
            type="text"
            placeholder="Enter OTP"
            className="login-input"
            value={otp}
            onChange={(e) => setOtp(e.target.value.trim())}
            disabled={loading}
          />

          <button
            type="button"
            className="login-btn"
            onClick={handleVerify}
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>

          <p>Time remaining: {formatTime(timer)}</p>

          <button
            type="button"
            className="login-btn"
            onClick={handleResend}
            disabled={loading || timer > 0}
          >
            {loading ? "Resending..." : timer > 0 ? `Resend OTP (${formatTime(timer)})` : "Resend OTP"}
          </button>

          <p className="login-footer">
            Already verified?{" "}
            <span className="link">
              <Link to="/login">Login</Link>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Verify;