import React, { useState, useEffect, useMemo } from 'react';
import '../adminCss/ManageBooking.css';

function ManageBooking() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://localhost:7263/api/rental');

            if (!response.ok) throw new Error('Failed to fetch bookings');

            const result = await response.json();
            setBookings(result.data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (rentalId, action, paymentId) => {
        const newStatus = action === "Rejected" ? "Refund Required" : "Approved";

        if (!window.confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;

        let reasonText = "Admin rejected booking";
        if (action === "Rejected") {
            const userInput = window.prompt("Please enter a reason for rejecting and refunding this booking:", "Car is currently under maintenance");

            if (userInput === null) return;
            reasonText = userInput;
        }

        try {
            const response = await fetch(`https://localhost:7263/api/rental/admin/rentals/${rentalId}/review`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    newStatus: newStatus,
                    reason: reasonText
                })
            });

            if (response.ok) {
                if (action === "Rejected") {
                    if (!paymentId) {
                        alert("Booking rejected, but no Payment ID was found to process the refund.");
                    } else {
                        try {
                            const refundResponse = await fetch(`https://localhost:7263/api/payment/refund/${paymentId}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ reason: reasonText })
                            });

                            const refundData = await refundResponse.json();

                            if (!refundResponse.ok) {
                                alert(`Status updated, but the automatic refund failed: ${refundData.message || refundData.title || 'Unknown error'}`);
                            } else {
                                alert("Booking rejected and refund processed successfully!");
                            }
                        } catch (refundErr) {
                            console.error("Error processing refund:", refundErr);
                            alert("Status updated, but a network error occurred while processing the refund.");
                        }
                    }
                }

                setBookings(prevBookings =>
                    prevBookings.map(b =>
                        (b.rentalID === rentalId || b.rentalId === rentalId) ? { ...b, status: newStatus } : b
                    )
                );
            } else {
                alert("Failed to update booking status. Please check the console.");
            }
        } catch (err) {
            console.error("Error updating booking:", err);
        }
    };

    const stats = useMemo(() => {
        let pending = 0;
        let approved = 0;
        let confirmed = 0;
        let delivered = 0;

        bookings.forEach(b => {
            if (b.status === 'Pending Review') pending++;
            if (b.status === 'Approced') approved++;
            if (b.status === 'Confirmed') confirmed++;
            if(b.status === 'Delivered') delivered++;
        });

        return { total: bookings.length, pending, approved, confirmed, delivered };
    }, [bookings]);

    const filteredBookings = bookings.filter(b => {
        const searchLower = searchTerm.toLowerCase();
        const customer = (b.userName || "").toLowerCase();
        const rentalId = (b.rentalID || b.rentalId || "").toString();
        const carId = (b.carID || b.carId || "").toString();

        return customer.includes(searchLower) ||
            rentalId.includes(searchLower) ||
            carId.includes(searchLower);
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Approved':
            case 'Confirmed':
            case 'Delivered': 
                return 'status-badge status-approved';
            case 'On the Way': 
                return 'status-badge status-pending';
            case 'Pending Review': return 'status-badge status-pending';
            case 'Refund Required':
            case 'Rejected': return 'status-badge status-rejected';
            default: return 'status-badge status-default';
        }
    };

    const handleCancelReview = async (rentalId, action) => {
        const isApprove = action === "Approved";
        const confirmMessage = isApprove
            ? "Are you sure you want to APPROVE this cancellation and issue the 90% refund?"
            : "Are you sure you want to REJECT this cancellation request?";

        if (!window.confirm(confirmMessage)) return;

        try {
            const response = await fetch(`https://localhost:7263/api/rental/admin/rentals/${rentalId}/cancel-review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(action)
            });

            if (response.ok) {
                alert(`Cancellation request successfully ${action.toLowerCase()}!`);

                setBookings(prevBookings =>
                    prevBookings.map(b =>
                        (b.rentalID === rentalId || b.rentalId === rentalId)
                            ? { ...b, status: isApprove ? 'Cancelled' : 'Confirmed' }
                            : b
                    )
                );
            } else {
                const errData = await response.json();
                alert(`Failed to process request: ${errData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error processing cancellation review:", error);
            alert("A network error occurred while processing the cancellation.");
        }
    };

    const handleUpdateStatus = async (rentalId, newStatus) => {
        if (!window.confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;

        try {
            const response = await fetch(`https://localhost:7263/api/rental/admin/rentals/${rentalId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newStatus)
            });

            if (response.ok) {
                alert(`Status successfully updated to ${newStatus}`);

            
                setBookings(prevBookings =>
                    prevBookings.map(b =>
                        (b.rentalID === rentalId || b.rentalId === rentalId) ? { ...b, status: newStatus } : b
                    )
                );
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("A network error occurred.");
        }
    };

    const handleCheckOverdue = async () => {
        try {
            const response = await fetch('https://localhost:7263/api/rental/check-overdue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message || "Overdue check completed successfully!");
                fetchBookings(); // I-refresh ang table aron makita ang mga na-overdue
            } else {
                alert(`Failed to check overdue: ${result.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error checking overdue:", error);
            alert("A network error occurred.");
        }
    };

    const handleReturnReview = async (rentalId, action) => {
        let reasonText = "";

        if (action === "Rejected") {
            const userInput = window.prompt("Why are you rejecting this return? (e.g., Car is not at the shop yet)");
            if (userInput === null || userInput.trim() === "") {
                alert("Reason is required to reject a return.");
                return;
            }
            reasonText = userInput;
        } else {
            if (!window.confirm("Are you sure you want to ACCEPT this return? Penalties will be calculated if late.")) return;
        }

        try {
            const response = await fetch(`https://localhost:7263/api/rental/admin/rentals/${rentalId}/review-return`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: action, reason: reasonText })
            });

            const result = await response.json();

            if (response.ok) {
                if (action === "Approved" && result.data?.penaltyFee > 0) {
                    alert(`Return Accepted! Car was late. Penalty Fee: ₱${result.data.penaltyFee.toLocaleString()}`);
                } else {
                    alert(`Return Request successfully ${action.toLowerCase()}!`);
                }
                fetchBookings(); 
            } else {
                alert("Error processing request: " + (result.message || 'Unknown error'));
            }
        } catch (err) {
            console.error("Error reviewing return:", err);
            alert("A network error occurred. Check if your C# backend is running.");
        }
    };

    if (loading && bookings.length === 0) return <div className="loading-state">Loading bookings...</div>;
    if (error) return <div className="error-state">Error fetching data: {error}</div>;

    return (
        <div className="manage-booking-container">

            {/* Header Section */}
            <div className="page-header">
                <div>
                    <h2 className="page-title">Manage Bookings</h2>
                    <p className="page-subtitle">Review, approve, or reject customer rental requests.</p>
                </div>

                <button onClick={handleCheckOverdue} className="btn-danger">
                    ⚠️ Check Overdue Rentals
                </button>

                <button onClick={fetchBookings} className="btn-primary">
                    ↻ Refresh Data
                </button>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
                <div className="card">
                    <h3>Total Bookings</h3>
                    <p className="card-value text-blue">{stats.total}</p>
                </div>
                <div className="card">
                    <h3>Pending Review</h3>
                    <p className="card-value text-orange">{stats.pending}</p>
                </div>
                <div className="card">
                    <h3>Approved</h3>
                    <p className="card-value text-green">{stats.approved}</p>
                </div>
                <div className="card">
                    <h3>Confirmed</h3>
                    <p className="card-value text-purple">{stats.confirmed}</p>
                </div>

                <div className="card">
                    <h3>Delivered</h3>
                    <p className="card-value text-purple">{stats.delivered}</p>
                </div>
            </div>

            {/* Controls Section (Search) */}
            <div className="table-controls">
                <input
                    type="text"
                    placeholder="Search by Customer, Rental ID, or Car ID..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table Section */}
            <div className="table-wrapper">
                <table className="booking-table">
                    <thead>
                        <tr>
                            <th>Rental ID</th>
                            <th>Customer</th>
                            <th>Car ID</th>
                            <th>Dates</th>
                            <th>Total Price</th>
                            <th>Status</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBookings.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="empty-message">
                                    {searchTerm ? "No results matched your search." : "No bookings found."}
                                </td>
                            </tr>
                        ) : (
                            filteredBookings.map((booking, index) => {
                                const rId = booking.rentalID || booking.rentalId;
                                const cId = booking.carID || booking.carId;
                                const uId = booking.userID || booking.userId;
                                const pId = booking.paymentID || booking.paymentId;

                                return (
                                    <tr key={rId || index}>
                                        <td className="font-mono text-muted">#{rId}</td>
                                        <td>
                                            <div className="font-medium">{booking.userName}</div>
                                            <div className="text-sm text-muted">ID: {uId}</div>
                                        </td>
                                        <td className="font-mono">#{cId}</td>
                                        <td>
                                            {booking.startDate ? new Date(booking.startDate).toLocaleDateString('en-US', dateOptions) : 'N/A'}
                                            <span className="text-muted mx-2">  End to </span>
                                            {booking.endDate ? new Date(booking.endDate).toLocaleDateString('en-US', dateOptions) : 'N/A'}
                                        </td>
                                        <td className="font-semibold">₱{(booking.totalPrice || 0).toLocaleString()}</td>
                                        <td>
                                            <span className={getStatusBadge(booking.status)}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            {booking.status === 'Pending Review' && (
                                                <div className="action-buttons">
                                                    <button
                                                        onClick={() => handleReview(rId, 'Approved', pId)}
                                                        className="btn-success btn-sm"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReview(rId, 'Rejected', pId)}
                                                        className="btn-danger btn-sm"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}

                                            {booking.status === 'Cancellation Requested' && (
                                                <div className="action-buttons">
                                                    <button
                                                        onClick={() => handleCancelReview(rId, 'Approved')}
                                                        className="btn-success btn-sm"
                                                        title="Approve cancellation and process 90% refund"
                                                    >
                                                        Approve Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelReview(rId, 'Rejected')}
                                                        className="btn-danger btn-sm"
                                                        title="Reject cancellation and keep booking confirmed"
                                                    >
                                                        Reject Cancel
                                                    </button>
                                                </div>
                                            )}

                                            {booking.status === 'Confirmed' && (
                                                <button
                                                    className="btn-primary btn-sm mx-1"
                                                    style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
                                                    onClick={() => handleUpdateStatus(rId, 'On the Way')}
                                                >
                                                    On the Way
                                                </button>
                                            )}

                                            {booking.status === 'On the Way' && (
                                                <button
                                                    className="btn-success btn-sm mx-1"
                                                    onClick={() => handleUpdateStatus(rId, 'Delivered')}
                                                >
                                                    Mark Delivered
                                                </button>
                                            )}

                                            {booking.status === 'Return Requested' && (
                                                <div className="action-buttons" style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', marginTop: '5px' }}>
                                                    <button
                                                        onClick={() => handleReturnReview(rId, 'Approved')}
                                                        className="btn-success btn-sm"
                                                        title="Accept Return and calculate penalties"
                                                        style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                                    >
                                                        Accept Return
                                                    </button>
                                                    <button
                                                        onClick={() => handleReturnReview(rId, 'Rejected')}
                                                        className="btn-danger btn-sm"
                                                        title="Reject Return (e.g., Car not yet at shop)"
                                                        style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                                    >
                                                        Reject Return
                                                    </button>
                                                </div>
                                            )}

                                            {['Completed', 'Returned', 'Cancelled', 'Rejected', 'Refund Required'].includes(booking.status) && (
                                                <span className="text-muted text-sm italic">Action Completed</span>
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
    );
}

export default ManageBooking;