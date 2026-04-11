import React from "react";
import { Link, Outlet, useNavigate, Navigate } from "react-router-dom";
import "../adminCss/AdminDashboard.css";

export default function AdminLayout({ setIsLogIn }) {
    const navigate = useNavigate();

    const isAdmin = localStorage.getItem("admin");

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    const handleLogout = () => {
        localStorage.removeItem("admin");
        setIsLogIn(false);

        navigate("/")
    };

    return (
        <div className="admin-container">

            {/* LEFT SIDEBAR (Stays on all admin pages) */}
            <aside className="admin-sidebar">
                <div className="admin-logo-container">
                    <h1 className="admin-logo-text">JKLM</h1>
                    <p className="admin-logo-subtext">Car Rental</p>
                </div>

                <nav className="admin-nav-menu">
                    <Link to="/admin" className="admin-nav-link">Dashboard</Link>
                    {/* Notice we point this to /admin/booking */}
                    <Link to="/admin/manage-booking" className="admin-nav-link">Booking</Link>
                    <Link to="/admin/manage-car" className="admin-nav-link">Manage Car</Link>
                    <Link to="/admin/customers" className="admin-nav-link">Customers</Link>
                    <Link to="/admin/manage-payment" className="admin-nav-link">Payment Management</Link>
                    <Link to="/admin/report-analytics" className="admin-nav-link">Report & Analytics</Link>
                    <Link to="/admin/rental-history" className="admin-nav-link">Rental History</Link>

                    <button onClick={handleLogout} className="admin-nav-link admin-logout-btn">
                        Logout
                    </button>

                </nav>
            </aside>

            {/* RIGHT MAIN AREA */}
            <div className="admin-main-area">

                {/* TOP HEADER (Stays on all admin pages) */}
                <header className="admin-header">
                    Admin Panel
                </header>

                {/* CONTENT AREA: This changes based on the URL! */}
                <main className="admin-content">
                    <Outlet /> {/* <-- THIS IS THE MAGIC PART */}
                </main>

            </div>
        </div>
    );
}