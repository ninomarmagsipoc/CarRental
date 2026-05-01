import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, Navigate } from "react-router-dom";
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { FaBell } from 'react-icons/fa'; // 🟢 Import ang Bell Icon
import "../adminCss/AdminDashboard.css";

export default function AdminLayout({ setIsLogIn }) {
    const navigate = useNavigate();
    
    // States
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0); // 🟢 State para sa red badge

    const isAdmin = localStorage.getItem("admin");

  useEffect(() => {
        let connection = null;

        // 🟢 1. I-fetch ang data inig load sa page parehas sa User
        const fetchUnreadCount = async () => {
            try {
                // Kay admin man ni, kasagaran 1 ang iyang ID sa database.
                // Kung lahi ang ID sa imong admin account, ilisi ang '1' ngadto sa saktong ID.
                const adminId = 1; 
                const response = await fetch(`https://localhost:7263/api/notification/unread-count/${adminId}`);
                if (response.ok) {
                    const count = await response.json();
                    setUnreadCount(count); // I-set dritso ang number gikan sa database
                }
            } catch (error) {
                console.error("Failed to fetch admin notification count:", error);
            }
        };

        const setupNotifications = async () => {
            // 🟢 Tawagon nato ang fetch para mo-gawas ang count inig refresh
            await fetchUnreadCount();

            // 🟢 2. I-setup ang SignalR para sa mga umaabot nga notifications (live)
            connection = new HubConnectionBuilder()
                .withUrl("https://localhost:7263/notificationHub")
                .withAutomaticReconnect()
                .configureLogging(LogLevel.None) 
                .build();

            // 🟢 Bantayi nga ang signal name kay "ReceiveAdminNotification"
            connection.on("ReceiveAdminNotification", (newCount) => {
                console.log("New Admin Notification Count: ", newCount);
                setUnreadCount(newCount); 
            });

            try {
                await connection.start();
                console.log("Admin Connected to SignalR!");
            } catch (err) {
                if (err.message && err.message.includes("stopped during negotiation")) {
                    console.log("SignalR connection stopped early due to React Strict Mode (Normal ra ni).");
                } else {
                    console.error("SignalR Connection Error: ", err);
                }
            }
        };

        setupNotifications();

        // 🟢 Cleanup inig gawas nimo sa admin panel
        return () => {
            if (connection) {
                connection.stop();
            }
        };
    }, []); // <-- Empty array pasabot mo-run lang kausa inig load

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    const handleLogout = () => {
        localStorage.removeItem("admin");
        setIsLogIn(false);
        navigate("/");
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    // 🟢 I-reset ang badge inig click sa bell padulong sa notifications page
    const handleBellClick = () => {
        setUnreadCount(0); 
    };

    return (
        <div className="admin-container">
            
            {isSidebarOpen && (
                <div className="admin-overlay" onClick={closeSidebar}></div>
            )}

            <aside className={`admin-sidebar ${isSidebarOpen ? "open" : ""}`}>
                <div className="admin-logo-container">
                    <h1 className="admin-logo-text">JKLM</h1>
                    <p className="admin-logo-subtext">Car Rental</p>
                </div>

                <nav className="admin-nav-menu">
                    <Link to="/admin" className="admin-nav-link" onClick={closeSidebar}>Dashboard</Link>
                    <Link to="/admin/manage-booking" className="admin-nav-link" onClick={closeSidebar}>Booking</Link>
                    <Link to="/admin/manage-car" className="admin-nav-link" onClick={closeSidebar}>Manage Car</Link>
                    <Link to="/admin/customers" className="admin-nav-link" onClick={closeSidebar}>Customers</Link>
                    <Link to="/admin/manage-payment" className="admin-nav-link" onClick={closeSidebar}>Payment Management</Link>
                    <button onClick={handleLogout} className="admin-nav-link admin-logout-btn">
                        Logout
                    </button>
                </nav>
            </aside>

            {/* RIGHT MAIN AREA */}
            <div className="admin-main-area">

                <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '20px' }}>
                    <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button className="hamburger-btn" onClick={toggleSidebar}>
                            ☰
                        </button>
                        <h2 style={{ margin: 0 }}>Admin Panel</h2>
                    </div>

                    {/* 🟢 RIGHT SIDE: Notification Bell (Parihas gyud sa User Header) */}
                    <div className="header-right">
                        <Link 
                            to="/admin/notifications" 
                            onClick={handleBellClick}
                            style={{ position: 'relative', color: '#333', fontSize: '24px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                        >
                            <FaBell />
                            
                            {/* Mo-gawas ra ang pula nga badge kung naay unread (greater than 0) */}
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute', 
                                    top: '-5px', 
                                    right: '-8px',
                                    background: '#e74c3c', 
                                    color: 'white', 
                                    borderRadius: '50%',
                                    padding: '2px 6px', 
                                    fontSize: '12px', 
                                    fontWeight: 'bold',
                                    border: '2px solid white'
                                }}>
                                    {unreadCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </header>

                {/* CONTENT AREA */}
                <main className="admin-content">
                    <Outlet />
                </main>

            </div>
        </div>
    );
}