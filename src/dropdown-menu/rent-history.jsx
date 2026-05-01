import React, { useState, useEffect } from 'react';
import '../Css/MyRentalHistory.css'; 

function MyRentalHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5); 

    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };

    const [showModal, setShowModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: '', actionId: null });


    const showFloatingAlert = (msg, type = 'success', actionId = null) => {
        setToast({ show: true, message: msg, type: type, actionId: actionId });

        if (type !== 'confirm') {
            setTimeout(() => {
                setToast({ show: false, message: '', type: '', actionId: null });
            }, 3000);
        }
    };

    const handleRowClick = (booking) => {
        setReceiptData(booking);
        setShowReceipt(true);
    };

    const handleCloseReceipt = () => {
        setShowReceipt(false);
        setReceiptData(null);
    };

    const openCancelModal = (rentalId) => {
        setSelectedId(rentalId);
        setShowModal(true);
    };

    useEffect(() => {
        let userId = 1;
        try {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                userId = parsedUser.id || parsedUser.Id || userId;
            }
        } catch (e) {
            console.warn("Stored user error", e);
        }
        fetchUserHistory(userId);
    }, []);

    const fetchUserHistory = async (passedUserId) => {
        setLoading(true);
        try {
            let userId = passedUserId;

            if (!userId) {
                const storedUser = JSON.parse(localStorage.getItem("user"));
                userId = storedUser?.id || storedUser?.userId;
            }

            if (!userId) {
                console.error("Error: No User ID found.");
                return;
            }

            const token = localStorage.getItem("token");

            const response = await fetch(`https://localhost:7263/api/rental/user/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error(`API returned status: ${response.status}`);

            const result = await response.json();

            if (result && Array.isArray(result.data)) {
                setHistory(result.data);
            } else if (Array.isArray(result)) {
                setHistory(result);
            } else {
                setHistory([]);
            }
            setError(null);
        } catch (error) {
            console.error("Fetch error:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleManualRefresh = () => {
        let userId = 1;
        try {
            const storedUser = JSON.parse(localStorage.getItem("user"));
            userId = storedUser?.id || storedUser?.Id || 1;
        } catch (e) { }

        fetchUserHistory(userId);
        setCurrentPage(1); 
    };

    const handleRequestCancel = async (rentalId) => {
        try {
            let userId = 1;
            try {
                const storedUser = JSON.parse(localStorage.getItem("user"));
                userId = storedUser?.id || 1;
            } catch { }

            const response = await fetch(`https://localhost:7263/api/rental/${rentalId}/request-cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userId)
            });

            const data = await response.json();
            if (response.ok) {
                showFloatingAlert("Cancellation request submitted successfully!", "success");
                fetchUserHistory(userId);
            } else {
                alert(data.message || "Failed to submit cancellation request.");
            }
        } catch (err) {
            alert("A network error occurred.");
        }
    };

    const confirmCancellation = () => {
        setShowModal(false);
        handleRequestCancel(selectedId);
    };

    const openReturnModal = (rentalId) => {
        setSelectedId(rentalId);
        setShowReturnModal(true);
    };

    const confirmReturn = () => {
        setShowReturnModal(false);
        handleActualReturn(selectedId);
    };

    const handleActualReturn = async (rentalId) => {
        try {
            const response = await fetch(`https://localhost:7263/api/rental/user/rentals/${rentalId}/request-return`, {
                method: 'PUT'
            });

            if (response.ok) {
                window.location.reload();
            } else {
                alert(`Backend Error: ${response.status}`);
            }
        } catch (err) {
            alert("Server Error.");
        }
    };

    const handlePayPenalty = async (rentalId, amount) => {
        const successUrl = `${window.location.origin}/`;
        const cancelUrl = `${window.location.origin}/`;

        try {
            const response = await fetch(`https://localhost:7263/api/payment/penalty`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rentalId: rentalId,
                    amount: amount,
                    successUrl: successUrl,
                    cancelUrl: cancelUrl
                })
            });

            const result = await response.json();
            if (response.ok && result.data?.checkoutUrl) {
                localStorage.setItem("payMongoRef", result.data.reference);
                window.location.href = result.data.checkoutUrl;
            } else {
                alert(result.message || "Failed to generate penalty payment link.");
            }
        } catch (err) {
            console.error(err);
            alert("Payment error occurred.");
        }
    };

    const confirmTrash = (rentalId) => {
        if (!rentalId) {
            console.error("No Rental ID found to trash!");
            return;
        }
        showFloatingAlert("Are you sure you want to move this to trash?", "confirm", rentalId);
    };

    const executeTrash = async (rentalId) => {
        try {
            console.log("Trashing ID:", rentalId);
            const response = await fetch(`https://localhost:7263/api/rental/trash/${rentalId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
            });

            if (response.ok) {
                setToast({ show: false }); 
                showFloatingAlert("Rental moved to trash!", "success");
                handleManualRefresh();
            } else {
                showFloatingAlert("Failed to move to trash.", "error");
            }
        } catch (err) {
            showFloatingAlert("Server error.", "error");
        }
    };

    if (loading) return <div className="history-container" style={{ textAlign: 'center' }}><h3>Loading your rent history...</h3></div>;
    if (error) return <div className="history-container" style={{ textAlign: 'center', color: 'red' }}><h3>Error: {error}</h3></div>;

    const safeHistory = Array.isArray(history) 
        ? history.filter(r => {
            const isDel = r.isDeleted === true || r.IsDeleted === true || r.isDeleted === 1;
            const isArch = r.isArchived === true || r.IsArchived === true || r.isArchived === 1;
            const isHidden = r.isPermanentlyHidden === true || r.IsPermanentlyHidden === true || r.isPermanentlyHidden === 1;
            
            return !isDel && !isArch && !isHidden;
        }) 
        : [];

    const totalPages = Math.ceil(safeHistory.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = safeHistory.slice(indexOfFirstItem, indexOfLastItem);

    const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

    return (
        <div className="history-container">

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Confirm Cancellation</h3>
                        <p>Are you sure you want to cancel this booking?</p>
                        <div style={{ backgroundColor: '#fff1f2', padding: '10px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                            <p style={{ color: '#be123c', margin: 0, fontSize: '13px', fontWeight: 'bold' }}>
                                ⚠️ A 25% cancellation fee will be deducted. You will receive a 75% refund.
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>No, Keep it</button>
                            <button className="btn-danger-modal" onClick={confirmCancellation}>Yes, Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* RETURN MODAL */}
            {showReturnModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}></div>
                        <h3>Return Car?</h3>
                        <p>Are you sure you want to request a return for this car now?</p>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowReturnModal(false)}>
                                Not Yet
                            </button>
                            <button className="btn-return" style={{ padding: '10px 20px' }} onClick={confirmReturn}>
                                Yes, Return Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="history-header">
                <h2>My Rent History</h2>
                <p>View all your past and active bookings here.</p>
            </div>

            <button className="refresh-btn" onClick={handleManualRefresh}>
                <span>🔄</span> Refresh List
            </button>

            <div className="table-wrapper">
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Rental ID</th>
                            <th>Car</th>
                            <th>Dates</th>
                            <th>Total Price</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {safeHistory.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="empty-row">
                                    No rentals found. Book a car to see your history here!
                                </td>
                            </tr>
                        ) : (
                            currentItems.map((booking, index) => {
                                const rId = booking?.rentalID || booking?.rentalId;
                                const status = booking?.status || 'Unknown';

                               
                                let statusClass = "status-badge ";
                                if (['Pending Review', 'Cancellation Requested'].includes(status)) statusClass += "status-pending";
                                else if (['Approved', 'Confirmed', 'Returned', 'Delivered'].includes(status)) statusClass += "status-approved";
                                else if (status === 'Overdue') statusClass += "status-danger";
                                else statusClass += "status-action";

                                return (
                                    <tr
                                        key={rId || index}
                                        className="clickable-row"
                                        onClick={() => handleRowClick(booking)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td>#{rId}</td>
                                        <td>
                                            <div style={{ fontWeight: '700' }}>{booking?.carName || 'Unknown Car'}</div>
                                        </td>
                                        <td>
                                            {booking?.startDate ? new Date(booking.startDate).toLocaleDateString('en-US', dateOptions) : 'N/A'}
                                            <span style={{ color: '#cbd5e1', margin: '0 8px' }}>→</span>
                                            {booking?.endDate ? new Date(booking.endDate).toLocaleDateString('en-US', dateOptions) : 'N/A'}
                                        </td>
                                        <td style={{ fontWeight: '600' }}>₱{(booking?.totalPrice || 0).toLocaleString()}</td>
                                        <td>
                                            <span className={statusClass}>{status}</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>

                                            {['Pending Review', 'Approved'].includes(status) && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openCancelModal(rId); }}
                                                    className="btn-cancel"
                                                >
                                                    Cancel Rent
                                                </button>
                                            )}

                                            {status === 'On the Way' && (
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span className="badge-onway">🚗 Car is on the way</span>
                                                    <small style={{ color: '#94a3b8', marginTop: '4px' }}>Cancellation Disabled</small>
                                                </div>
                                            )}

                                            {(status === 'Rented' || status === 'Overdue') && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>

                                                    <button
                                                        className="btn-return"
                                                        onClick={(e) => { e.stopPropagation(); openReturnModal(rId); }}
                                                    >
                                                        🔄 Request Return
                                                    </button>
                                                </div>
                                            )}

                                            {status === 'Return Requested' && (
                                                <span className="badge-waiting" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                                                    ⏳ Verifying Return at Shop
                                                </span>
                                            )}

                                            {status === 'Cancellation Requested' && (
                                                <span className="badge-waiting">⏳ Waiting for Admin</span>
                                            )}

                                            {status === 'Pending Penalty' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                                    <span className="status-badge status-danger" style={{ animation: 'pulse 1.5s infinite' }}>
                                                        ⚠️ Pending Penalty
                                                    </span>
                                                    <button
                                                        className="btn-danger-modal"
                                                        style={{ padding: '8px 12px', fontSize: '12px', width: '100%' }}
                                                        onClick={(e) => { e.stopPropagation(); handlePayPenalty(rId, booking.penaltyFee || 0); }}
                                                    >
                                                        💳 Pay Penalty
                                                    </button>
                                                </div>
                                            )}

                                            {['Completed', 'Cancelled', 'Rejected', 'Returned'].includes(booking.status) && (
                                                <div>
                                                    <button
                                                        className="btn-cancel"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); 
                                                            confirmTrash(rId); 
                                                        }}
                                                        title="Move to Trash"
                                                    >
                                                        Move to archive
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="pagination-container">
                    <button
                        className="pagination-btn"
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>

                    <span className="pagination-info">
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        className="pagination-btn"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}

            {showReceipt && receiptData && (
                <div className="receipt-modal-overlay" onClick={handleCloseReceipt}>
                    <div className="receipt-modal-content" onClick={(e) => e.stopPropagation()}>

                        <div className="receipt-header">
                            <h2>🧾 Official Receipt</h2>
                            <p>Booking #{receiptData.rentalID || receiptData.rentalId}</p>
                        </div>

                        <hr className="receipt-divider" />

                        <div className="receipt-details">
                            <p><strong>🚗 Car Rented:</strong> {receiptData.carName || 'N/A'}</p>
                            <p><strong>📅 Start Date:</strong> {new Date(receiptData.startDate).toLocaleDateString('en-US', dateOptions)}</p>
                            <p><strong>📅 End Date:</strong> {new Date(receiptData.endDate).toLocaleDateString('en-US', dateOptions)}</p>

                            <p><strong>⏳ Duration:</strong> {receiptData.totalDays || 1} Days</p>
                            <p><strong>📌 Status:</strong> {receiptData.status}</p>

                            <br />

                            <p className="receipt-total">
                                <strong>💰 Amount Paid:</strong> ₱{(receiptData.amount || 0).toLocaleString()}
                            </p>
                            <p className="receipt-ref">
                                <strong>🧾 Payment Ref:</strong> {receiptData.paymentReference || 'N/A'}
                            </p>

                            {['Rejected', 'Cancelled', 'Refund Required'].includes(receiptData.status) && (
                                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '5px', fontSize: '13px', textAlign: 'center' }}>
                                    ⚠️ <strong>Note:</strong> This booking is {receiptData.status.toLowerCase()}. The amount paid is subject for refund.
                                </div>
                            )}
                        </div>

                        <button className="btn-close-receipt" onClick={handleCloseReceipt} style={{ marginTop: '20px' }}>
                            Close Receipt
                        </button>
                    </div>
                </div>
            )}

            {toast.show && (
                <div className={`floating-toast ${toast.type}`}>
                    <div className="toast-content">
                        <span>
                            {toast.type === 'success' && '✅ '}
                            {toast.type === 'error' && '❌ '}
                            {toast.type === 'confirm' && '⚠️ '}
                            {toast.message}
                        </span>

                        {toast.type === 'confirm' && (
                            <div className="toast-actions">
                                <button className="btn-confirm-yes" onClick={() => executeTrash(toast.actionId)}>Yes</button>
                                <button className="btn-confirm-no" onClick={() => setToast({ show: false })}>No</button>
                            </div>
                        )}
                    </div>
                    {toast.type !== 'confirm' && <div className="toast-progress"></div>}
                </div>
            )}
        </div>
    );
}

export default MyRentalHistory;