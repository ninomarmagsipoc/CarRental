import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Css/login.css";

function Register() {
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {

        let newErrors = {};

        // Required
        if (!firstName) newErrors.firstName = "First name is required";
        if (!lastName) newErrors.lastName = "Last name is required";
        if (!email) newErrors.email = "Email is required";
        if (!password) newErrors.password = "Password is required";
        if (!confirmPassword) newErrors.confirmPassword = "Confirm your password";


        // Password match
        if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        // Strong password
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/;
        if (password && !passwordRegex.test(password)) {
            newErrors.password = "Must include uppercase, lowercase, number, symbol";
        }

        // If adunay errors, stop
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            const response = await fetch("https://localhost:7263/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firstName, lastName, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                setErrors({ general: data.message || "Registration failed" });
                setLoading(false);
                return;
            }

            navigate("/verify", { state: { email: email } });

        } catch (err) {
            setErrors({ general: "Server error" });
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
                    <p className="login-sub">Register to continue</p>

                    {errors.general && <p style={{ color: "red" }}>{errors.general}</p>}

                    <input
                        type="text"
                        placeholder="First Name"
                        className="login-input"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        maxLength={50}
                    />
                    {errors.firstName && <p style={{ color: "red" }}>{errors.firstName}</p>}

                    <input
                        type="text"
                        placeholder="Last Name"
                        className="login-input"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        maxLength={50}
                    />
                    {errors.lastName && <p style={{ color: "red" }}>{errors.lastName}</p>}

                    <input
                        type="email"
                        placeholder="Email"
                        className="login-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        maxLength={50}
                    />
                    {errors.email && <p style={{ color: "red" }}>{errors.email}</p>}

                    <input
                        type="password"
                        placeholder="Password"
                        className="login-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {errors.password && <p style={{ color: "red" }}>{errors.password}</p>}

                    <input
                        type="password"
                        placeholder="Confirm Password"
                        className="login-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {errors.confirmPassword && <p style={{ color: "red" }}>{errors.confirmPassword}</p>}

                    <button className="login-btn" onClick={handleRegister} disabled={loading}>
                        {loading ? "Registering..." : "Register"}
                    </button>

                    <p className="login-footer">
                        Already have an account? <Link to="/login" className="register-link">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;