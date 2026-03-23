import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Css/login.css"

function Login({ setIsLogIn }) {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {

    if (email === "admin@gmail.com" && password === "1234") {
      setIsLogIn(true);
      navigate("/", { replace: true });
    } else {
      alert("Invalid login");
    }

  }


  return (
    <div className="body1">
      <div className="login-overlay">
        <div className="login-card">

          <h1 className="logo-text">JKLM</h1>
                <span className="logo-sub">Car Rental</span>
          <p className="login-sub">Login to continue</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}>
            <input
              type="email"
              placeholder="Email"
              className="login-input"
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="login-input"
              onChange={(e) => setPassword(e.target.value)}
            />

            <button className="login-btn" type="sumbit">
              Login
            </button>
          </form>

          <p className="login-footer">
            Don't have an account? <Link to="/register">Register</Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Login;