import React, { useState, useEffect } from 'react';
import '../Css/Notification.css';

function Notification() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [payingRentalId, setPayingRentalId] = useState(null); 
    const [disabledRentals, setDisabledRentals] = useState([]);

    const storedUser = JSON.parse(localStorage.getItem("user"));
    const userId = storedUser ? storedUser.id : null; 

    useEffect(() => {
        if (!userId) {
            setError("Please log in to view notifications.");
            setLoading(false);
            return;
        }

        const fetchNotifications = async () => {
            try {
                const response = await fetch(`https://localhost:7263/api/Notification/user/${userId}`);
                const result = await response.json();

                if (response.ok && result.statusCode === 200) {
                    setNotifications(result.data);
                } else {
                    setError(result.message || 'Failed to fetch notifications');
                }
            } catch (err) {
                setError('Network error. Please make sure the server is running.');
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [userId]);

    const handleMarkAsRead = async (notificationId, isRead) => {
        if (isRead) return; 

        try {
            const response = await fetch(`https://localhost:7263/api/Notification/read/${notificationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                setNotifications(prevNotifications =>
                    prevNotifications.map(notif =>
                        notif.notificationID === notificationId
                            ? { ...notif, isRead: true }
                            : notif
                    )
                );
            }
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    };

    const handlePayBalance = async (e, rentalId, notificationId, isRead) => {
        e.stopPropagation(); 
        handleMarkAsRead(notificationId, isRead); 
        setPayingRentalId(rentalId); 

        try {
            const response = await fetch(`https://localhost:7263/api/payment/create-balance/${rentalId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (response.ok && result.data?.checkoutUrl) {
                localStorage.setItem("payMongoRef", result.data.reference);
                window.location.href = result.data.checkoutUrl;
            } else if (response.status === 400) {
                alert(result.message); 
                setDisabledRentals(prev => [...prev, rentalId]);
                setPayingRentalId(null); 
            } else {
                alert(result.message || "Failed to generate payment link.");
                setPayingRentalId(null);
            }
        } catch (error) {
            console.error("Payment error:", error);
            alert("Network error while trying to process payment.");
            setPayingRentalId(null);
        }
    };

    if (loading) return <div className="notification-page-wrapper"><h3>Loading...</h3></div>;
    if (error) return <div className="notification-page-wrapper"><div className="notification-error">{error}</div></div>;

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="notification-page-wrapper">
            <header className="notification-header">
                <h1 className="notification-title">Rental Alerts</h1>
                {unreadCount > 0 && (
                    <div className="notification-badge">
                        {unreadCount} NEW NOTIFICATIONS
                    </div>
                )}
            </header>

            <div className="notification-list-container">
                {notifications.length === 0 ? (
                    <div className="notification-empty">
                        <p>Your inbox is empty. No new updates on your rentals.</p>
                    </div>
                ) : (
                    <ul className="notification-list">
                        {notifications.map((notif) => {
                            const isDisabled = disabledRentals.includes(notif.rentalID);
                            const requiresPayment = (notif.message.includes("remaining balance") || notif.message.includes("Pay Now")) && !isDisabled;

                            return (
                                <li
                                    key={notif.notificationID}
                                    onClick={() => handleMarkAsRead(notif.notificationID, notif.isRead)}
                                    className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
                                >
                                    <div className="notification-content-wrapper">
                                        <span className="notification-date">
                                            {new Date(notif.createdAt).toLocaleDateString('en-US', { 
                                                month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                                            })}
                                        </span>
                                        <p className={`notification-message ${notif.isRead ? '' : 'unread-text'}`}>
                                            {notif.message}
                                        </p>
                                        
                                        {requiresPayment && (
                                            <button 
                                                onClick={(e) => handlePayBalance(e, notif.rentalID, notif.notificationID, notif.isRead)}
                                                disabled={payingRentalId === notif.rentalID}
                                                className="notification-pay-btn"
                                            >
                                                {payingRentalId === notif.rentalID ? "Redirecting to PayMongo..." : "Complete Payment Now"}
                                            </button>
                                        )}
                                    </div>

                                    {!notif.isRead && (
                                        <div className="notification-unread-dot" title="Unread"></div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default Notification;