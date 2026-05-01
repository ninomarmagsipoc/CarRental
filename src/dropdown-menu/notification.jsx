import React, { useState, useEffect } from 'react';
import '../Css/Notification.css';
import { generateAgreementHTML } from './AgreementTemplate';

function Notification() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [payingRentalId, setPayingRentalId] = useState(null);
    const [disabledRentals, setDisabledRentals] = useState([]);
    const [toastMessage, setToastMessage] = useState("");

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

                window.dispatchEvent(new Event('notificationRead'));
            }
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    };

    const handlePrintAgreement = async (e, rentalId, notificationId, isRead) => {
        e.stopPropagation();
        handleMarkAsRead(notificationId, isRead);

        try {
            const response = await fetch(`https://localhost:7263/api/rental/${rentalId}`);
            if (!response.ok) throw new Error("Failed to fetch rental details.");

            const result = await response.json();
            const rental = result.data;

            const htmlContent = generateAgreementHTML(rental, storedUser);

            const printWindow = window.open('', '_blank');
            printWindow.document.write(htmlContent);
            printWindow.document.close();

        } catch (error) {
            alert("Failed to generate the Agreement Paper. Please make sure the backend is running.");
            console.error(error);
        }
    };

    const handlePayOnlineClick = async (e) => {
        e.stopPropagation(); // Pugngan ang uban click events sa row

        console.log("Checking URL:", checkoutUrl);
        console.log("Checking Rental ID:", notif.rentalID);

        try {
            // 1. Mangutana sa database kung bayad na ba ni
            const response = await fetch(`https://localhost:7263/api/rental/${notif.rentalID}`);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const result = await response.json();
            console.log("Database result:", result);

            const rawStatus = result.data?.status || result.data?.Status || "";
            const rentalStatus = rawStatus.toLowerCase();

            // 2. Kung bayad na ('active', 'completed', 'returned'), PUGNGAN ang redirect!
            if (rentalStatus === 'active' || rentalStatus === 'completed' || rentalStatus === 'returned') {

                return; // 🛑

            }

            // 3. Kung pending pa (wala pa bayari), i-padayon ang redirect
            if (referenceId) {
                localStorage.setItem("payMongoRef", referenceId);
            }
            window.location.href = checkoutUrl;

        } catch (err) {
            console.error("Error during check:", err);
            alert("Naay error sa pag-check sa status: " + err.message);
        }
    };



    if (loading) return <div className="notification-page-wrapper"><h3>Loading...</h3></div>;
    if (error) return <div className="notification-page-wrapper"><div className="notification-error">{error}</div></div>;

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="notification-page-wrapper">
            <header className="notification-header">
                <h1 className="notification-title">Rental Notification</h1>
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
                            const requiresAgreement = notif.message.toLowerCase().includes('print this agreement paper');

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
                                        <div className={`notification-message ${notif.isRead ? '' : 'unread-text'}`}>
                                            {notif.message.includes("[PAY_ONLINE_LINK]") ? (
                                                (() => {
                                                    const parts = notif.message.split("[PAY_ONLINE_LINK]");
                                                    const textPart = parts[0];

                                                    // I-split ang URL ug Reference
                                                    const linkAndRef = parts[1].split("[REF]");
                                                    const checkoutUrl = linkAndRef[0];
                                                    const referenceId = linkAndRef[1];

                                                    const handlePayOnlineClick = async (e) => {
                                                        e.stopPropagation(); // Pugngan ang uban click events sa row

                                                        console.log("Checking URL:", checkoutUrl);
                                                        console.log("Checking REF:", referenceId);
                                                        console.log("Checking Rental ID:", notif.rentalID);

                                                        try {
                                                            // 1. I-check sa API kung bayad na ba ni
                                                            const response = await fetch(`https://localhost:7263/api/rental/${notif.rentalID}`);

                                                            if (!response.ok) {
                                                                throw new Error(`API Error: ${response.status}`);
                                                            }

                                                            const result = await response.json();
                                                            console.log("API Response:", result); // I-print ang result sa console

                                                            // Kuhaon ang status (gihimong lowercase tanan para walay sipyat)
                                                            const rawStatus = result.data?.status || result.data?.Status || "";
                                                            const rentalStatus = rawStatus.toLowerCase();

                                                            console.log("Rental Status detected:", rentalStatus);

                                                            // 2. Kung bayad na ('active', 'completed', 'returned'), pugngan ang redirect!
                                                            if (rentalStatus === 'active' || rentalStatus === 'completed' || rentalStatus === 'returned') {


                                                                if (typeof setToastMessage === 'function') {
                                                                    setToastMessage("Payment Complete! This Payment is already Completed ✅");
                                                                    setTimeout(() => setToastMessage(""), 3000);
                                                                }

                                                                return; // 🛑 UNDANG DINHI, DILI MO-REDIRECT
                                                            }

                                                            // 3. Kung wala pa nabayran, i-save ang ref ug i-redirect padulong PayMongo
                                                            if (referenceId) {
                                                                localStorage.setItem("payMongoRef", referenceId);
                                                            }
                                                            window.location.href = checkoutUrl;

                                                        } catch (err) {
                                                            // 🛑 GIKUHA NAKO ANG AUTO-REDIRECT DINHI. I-ALERT NATO ANG ERROR!
                                                            console.error("Error during check:", err);
                                                            alert("Wala naka-connect sa Database para i-check ang status: " + err.message);
                                                        }
                                                    };

                                                    return (
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                                            <span>{textPart}</span>
                                                            <button
                                                                onClick={handlePayOnlineClick}
                                                                className="notification-pay-btn"
                                                            >
                                                                💳 Click to Pay Online
                                                            </button>
                                                        </div>
                                                    );
                                                })()
                                            ) : (
                                                <span>{notif.message}</span>
                                            )}
                                        </div>

                                        {requiresAgreement && (
                                            <button
                                                onClick={(e) => handlePrintAgreement(e, notif.rentalID, notif.notificationID, notif.isRead)}
                                                className="notification-pay-btn"
                                            >
                                                📄 Print Agreement Paper
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
            {toastMessage && (
                <div className="pay-float-toast">
                    {toastMessage}
                </div>
            )}
        </div>
    );
}

export default Notification;