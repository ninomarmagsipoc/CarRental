import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Css/login.css";

function Login({ setIsLogIn }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // show resend OTP option
  const [success, setSuccess] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill all fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("https://localhost:7263/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
          if (response.status === 401) {
            setError("Wrong password.");
        } else if (response.status === 404) {
          setError("User not found.");
        } else {
          setError(data.message || "Login failed.");
        }
      } else {
        // Check if the user is verified
        const user = data.Data || data.data;

        const isVerified = user?.isVerified === true || user?.IsVerified === "true";

        if(isVerified){
          setIsLogIn(true);
          navigate("/", {replace: true});
        } else {
            setError(data.message);
          }
         
        }
        
      
    } catch (err) {
      console.error("Error logging in:", err);
      setError("Cannot connect to server. Please try again.");
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

          <p className="login-footer">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;