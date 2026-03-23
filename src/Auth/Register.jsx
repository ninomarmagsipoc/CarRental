import { Link } from "react-router-dom";
function Register() {
    return (
        <div className="body1">
            <div className="login-overlay">
                <div className="login-card">

                    <h1 className="logo-text">JKLM</h1>
                    <span className="logo-sub">Car Rental</span>
                    <p className="login-sub">Register to get started</p>

                    <input
                        type="email"
                        placeholder="Email"
                        className="login-input"
                    />

                    <input
                        type="text"
                        placeholder="Username"
                        className="login-input"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        className="login-input"
                    />

                    <input
                        type="password"
                        placeholder="Confirm Password"
                        className="login-input"
                    />

                    <button className="login-btn">
                        Register
                    </button>

                    <p className="login-footer">
                        Already have an account? <span className="link"><Link to="/login">Login</Link></span>
                    </p>

                </div>
            </div>
        </div>
    )
}

export default Register;