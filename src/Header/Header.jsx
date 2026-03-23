import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import '../Css/header.css';

function Header({ isLoggedIn, setIsLogIn }) {

    const navigate = useNavigate();
    const [search, setSearch] = useState("");

    const HandleLogout = () => {
        setIsLogIn(false);
        navigate("/");
    }

    const handleSearch = (e) => {
        e.preventDefault();

        // example: redirect to cars page with search query
        navigate(`/car?search=${search}`);
    }

    return (
        <header className='header'>
            <div className="logo">
                <h1 className="logo-text">JKLM</h1>
                <span className="logo-sub">Car Rental</span>
            </div>

            <nav>
                <ul className="nav-links">
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/about">About</Link></li>
                    <li><Link to="/car">Cars</Link></li>

                </ul>
            </nav>
            {/* SEARCH BAR */}
            <form className="search-bar" onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Search cars..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button type="submit">🔍</button>
            </form>
            <ul className="nav-links">
                {isLoggedIn ? (

                    <li>
                        <button className="logout-btn" onClick={HandleLogout}>
                            Logout
                        </button>
                    </li>
                ) : (
                    <li>
                        <Link className="login-btn" to="/login">Login</Link>
                    </li>
                )}
            </ul>

        </header>
    );
}

export default Header;