import React, { useState, useEffect } from 'react';
import { FaEye, FaBan, FaUnlock } from 'react-icons/fa';
import '../adminCss/ManageCustomer.css';
import { toast } from 'react-toastify'; 

function ManageCustomers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerHistory, setCustomerHistory] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        message: "",
        onConfirm: null
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://localhost:7263/api/auth/customers');
            const result = await response.json();
            setCustomers(result.data || []);
        } catch (error) {
            console.error("Error fetching customers", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBlock = (id, currentStatus) => {
        const confirmMsg = currentStatus
            ? "Are you sure you want to unblock this user?"
            : "Are you sure you want to block this user?";

        setConfirmModal({
            show: true,
            message: confirmMsg,
            onConfirm: async () => {
                try {
                    const response = await fetch(
                        `https://localhost:7263/api/auth/customers/${id}/toggle-block?isBlocked=${!currentStatus}`,
                        {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );

                    if (response.ok) {
                        alert(currentStatus ? "User unblocked!" : "User blocked!");
                        fetchCustomers();
                    } else {
                        alert("Failed to update user status.");
                    }
                } catch (error) {
                    console.error("Error updating user status", error);
                    alert("Something went wrong.");
                }

                setConfirmModal({ show: false, message: "", onConfirm: null });
            }
        });
    };

    const handleViewCustomer = async (customer) => {
        setSelectedCustomer(customer);
        setShowModal(true);
        try {
            const response = await fetch(`https://localhost:7263/api/auth/customers/${customer.id}/history`);
            const result = await response.json();
            setCustomerHistory(result.data || []);
        } catch (error) {
            console.error("Error fetching history", error);
        }
    };

    const totalUsers = customers.length;
    const verifiedUsers = customers.filter(user => user.isVerified).length;
    const blockedUsers = customers.filter(user => user.isBlocked).length;

    return (
        <div className="manage-customers-container">
            {confirmModal.show && (
                <div className="bw-modal-overlay">
                    <div className="bw-modal-content text-center">
                        <h3>CONFIRM ACTION</h3>
                        <p>{confirmModal.message}</p>

                        <div className="modal-actions-bw">
                            <button className="btn-bw-solid" onClick={confirmModal.onConfirm}>
                                YES
                            </button>
                            <button className="btn-bw-outline" onClick={() => setConfirmModal({ show: false })}>
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <h2>User Management</h2>

            <div className="summary-cards">
                <div className="stat-card">
                    <span className="stat-title">Total Users</span>
                    <span className="stat-number">{totalUsers}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-title">Verified Users</span>
                    <span className="stat-number">{verifiedUsers}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-title">Blocked Users</span>
                    <span className="stat-number">{blockedUsers}</span>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="customer-table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Email</th>
                            <th>Verified</th>
                            <th>Status</th>
                            <th className="text-center">Total Rentals</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-4">Loading customers...</td></tr>
                        ) : customers.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-4">No customers found.</td></tr>
                        ) : (
                            customers.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="customer-profile">
                                            <img
                                                src={user.profileImage ? `https://localhost:7263${user.profileImage}` : `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=e2e8f0&color=334155`}
                                                alt="Profile"
                                                className="profile-pic-small"
                                                onError={(e) => {
                                                    e.target.onerror = null; 
                                                    e.target.src = `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=e2e8f0&color=334155`;
                                                }}
                                            />
                                            <span className="customer-name">{user.firstName} {user.lastName}</span>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        {user.isVerified ? (
                                            <span className="text-verified">✓ Verified</span>
                                        ) : (
                                            <span className="text-unverified">Unverified</span>
                                        )}
                                    </td>
                                    <td>
                                        {user.isBlocked ? (
                                            <span className="status-badge status-blocked">Blocked</span>
                                        ) : (
                                            <span className="status-badge status-active">Active</span>
                                        )}
                                    </td>
                                    <td className="text-center font-bold">{user.totalSuccessfulRentals}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-view" onClick={() => handleViewCustomer(user)} title="View History">
                                                <FaEye />
                                            </button>
                                            <button
                                                className={user.isBlocked ? "btn-unblock" : "btn-block"}
                                                onClick={() => handleToggleBlock(user.id, user.isBlocked)}
                                                title={user.isBlocked ? "Unblock User" : "Block User"}
                                            >
                                                {user.isBlocked ? <FaUnlock /> : <FaBan />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && selectedCustomer && (
                <div className="bw-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="bw-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setShowModal(false)} title="Close">&times;</button>
                        
                        <div className="modal-header">
                            <img
                                src={selectedCustomer.profileImage ? `https://localhost:7263${selectedCustomer.profileImage}` : "/default-user.png"}
                                alt="Profile"
                                className="modal-profile-pic"
                                onError={(e) => { e.target.src = '/default-user.png'; }}
                            />
                            <div className="modal-user-info">
                                <h3>{selectedCustomer.firstName} {selectedCustomer.lastName}</h3>
                                <p className="modal-email">{selectedCustomer.email}</p>
                            </div>
                        </div>

                        <div className="modal-body">
                            <h4 className="history-title">Successful Rental History</h4>
                            <div className="history-list">
                                {customerHistory.length === 0 ? (
                                    <p className="no-history">No completed rentals yet.</p>
                                ) : (
                                    customerHistory.map(rent => (
                                        <div key={rent.rentalId} className="history-card">
                                            <div className="history-card-header">
                                                <span className="car-name">🚗 {rent.carName}</span>
                                                <span className="car-price">₱{rent.totalAmount.toLocaleString()}</span>
                                            </div>
                                            <div className="history-card-dates">
                                                📅 {new Date(rent.startDate).toLocaleDateString()} - {new Date(rent.endDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageCustomers;