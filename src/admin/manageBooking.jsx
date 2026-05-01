import React, { useState, useEffect, useMemo } from 'react';
import '../adminCss/ManageBooking.css';

function ManageBooking() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    // --- PAGINATION STATES ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5); 

    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };

    // --- MODAL STATES ---
    const [showModal, setShowModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [toast, setToast] = useState({
        show: false,
        message: "",
        type: "success"
    });

    const [confirmModal, setConfirmModal] = useState({
        show: false,
        message: "",
        onConfirm: null
    });

    const showConfirm = (message, onConfirm) => {
        setConfirmModal({
            show: true,
            message,
            onConfirm
        });
    };

    const [inputModal, setInputModal] = useState({
        show: false,
        title: "",
        placeholder: "",
        value: "",
        onSubmit: null
    });

    const showInputModal = (title, placeholder, onSubmit) => {
        setInputModal({
            show: true,
            title,
            placeholder,
            value: "",
            onSubmit
        });
    };

    const handleInputChange = (e) => {
        setInputModal(prev => ({
            ...prev,
            value: e.target.value
        }));
    };

    const handleInputSubmit = () => {
        if (inputModal.value.trim() === "") {
            showToast("Input is required", "warning");
            return;
        }

        if (inputModal.onSubmit) {
            inputModal.onSubmit(inputModal.value);
        }

        setInputModal({ show: false, title: "", placeholder: "", value: "", onSubmit: null });
    };

    const closeInputModal = () => {
        setInputModal({ show: false, title: "", placeholder: "", value: "", onSubmit: null });
    };

    const handleConfirmYes = () => {
        if (confirmModal.onConfirm) {
            confirmModal.onConfirm();
        }
        setConfirmModal({ show: false, message: "", onConfirm: null });
    };

    const handleConfirmNo = () => {
        setConfirmModal({ show: false, message: "", onConfirm: null });
    };

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });

        setTimeout(() => {
            setToast({ show: false, message: "", type: "success" });
        }, 3000); 
    };

    const handleViewDetails = (booking) => {
        setSelectedBooking(booking);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedBooking(null);
    };

    // --- MODAL STYLES ---
    const overlayStyle = {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    };

    const modalStyle = {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '500px',
        color: '#000',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxHeight: '90vh',
        overflowY: 'auto'
    };

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

    const handleReview = (rentalId, action, paymentId) => {
        const newStatus = action === "Rejected" ? "Refund Required" : "Approved";

        showConfirm(`Are you sure you want to mark this booking as ${newStatus}?`, async () => {

            const processReview = async (reasonText) => {
                try {
                    const response = await fetch(`https://localhost:7263/api/rental/admin/rentals/${rentalId}/review`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            newStatus,
                            reason: reasonText
                        })
                    });

                    if (response.ok) {

                        if (action === "Rejected") {
                            if (!paymentId) {
                                showToast("Booking rejected, but no Payment ID was found for refund.", "warning");
                            } else {
                                try {
                                    const refundResponse = await fetch(
                                        `https://localhost:7263/api/payment/refund/${paymentId}`,
                                        {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({ reason: reasonText })
                                        }
                                    );

                                    const refundData = await refundResponse.json();

                                    if (!refundResponse.ok) {
                                        showToast(
                                            `Refund failed: ${refundData.message || 'Unknown error'}`,
                                            "error"
                                        );
                                    } else {
                                        showToast("Booking rejected and refund processed successfully!", "success");
                                    }

                                } catch (refundErr) {
                                    console.error("Refund error:", refundErr);
                                    showToast("Network error while processing refund.", "error");
                                }
                            }
                        } else {
                            showToast("Booking approved successfully!", "success");
                        }

                        setBookings(prev =>
                            prev.map(b =>
                                (b.rentalID === rentalId || b.rentalId === rentalId)
                                    ? { ...b, status: newStatus }
                                    : b
                            )
                        );

                    } else {
                        showToast("Failed to update booking status.", "error");
                    }

                } catch (err) {
                    console.error("Error updating booking:", err);
                    showToast("Network error occurred.", "error");
                }
            };

            if (action === "Rejected") {
                showInputModal(
                    "Reject Booking Reason",
                    "Enter reason for rejection...",
                    (reasonText) => {
                        if (!reasonText || reasonText.trim() === "") {
                            showToast("Reason is required", "warning");
                            return;
                        }

                        processReview(reasonText);
                    }
                );
            } else {
                processReview("Admin approved booking");
            }

        });
    };

    const stats = useMemo(() => {
        let pending = 0;
        let approved = 0;
        let rented = 0;

        bookings.forEach(b => {
            if (b.status === 'Pending Review') pending++;
            if (b.status === 'Approved') approved++;
            if (b.status === 'Rented') rented++;
        });

        return { total: bookings.length, pending, approved, rented };
    }, [bookings]);

    const filteredBookings = useMemo(() => {
        return bookings.filter((b) => {
            const customer = (b.fullName || b.customerName || "").toLowerCase();
            const rentalId = (b.rentalID || b.rentalId || "").toString();
            const carId = (b.carID || b.carId || "").toString();
            const status = b.status || b.Status || ""; 
            const searchLower = searchTerm.toLowerCase();

            const matchesStatus = statusFilter === "All" || status === statusFilter;

            const matchesSearch = customer.includes(searchLower) ||
                rentalId.includes(searchLower) ||
                carId.includes(searchLower);

            return matchesStatus && matchesSearch;
        });
    }, [bookings, searchTerm, statusFilter]);

    // --- PAGINATION LOGIC ---
    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);

    const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Approved':
            case 'Rented':
                return 'status-badge status-approved';
            case 'On the Way':
            case 'Pending Review':
                return 'status-badge status-pending';
            case 'Refund Required':
            case 'Rejected':
            case 'Cancelled':
                return 'status-badge status-rejected';
            case 'Return Requested':
                return 'status-badge status-info';
            default:
                return 'status-badge status-default';
        }
    };

    const handleCancelReview = (rentalId, action) => {
        const isApprove = action === "Approved";

        const confirmMessage = isApprove
            ? "Are you sure you want to APPROVE this cancellation and issue the 75% refund?"
            : "Are you sure you want to REJECT this cancellation request?";

        showConfirm(confirmMessage, async () => {
            try {
                const response = await fetch(`https://localhost:7263/api/rental/admin/rentals/${rentalId}/cancel-review`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(action)
                });

                if (response.ok) {
                    showToast(`Cancellation request successfully ${action.toLowerCase()}!`, "success");

                    setBookings(prevBookings =>
                        prevBookings.map(b =>
                            (b.rentalID === rentalId || b.rentalId === rentalId)
                                ? { ...b, status: isApprove ? 'Cancelled' : 'Approved' }
                                : b
                        )
                    );
                } else {
                    const errData = await response.json();
                    showToast(`Failed: ${errData.message || 'Unknown error'}`, "error");
                }

            } catch (error) {
                console.error("Error processing cancellation review:", error);
                showToast("Network error while processing cancellation.", "error");
            }
        });
    };

    const handleUpdateStatus = (rentalId, newStatus) => {
        showConfirm(`Are you sure you want to mark this booking as ${newStatus}?`, async () => {
            try {
                const response = await fetch(`https://localhost:7263/api/rental/admin/rentals/${rentalId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newStatus)
                });

                if (response.ok) {
                    showToast(`Status successfully updated to ${newStatus}`, "success");

                    setBookings(prevBookings =>
                        prevBookings.map(b =>
                            (b.rentalID === rentalId || b.rentalId === rentalId)
                                ? { ...b, status: newStatus }
                                : b
                        )
                    );
                } else {
                    showToast("Failed to update status", "error");
                }

            } catch (error) {
                console.error("Error updating status:", error);
                showToast("Network error occurred.", "error");
            }
        });
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
                showToast(result.message || "Overdue check completed successfully!");
                fetchBookings();
                setCurrentPage(1);
            } else {
                showToast(`Failed to check overdue: ${result.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error checking overdue:", error);
            showToast("A network error occurred.");
        }
    };

    const handleReturnReview = (rentalId, action) => {
        showConfirm(
            action === "Rejected"
                ? "Are you sure you want to REJECT this return request?"
                : "Are you sure you want to ACCEPT this return? Penalties will be calculated if late.",
            async () => {

                const processReturn = async (reasonText = "") => {
                    try {
                        const response = await fetch(
                            `https://localhost:7263/api/rental/admin/rentals/${rentalId}/review-return`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action, reason: reasonText })
                            }
                        );

                        const result = await response.json();

                        if (response.ok) {

                            if (action === "Approved" && result.data?.penaltyFee > 0) {
                                showToast(
                                    `Return Accepted! Penalty Fee: ₱${result.data.penaltyFee.toLocaleString()}`,
                                    "warning"
                                );
                            } else {
                                showToast(`Return request ${action.toLowerCase()} successfully!`, "success");
                            }

                            fetchBookings();

                        } else {
                            showToast(
                                `Error: ${result.message || 'Unknown error'}`,
                                "error"
                            );
                        }

                    } catch (err) {
                        console.error("Error reviewing return:", err);
                        showToast("Network error. Check backend server.", "error");
                    }
                };

                if (action === "Rejected") {
                    showInputModal(
                        "Reject Return Reason",
                        "Why are you rejecting this return?",
                        (reasonText) => {
                            if (!reasonText || reasonText.trim() === "") {
                                showToast("Reason is required to reject a return.", "warning");
                                return;
                            }

                            processReturn(reasonText);
                        }
                    );
                } else {
                    processReturn("");
                }

            }
        );
    };

    const handleCashPayment = (rentalId) => {

        showInputModal(
            "Cash Payment",
            "Enter cash amount for remaining balance...",
            async (amount) => {

                // validation
                if (!amount || isNaN(amount) || Number(amount) <= 0) {
                    showToast("Please enter a valid amount", "warning");
                    return;
                }

                try {
                    const res = await fetch('https://localhost:7263/api/payment/cash-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            rentalId,
                            amount: parseFloat(amount)
                        })
                    });

                    const data = await res.json();

                    if (data.statusCode === 200) {
                        showToast("Cash Payment Successful!", "success");

                        // optional print receipt
                        window.print();

                        fetchBookings();
                    } else {
                        showToast("Failed: " + (data.message || "Unknown error"), "error");
                    }

                } catch (err) {
                    console.error(err);
                    showToast("Network error during cash payment.", "error");
                }
            }
        );
    };

    const handleOnlineLink = (rentalId) => {
        showConfirm("Send online payment link to the user?", async () => {
            try {
                const res = await fetch(`https://localhost:7263/api/payment/create-balance/${rentalId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        successUrl: `${window.location.origin}/`,
                        cancelUrl: `${window.location.origin}/`
                    })
                });

                const data = await res.json();

                if (data.statusCode === 200) {
                    showToast("Online Payment Link sent successfully!", "success");
                } else {
                    showToast("Failed: " + (data.message || "Unknown error"), "error");
                }

            } catch (err) {
                console.error(err);
                showToast("Network error while sending payment link.", "error");
            }
        });
    };

    if (loading && bookings.length === 0) return <div className="loading-state">Loading bookings...</div>;
    if (error) return <div className="error-state">Error fetching data: {error}</div>;

    return (
        <div className="manage-booking-container">
            {inputModal.show && (
                <div style={overlayStyle}>
                    <div style={modalStyle}>
                        <h3 style={{ marginBottom: "10px" }}>{inputModal.title}</h3>

                        <input
                            type="text"
                            value={inputModal.value}
                            onChange={handleInputChange}
                            placeholder={inputModal.placeholder}
                            style={{
                                width: "100%",
                                padding: "10px",
                                marginBottom: "15px",
                                border: "1px solid #ccc",
                                borderRadius: "5px"
                            }}
                        />

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button
                                onClick={closeInputModal}
                                style={{
                                    backgroundColor: "#6b7280",
                                    color: "white",
                                    padding: "8px 14px",
                                    border: "none",
                                    borderRadius: "5px",
                                    cursor: "pointer"
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleInputSubmit}
                                style={{
                                    backgroundColor: "#16a34a",
                                    color: "white",
                                    padding: "8px 14px",
                                    border: "none",
                                    borderRadius: "5px",
                                    cursor: "pointer"
                                }}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {confirmModal.show && (
                <div style={overlayStyle}>
                    <div style={modalStyle}>
                        <h3 style={{ marginBottom: '15px' }}>Confirmation</h3>

                        <p style={{ marginBottom: '20px' }}>
                            {confirmModal.message}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                onClick={handleConfirmNo}
                                style={{
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleConfirmYes}
                                style={{
                                    backgroundColor: '#16a34a',
                                    color: 'white',
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {toast.show && (
                <div style={{
                    position: 'fixed',
                    top: '24px',    
                    right: '24px',  
                    backgroundColor:
                        toast.type === 'success' ? '#16a34a' :
                            toast.type === 'error' ? '#dc2626' :
                                '#f59e0b',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    zIndex: 2000,
                    fontWeight: '500',
                    minWidth: '250px',
                    textAlign: 'center'
                }}>
                    {toast.message}
                </div>
            )}
            <div className="page-header">
                <div>
                    <h2 className="page-title">Manage Bookings</h2>
                    <p className="page-subtitle">Review, approve, or reject customer rental requests.</p>
                </div>
                <div className="header-actions">
                    <button onClick={handleCheckOverdue} className="btn-secondary text-orange font-semibold border-orange">
                        ⚠️ Check Overdue
                    </button>
                    <button onClick={() => { fetchBookings(); setCurrentPage(1); }} className="btn-primary">
                        <span className="icon">↻</span> Refresh Data
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="stats-container">
                <div className="stat-box">
                    <h4>Total Bookings</h4>
                    <p className="text-blue">{stats.total}</p>
                </div>
                <div className="stat-box">
                    <h4>Pending Review</h4>
                    <p className="text-orange">{stats.pending}</p>
                </div>
                <div className="stat-box">
                    <h4>Approved</h4>
                    <p className="text-green">{stats.approved}</p>
                </div>
                <div className="stat-box">
                    <h4>Rented</h4>
                    <p className="text-purple">{stats.rented}</p>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="filter-container" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Search customer, ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                    }}
                >
                    <option value="All">All Statuses</option>
                    <option value="Approved">Approved</option>
                    <option value="Rented">Rented</option>
                    <option value="Return Requested">Request Return</option>
                    <option value="Cancellation Requested">Request Cancellation</option>
                    <option value="Cancelled">Cancelled</option>
                </select>

                <button onClick={() => { setSearchTerm(""); setStatusFilter("All"); }} className="view-all-btn">
                    View All
                </button>
            </div>

            <div className="table-wrapper">
                <table className="booking-table">
                    <thead>
                        <tr>
                            <th>Rental ID</th>
                            <th>Customer</th>
                            <th>Car Name</th>
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
                            currentItems.map((booking, index) => {
                                const rId = booking.rentalID || booking.rentalId;
                                const cId = booking.carID || booking.carId;
                                const uId = booking.userID || booking.userId;
                                const pId = booking.paymentID || booking.paymentId;

                                return (
                                    <tr key={rId || index} className="booking-row">
                                        {/* Rental ID */}
                                        <td className="cell-padding font-mono text-secondary">
                                            #{rId}
                                        </td>

                                        {/* Customer Details */}
                                        <td className="cell-padding">
                                            <div className="text-primary">{booking.fullName}</div>
                                            <div className="text-secondary">User ID: <span className="font-mono">{uId}</span></div>
                                        </td>

                                        {/* Car Details */}
                                        <td className="cell-padding">
                                            <div className="text-primary">{booking.carName}</div>
                                            <div className="text-secondary">Car ID: <span className="font-mono">#{cId}</span></div>
                                        </td>

                                        {/* Schedule */}
                                        <td className="cell-padding">
                                            <div className="schedule-container">
                                                <div className="schedule-row">
                                                    <span className="schedule-label">Out</span>
                                                    <span className="schedule-value">{booking.startDate ? new Date(booking.startDate).toLocaleDateString('en-US', dateOptions) : 'N/A'}</span>
                                                </div>
                                                <div className="schedule-row">
                                                    <span className="schedule-label">In</span>
                                                    <span className="schedule-value">{booking.endDate ? new Date(booking.endDate).toLocaleDateString('en-US', dateOptions) : 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Total Price */}
                                        <td className="cell-padding text-price">
                                            ₱{(booking.totalPrice || 0).toLocaleString()}
                                        </td>

                                        {/* Status */}
                                        <td className="cell-padding">
                                            <span className={getStatusBadge(booking.status)}>
                                                {booking.status}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="cell-padding">
                                            <div className="actions-wrapper">

                                                {/* View Details Button (Always Visible) */}
                                                <button
                                                    className="btn-view-details"
                                                    onClick={() => handleViewDetails(booking)}
                                                    title="View Booking and License Details"
                                                >
                                                    👁️ View Details
                                                </button>

                                                {/* Conditional Action Buttons */}
                                                {booking.status === 'Approved' && (
                                                    <div className="btn-group">
                                                        <button className="btn-action-sm btn-green-light" onClick={() => handleCashPayment(rId)}>
                                                            💵 Receive Cash
                                                        </button>
                                                        <button className="btn-action-sm btn-gray-light" onClick={() => handleOnlineLink(rId)}>
                                                            🔗 Send Link
                                                        </button>
                                                    </div>
                                                )}

                                                {booking.status === 'Pending Review' && (
                                                    <div className="btn-group">
                                                        <button onClick={() => handleReview(rId, 'Approved', pId)} className="btn-action-sm btn-blue-solid">
                                                            Approve
                                                        </button>
                                                        <button onClick={() => handleReview(rId, 'Rejected', pId)} className="btn-action-sm btn-red-light">
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}

                                                {booking.status === 'Cancellation Requested' && (
                                                    <div className="btn-group">
                                                        <button onClick={() => handleCancelReview(rId, 'Approved')} className="btn-action-sm btn-amber-solid" title="Approve cancellation and process 75% refund">
                                                            Approve Cancel
                                                        </button>
                                                        <button onClick={() => handleCancelReview(rId, 'Rejected')} className="btn-action-sm btn-gray-light" title="Reject cancellation and keep booking confirmed">
                                                            Reject Cancel
                                                        </button>
                                                    </div>
                                                )}

                                                {booking.status === 'Return Requested' && (
                                                    <div className="btn-group">
                                                        <button onClick={() => handleReturnReview(rId, 'Approved')} className="btn-action-sm btn-indigo-solid" title="Accept Return and calculate penalties">
                                                            Accept Return
                                                        </button>
                                                        <button onClick={() => handleReturnReview(rId, 'Rejected')} className="btn-action-sm btn-rose-light" title="Reject Return (e.g., Car not yet at shop)">
                                                            Reject Return
                                                        </button>
                                                    </div>
                                                )}

                                                {['Completed', 'Returned', 'Cancelled', 'Rejected', 'Refund Required'].includes(booking.status) && (
                                                    <div className="action-completed-text">
                                                        Action Completed
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION CONTROLS */}
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

            {showModal && selectedBooking && (
                <div className="paper-overlay">
                    <div className="paper-document">

                        <div className={`doc-stamp stamp-${(selectedBooking.status || '').replace(/\s+/g, '-').toLowerCase()}`}>
                            {selectedBooking.status}
                        </div>

                        <div className="paper-header">
                            <div className="company-branding">
                                <h2 className="company-title">JKLM CAR RENTAL</h2>
                                <p className="doc-subtitle">Official Booking Review Document</p>
                            </div>
                            <div className="doc-meta">
                                <p><strong>Doc Ref:</strong> #{selectedBooking.rentalId || selectedBooking.rentalID}</p>
                                <p><strong>Date Issued:</strong> {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="paper-divider"></div>

                        <div className="paper-body">
                            <div className="info-block">
                                <h3>I. Customer Details</h3>
                                <div className="info-row">
                                    <span className="info-label">Full Name:</span>
                                    <span className="info-value">{selectedBooking.fullName || selectedBooking.customerName}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Contact Number:</span>
                                    <span className="info-value">{selectedBooking.contactNumber || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="info-block">
                                <h3>II. Rental Schedule</h3>
                                <div className="info-row">
                                    <span className="info-label">Pick-up Location:</span>
                                    <span className="info-value">{selectedBooking.pickupLocation || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Start Date:</span>
                                    <span className="info-value">{new Date(selectedBooking.startDate).toLocaleDateString()}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">End Date:</span>
                                    <span className="info-value">{new Date(selectedBooking.endDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="paper-attachment">
                            <h3>III. Attached Driver's License</h3>
                            <div className="license-frame">
                                {selectedBooking.driverLicense ? (
                                    <img
                                        src={`https://localhost:7263/uploads/licenses/${selectedBooking.driverLicense}`}
                                        alt="Driver License"
                                        onError={(e) => {
                                            e.target.src = '/default-placeholder.png';
                                            e.target.alt = 'Image not found';
                                        }}
                                    />
                                ) : (
                                    <p className="no-license">⚠️ No License Uploaded</p>
                                )}
                            </div>
                        </div>

                        <div className="paper-footer">
                            <div className="signature-area">
                                <div className="sign-line"></div>
                                <p>Authorized Admin Signature</p>
                            </div>
                            <div className="action-buttons">
                                <button className="btn-print" onClick={() => window.print()}>🖨️ Print Document</button>
                                <button className="btn-close-paper" onClick={closeModal}>Close</button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageBooking;