import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Css/login.css";

function Register() {
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        
        if (!firstName || !lastName || !email || !password) {
            setError("All fields are required.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch("https://localhost:7263/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firstName, lastName, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Registration failed.");
                setLoading(false);
                return;
            }

            navigate("/verify", { state: { email: email } });

        } catch (err) {
            setError("Error connecting to server.");
            console.error(err);
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
                    <p className="login-sub">Register to get started</p>

                    {error && <p style={{ color: "red" }}>{error}</p>}

                    <input
                        type="text"
                        placeholder="First Name"
                        className="login-input"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />

                    <input
                        type="text"
                        placeholder="Last Name"
                        className="login-input"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />

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

                    <button className="login-btn" onClick={handleRegister} disabled={loading}>
                        {loading ? "Registering..." : "Register"}
                    </button>

                    <p className="login-footer">
                        Already have an account?{" "}
                        <span className="link">
                            <Link to="/login">Login</Link>
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;