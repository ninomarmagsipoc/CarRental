import React, { useState, useEffect, useMemo } from 'react';
import '../Css/ManagePayment.css';

function ManagePayment() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchAllPayments();
    }, []);

    const fetchAllPayments = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://localhost:7263/api/payment');
            const result = await response.json();
            const status = result.statusCode || result.StatusCode;

            if (response.ok && status === 200) {
                setPayments(result.data || result.Data || []);
            } else {
                setError(result.message || result.Message || "Failed to load payments.");
            }
        } catch (err) {
            setError("Network error. Please check your backend.");
        } finally {
            setLoading(false);
        }
    };

    const handleRefund = async (paymentId) => {
        const reason = window.prompt("Enter reason for refund:");
        if (!reason) return;

        try {
            const response = await fetch(`https://localhost:7000/api/payment/refund/${paymentId}?reason=${encodeURIComponent(reason)}`, {
                method: 'POST'
            });
            const result = await response.json();

            if (response.ok) {
                alert("Refund processed successfully!");
                fetchAllPayments(); // Refresh table
            } else {
                alert(result.message || "Refund failed.");
            }
        } catch (err) {
            alert("Error connecting to server.");
        }
    };

    // Calculate Summary Stats
    const stats = useMemo(() => {
        let totalRevenue = 0;
        let pendingCount = 0;

        payments.forEach(p => {
            const status = p.paymentStatus || p.PaymentStatus;
            const amount = p.amount || p.Amount || 0;

            if (status === 'Completed') totalRevenue += amount;
            if (status === 'Pending') pendingCount += 1;
        });

        return { totalRevenue, pendingCount };
    }, [payments]);

    // Filter Payments based on search term
    const filteredPayments = payments.filter(p => {
        const searchLower = searchTerm.toLowerCase();
        const customer = (p.userName || p.UserName || "").toLowerCase();
        const bookingId = (p.rentalID || p.RentalID || "").toString();
        const paymentId = (p.paymentID || p.PaymentID || "").toString();

        return customer.includes(searchLower) ||
            bookingId.includes(searchLower) ||
            paymentId.includes(searchLower);
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Completed': return 'status-badge status-completed';
            case 'Pending': return 'status-badge status-pending';
            case 'Refunded': return 'status-badge status-refunded';
            default: return 'status-badge status-default';
        }
    };

    if (loading && payments.length === 0) return <div className="loading-state">Loading system data...</div>;
    if (error) return <div className="error-state">{error}</div>;

    return (
        <div className="manage-payment-container">

            {/* Header Section */}
            <div className="page-header">
                <div>
                    <h2 className="page-title">Payment Management</h2>
                    <p className="page-subtitle">Monitor and manage all customer transactions.</p>
                </div>
                <button onClick={fetchAllPayments} className="btn-primary">
                    ↻ Refresh Data
                </button>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
                <div className="card">
                    <h3>Total Revenue</h3>
                    <p className="card-value text-green">₱{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="card">
                    <h3>Pending Payments</h3>
                    <p className="card-value text-orange">{stats.pendingCount}</p>
                </div>
                <div className="card">
                    <h3>Total Transactions</h3>
                    <p className="card-value text-blue">{payments.length}</p>
                </div>
            </div>

            {/* Controls Section (Search) */}
            <div className="table-controls">
                <input
                    type="text"
                    placeholder="Search by Customer, Booking ID, or Payment ID..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table Section */}
            <div className="table-wrapper">
                <table className="payment-table">
                    <thead>
                        <tr>
                            <th>Payment ID</th>
                            <th>Customer</th>
                            <th>Booking ID</th>
                            <th>Total Amount</th>
                            <th>Paid</th>
                            <th>Amount Remaining</th>
                            <th>Payment Type</th>
                            <th>Status</th>
                            <th>Method</th>

                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayments.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="empty-message">
                                    {searchTerm ? "No results matched your search." : "No records found."}
                                </td>
                            </tr>
                        ) : (
                            filteredPayments.map((p) => {
                                const status = p.paymentStatus || p.PaymentStatus;
                                const pType = p.paymentType || p.PaymentType || 'N/A';
                                return (
                                    <tr key={p.paymentID || p.PaymentID}>
                                        <td className="font-mono text-muted">#{p.paymentID || p.PaymentID}</td>
                                        <td className="font-medium">{p.userName || p.UserName}</td>
                                        <td>#{p.rentalID || p.RentalID}</td>
                                        <td>₱{(p.totalAmount || p.TotalAmount || 0).toLocaleString()}</td>
                                        <td className="text-green font-semibold">
                                            ₱{(p.amount || p.Amount || 0).toLocaleString()}
                                        </td>
                                        <td>{p.balanceDisplay || p.BalanceDisplay}</td>
                                        <td>
                                            <span className="font-medium">{pType}</span>
                                        </td>
                                        <td>
                                            <span className={getStatusBadge(status)}>
                                                {status}
                                            </span>
                                        </td>
                                        <td>{p.paymentMethod || p.PaymentMethod}</td>

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

export default ManagePayment;