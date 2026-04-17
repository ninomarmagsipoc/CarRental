import React, { useState } from "react";
import { Link, Outlet, useNavigate, Navigate } from "react-router-dom";
import "../adminCss/AdminDashboard.css";

export default function AdminLayout({ setIsLogIn }) {
    const navigate = useNavigate();
    
    // State to handle hamburger menu
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const isAdmin = localStorage.getItem("admin");

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    const handleLogout = () => {
        localStorage.removeItem("admin");
        setIsLogIn(false);
        navigate("/");
    };

    // Toggle function for the hamburger button
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Close sidebar when a link is clicked (useful for smaller screens)
    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="admin-container">
            
            {/* OVERLAY: Dark background that appears when sidebar is open */}
            {isSidebarOpen && (
                <div className="admin-overlay" onClick={closeSidebar}></div>
            )}

            {/* LEFT SIDEBAR: Added dynamic class 'open' */}
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
                    <Link to="/admin/report-analytics" className="admin-nav-link" onClick={closeSidebar}>Report & Analytics</Link>
                    <Link to="/admin/rental-history" className="admin-nav-link" onClick={closeSidebar}>Rental History</Link>

                    <button onClick={handleLogout} className="admin-nav-link admin-logout-btn">
                        Logout
                    </button>
                </nav>
            </aside>

            {/* RIGHT MAIN AREA */}
            <div className="admin-main-area">

                {/* TOP HEADER: Added Hamburger Button */}
                <header className="admin-header">
                    <button className="hamburger-btn" onClick={toggleSidebar}>
                        ☰
                    </button>
                    <h2>Admin Panel</h2>
                </header>

                {/* CONTENT AREA */}
                <main className="admin-content">
                    <Outlet />
                </main>

            </div>
        </div>
    );
}