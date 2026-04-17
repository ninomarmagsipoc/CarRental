import React, { useState, useEffect } from 'react';
import '../Css/MyRentalHistory.css';

function MyRentalHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };

    useEffect(() => {
        let userId = 1; 
        try {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                userId = parsedUser.id || parsedUser.Id || userId;
            }
        } catch (e) { console.warn("User data failed", e); }
        fetchUserHistory(userId);
    }, []);

    const fetchUserHistory = async (userId) => {
        setLoading(true);
        try {
            const response = await fetch(`https://localhost:7263/api/rental/user/${userId}`);
            const result = await response.json();
            setHistory(Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []));
            setError(null);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const handleAction = async (rentalId, endpoint, method = 'POST') => {
        if (!window.confirm("Confirm action?")) return;
        try {
            const response = await fetch(`https://localhost:7263/api/rental/${endpoint}`, { method });
            if (response.ok) { alert("Success!"); window.location.reload(); }
        } catch (err) { alert("Error connecting to server."); }
    };

    if (loading) return <div className="rental-history-container" style={{textAlign:'center'}}>LOADING...</div>;

    return (
        <div className="rental-history-container">
            <div className="rental-history-wrapper">
                <h2 className="rental-history-title">My Rental History</h2>
                <p className="rental-history-subtitle">Track your premium vehicle bookings and status.</p>

                <div className="rental-table-wrapper">
                    <table className="rental-history-table">
                        <thead>
                            <tr>
                                <th>Rental ID</th>
                                <th>Vehicle Details</th>
                                <th>Schedule</th>
                                <th>Total Price</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length === 0 ? (
                                <tr><td colSpan="6" style={{textAlign:'center'}}>No history found.</td></tr>
                            ) : (
                                history.map((booking, index) => {
                                    const rId = booking?.rentalID || booking?.rentalId;
                                    const status = booking?.status || 'Unknown';

                                    // Status Logic for CSS Classes
                                    let statusClass = "status-badge";
                                    if (['Confirmed', 'Delivered'].includes(status)) statusClass += " dark";
                                    if (status === 'Overdue') statusClass += " danger";

                                    return (
                                        <tr key={rId || index}>
                                            <td><strong>#{rId}</strong></td>
                                            <td>
                                                <span className="car-name-text">{booking?.carName || 'Premium Car'}</span>
                                                <small style={{color:'#999'}}>ID: {booking?.carID}</small>
                                            </td>
                                            <td>
                                                {new Date(booking.startDate).toLocaleDateString('en-US', dateOptions)} — 
                                                {new Date(booking.endDate).toLocaleDateString('en-US', dateOptions)}
                                            </td>
                                            <td><strong>₱{(booking?.totalPrice || 0).toLocaleString()}</strong></td>
                                            <td>
                                                <span className={statusClass}>{status}</span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {['Pending Review', 'Confirmed'].includes(status) && (
                                                    <button onClick={() => handleAction(rId, `${rId}/request-cancel`)} className="btn-rental btn-rental-outline">CANCEL</button>
                                                )}
                                                {(status === 'Delivered' || status === 'Overdue') && (
                                                    <button onClick={() => handleAction(rId, `user/rentals/${rId}/request-return`, 'PUT')} className="btn-rental btn-rental-solid">RETURN CAR</button>
                                                )}
                                                {['Completed', 'Returned', 'Cancelled', 'Rejected'].includes(status) && (
                                                    <span className="action-completed">• COMPLETED</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default MyRentalHistory;