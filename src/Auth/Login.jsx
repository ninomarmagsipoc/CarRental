import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Css/login.css";

function Login({ setIsLogIn }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notVerified, setNotVerified] = useState(false);

  // Handle login
  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill all fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setNotVerified(false);

    try {
      const response = await fetch("https://localhost:7263/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        // Handle errors
        const msg = data.message?.toLowerCase() || "";
        if (msg.includes("verify")) {
          setError("Your account is not verified.");
          setNotVerified(true);
        } else if (response.status === 401) {
          setError("Wrong password.");
        } else if (response.status === 404) {
          setError("User not found.");
        } else {
          setError(data.message || "Login failed.");
        }
        return;
      }

      // ✅ Success
      // ✅ Success
      const user = data.Data || data.data;
      const isVerified = user?.IsVerified || user?.isVerified;
      const role = user?.Role || user?.role;

      if (!isVerified) {
        setError("Your account is not verified.");
        setNotVerified(true);
        return;
      }

      // Save individual fields (keep these if your navbar or other components use them)
      localStorage.setItem("userId", user.id || user.Id);
      localStorage.setItem("userEmail", user.email || user.Email);
      localStorage.setItem("userRole", role);

      // ✅ CRITICAL FIX: Save the entire user object as JSON for the Profile page
      // We also make sure the ID key is named 'userId' so your FormData in Profile.jsx works perfectly
      const userToSave = {
        ...user,
        userId: user.id || user.Id, // Normalize the ID key
        name: user.name || user.Name || "", // Ensure name exists
        profileImage: user.profileImage || user.ProfileImage || null
      };

      if (role === "Admin") {
        localStorage.setItem("admin", JSON.stringify(userToSave));
      } else {
        localStorage.setItem("user", JSON.stringify(userToSave));
      }
      setIsLogIn(true);

      // Optional: handle admin redirect
      if (role === "Admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }

    } catch (err) {
      console.error("Error logging in:", err);
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP if not verified
  const handleResendOtp = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`https://localhost:7263/api/auth/send-otp?email=${email}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess("OTP sent! Check your email.");
        setTimeout(() => navigate("/verify", { state: { email } }), 1000);
      } else {
        setError(data.message || "Failed to resend OTP");
      }

    } catch (err) {
      console.error(err);
      setError("Error sending OTP.");
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
          <p className="login-sub">Login to continue</p>

          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <input
              type="email"
              placeholder="Email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <button className="login-btn" disabled={loading}>
            {loading ? "Forgot" : <Link to="/forgot">Forgot Password</Link>}
          </button>

          {/* Resend OTP if not verified */}
          {notVerified && (
            <button
              onClick={handleResendOtp}
              className="login-btn"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Resend OTP"}
            </button>
          )}

          <p className="login-footer">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;