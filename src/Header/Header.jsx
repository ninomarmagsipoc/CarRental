import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { useState, useEffect, useRef } from 'react';
import { FaBell } from 'react-icons/fa'; // Added Bell Icon
import '../Css/header.css';

function Header({ isLoggedIn, setIsLogIn }) {

    const navigate = useNavigate();
    const location = useLocation();
    const [search, setSearch] = useState("");
    const [showMenu, setShowMenu] = useState(false);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [profilePic, setProfilePic] = useState("https://i.pravatar.cc/40");

    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        let connection = null;

        const fetchUnreadCount = async () => {
            const storedUserId = localStorage.getItem("userId");
            if (!storedUserId) return;

            try {
                const response = await fetch(`https://localhost:7263/api/notification/unread-count/${storedUserId}`);
                if (response.ok) {
                    const count = await response.json();
                    setUnreadCount(count);
                }
            } catch (error) {
                console.error("Failed to fetch notification count:", error);
            }
        };

        const setupNotifications = async () => {
            if (isLoggedIn) {
                await fetchUnreadCount();

                connection = new HubConnectionBuilder()
                    .withUrl("https://localhost:7263/notificationHub")
                    .withAutomaticReconnect()
                    .build();

                connection.on("ReceiveUserNotification", (targetUserId, newCount) => {
                    console.log("Naay bag-ong notification! Total:", newCount);
                    setUnreadCount(newCount);
                });

                try {
                    await connection.start();
                    console.log("Connected to SignalR from Header!");
                } catch (err) {
                    console.error("SignalR Connection Error: ", err);
                }
            }
        };

        setupNotifications();

        window.addEventListener('notificationRead', fetchUnreadCount);

        return () => {
            if (connection) {
                connection.stop();
            }
            window.removeEventListener('notificationRead', fetchUnreadCount);
        };
    }, [isLoggedIn]);

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

        return () => window.removeEventListener("profileUpdated", loadProfilePic);
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
        localStorage.removeItem("token")
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
                        <>
                            <li
                                className="notification-icon-container"
                                onClick={() => { navigate("/notifications"); closeMobileMenu(); }}
                            >
                                <FaBell className="bell-icon" />
                                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                            </li>

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
                                        <p onClick={() => { navigate("/favorites"); closeMobileMenu(); }}>Favorite Cars</p>
                                        <p onClick={() => { navigate("/my-rentals"); closeMobileMenu(); }}>Rent History</p>
                                        <p onClick={() => {navigate("/archive"); closeMobileMenu(); }}>Archive</p>
                                        <hr />
                                        <p className="logout" onClick={HandleLogout}>Logout</p>
                                    </div>
                                )}
                            </li>
                        </>
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