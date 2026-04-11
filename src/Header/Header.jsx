import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import '../Css/header.css';

function Header({ isLoggedIn, setIsLogIn }) {

    const navigate = useNavigate();
    const location = useLocation();
    const [search, setSearch] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const [profilePic, setProfilePic] = useState("https://i.pravatar.cc/40");

    const menuRef = useRef();

    useEffect(() => {
        const loadProfilePic = () => {
            const storedUser = JSON.parse(localStorage.getItem("user"));

            if (storedUser && storedUser.profileImage) {
                const fullImageUrl = `https://localhost:7263${storedUser.profileImage}`;
                setProfilePic(fullImageUrl);
            }
        };
        loadProfilePic();

        window.addEventListener("profileUpdated", loadProfilePic);


    }, []);

    useEffect(() => {
        const handle = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };

        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);

    const HandleLogout = () => {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole"); // ✅ important
        setIsLogIn(false);
        setShowMenu(false);
        navigate("/");
    };

    const handleSearch = (e) => {
        e.preventDefault();

        if (!search.trim()) return; // ❌ prevent empty search

        // ✅ if already in /car → just update query
        if (location.pathname === "/car") {
            navigate(`/car?search=${search}`);
        } else {
            navigate(`/car?search=${search}`);
        }

        setSearch(""); // ✅ clear input after search
    };

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

            {/* 🔍 SEARCH BAR */}
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
                    <li className="profile-container">
                        <div
                            className="profile-circle"
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            <img
                                src={profilePic}
                                alt="profile"
                            />
                        </div>

                        {showMenu && (
                            <div className="dropdown-menu" ref={menuRef}>
                                <p onClick={() => navigate("/profile")}>Edit Profile</p>
                                <p onClick={() => navigate("/notifications")}>Notifications</p>
                                <p onClick={() => navigate("/favorites")}>Favorite Cars</p>
                                <p onClick={() => navigate("/rent-history")}>Rent History</p>
                                <hr />
                                <p className="logout" onClick={HandleLogout}>Logout</p>
                            </div>
                        )}
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