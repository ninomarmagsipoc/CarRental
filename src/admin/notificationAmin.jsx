import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../adminCss/NotificationAdmin.css'; // Siguroha nga sakto ang path sa imong CSS

export default function NotificationAdmin() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const adminId = 1; 
            const response = await fetch(`https://localhost:7263/api/Notification/user/${adminId}`);
            
            if (response.ok) {
                const result = await response.json();
                if (Array.isArray(result)) {
                    setNotifications(result);
                } else if (result && Array.isArray(result.data)) {
                    setNotifications(result.data);
                } else if (result && Array.isArray(result.Data)) {
                    setNotifications(result.Data);
                } else {
                    setNotifications([]); 
                }
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id, isAlreadyRead) => {
        if (isAlreadyRead) return;

        try {
            await fetch(`https://localhost:7263/api/Notification/read/${id}`, {
                method: 'PUT'
            });
            fetchNotifications();
            window.dispatchEvent(new Event('notificationRead'));
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    return (
        <div className="notif-admin-container">
            <div className="notif-header-section">
                <h2>🔔 Admin Notifications</h2>
                <button 
                    className="btn-bookings"
                    onClick={() => navigate('/admin/manage-booking')}
                >
                    Go to Bookings
                </button>
            </div>

            {loading ? (
                <div className="notif-loading">
                    <p>Loading notifications...</p>
                </div>
            ) : notifications.length === 0 ? (
                <div className="notif-empty">
                    <p>No new notifications.</p>
                </div>
            ) : (
                <div className="notif-list">
                    {notifications.map((notif) => {
                        const isRead = notif.isRead || notif.IsRead;
                        const nId = notif.notificationID || notif.notificationId;

                        return (
                            <div 
                                key={nId} 
                                className={`notif-card ${isRead ? 'read' : 'unread'}`}
                                onClick={() => markAsRead(nId, isRead)}
                            >
                                <div className="notif-content">
                                    <p className="notif-message">{notif.message}</p>
                                    <span className="notif-date">
                                        {new Date(notif.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                {!isRead && <div className="unread-dot"></div>}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}