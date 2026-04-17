import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import '../Css/header.css';

function Header({ isLoggedIn, setIsLogIn }) {

    const navigate = useNavigate();
    const location = useLocation();
    const [search, setSearch] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
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
        localStorage.removeItem("userRole"); 
        setIsLogIn(false);
        setShowMenu(false);
        setIsMobileMenuOpen(false);
        navigate("/");
    };

    const handleSearch = (e) => {
        e.preventDefault();

        if (!search.trim()) return; 

        if (location.pathname === "/car") {
            navigate(`/car?search=${search}`);
        } else {
            navigate(`/car?search=${search}`);
        }

        setSearch(""); 
        setIsMobileMenuOpen(false); 
    };

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <header className='header'>
            <div className="logo">
                <h1 className="logo-text">JKLM</h1>
                <span className="logo-sub">Car Rental</span>
            </div>

            <div 
                className={`hamburger ${isMobileMenuOpen ? "active" : ""}`} 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
            </div>

            <div className={`nav-container ${isMobileMenuOpen ? "active" : ""}`}>
                <nav>
                    <ul className="nav-links">
                        <li><Link to="/" onClick={closeMobileMenu}>Home</Link></li>
                        <li><Link to="/about" onClick={closeMobileMenu}>About</Link></li>
                        <li><Link to="/car" onClick={closeMobileMenu}>Cars</Link></li>
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

                <ul className="nav-links auth-links">
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
                                    <p onClick={() => { navigate("/profile"); closeMobileMenu(); }}>Edit Profile</p>
                                    <p onClick={() => { navigate("/notifications"); closeMobileMenu(); }}>Notifications</p>
                                    <p onClick={() => { navigate("/favorites"); closeMobileMenu(); }}>Favorite Cars</p>
                                    <p onClick={() => { navigate("/my-rentals"); closeMobileMenu(); }}>Rent History</p>
                                    <hr />
                                    <p className="logout" onClick={HandleLogout}>Logout</p>
                                </div>
                            )}
                        </li>
                    ) : (
                        <li>
                            <Link className="login-btn" to="/login" onClick={closeMobileMenu}>Login</Link>
                        </li>
                    )}
                </ul>
            </div>
        </header>
    );
}

export default Header;