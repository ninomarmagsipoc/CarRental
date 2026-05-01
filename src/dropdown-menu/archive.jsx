import React, { useState, useEffect } from 'react';
import '../Css/Archived.css';

function Archive() {
    const [archived, setArchived] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        message: "",
        onConfirm: null
    });
    const handleConfirmYes = () => {
        if (confirmModal.onConfirm) {
            confirmModal.onConfirm();
        }
        setConfirmModal({ show: false, message: "", onConfirm: null });
    };

    const handleConfirmNo = () => {
        setConfirmModal({ show: false, message: "", onConfirm: null });
    };

    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };

    const fetchArchivedHistory = async () => {
        setLoading(true);
        let userId = 0;
        try {
            const storedUser = JSON.parse(localStorage.getItem("user"));
            userId = storedUser?.id || storedUser?.Id || 0;

            if (userId === 0) return;

            const response = await fetch(`https://localhost:7263/api/rental/user/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const result = await response.json();

            if (result && result.data) {
                const trashedRentals = result.data.filter(r =>
                    (r.isDeleted === true || r.IsDeleted === true) &&
                    (r.isPermanentlyHidden !== true && r.IsPermanentlyHidden !== true)
                );
                setArchived(trashedRentals);
            }
        } catch (error) {
            console.error("Error fetching archive:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArchivedHistory();
    }, []);

    const handleRestore = (rentalId) => {
        setConfirmModal({
            show: true,
            message: "Are you sure you want to restore this record?",
            onConfirm: async () => {
                try {
                    const response = await fetch(
                        `https://localhost:7263/api/rental/${rentalId}/restore`,
                        { method: 'PUT' }
                    );

                    if (response.ok) {
                        toast.success("Record restored successfully! You can see it again in your Rent History.");
                        fetchArchivedHistory();
                    } else {
                        toast.error("Failed to restore record.");
                    }
                } catch (error) {
                    console.error("Error restoring rental:", error);
                    toast.error("Something went wrong.");
                }

                // close modal
                setConfirmModal({ show: false, message: "", onConfirm: null });
            }
        });
    };
    const handlePermanentHide = (rentalId) => {
        setConfirmModal({
            show: true,
            message: "Are you sure you want to permanently delete this record? This action cannot be undone.",
            onConfirm: async () => {
                try {
                    const response = await fetch(
                        `https://localhost:7263/api/rental/${rentalId}/hide`,
                        { method: 'PUT' }
                    );

                    if (response.ok) {
                        toast.success("Record permanently deleted from your view.");
                        fetchArchivedHistory();
                    } else {
                        toast.error("Failed to delete record.");
                    }
                } catch (error) {
                    console.error("Error hiding rental:", error);
                    toast.error("Something went wrong.");
                }

                // close modal
                setConfirmModal({ show: false, message: "", onConfirm: null });
            }
        });
    };

    return (
        <div className="history-container">
            {confirmModal.show && (
                <div className="bw-modal-overlay">
                    <div className="bw-modal-content" style={{ textAlign: 'center' }}>
                        <h3 className="mb-15">Confirmation</h3>

                        <p className="mb-20">
                            {confirmModal.message}
                        </p>

                        <div className="modal-actions-bw">
                            <button
                                onClick={handleConfirmNo}
                                className="btn-bw-outline"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleConfirmYes}
                                className="btn-bw-solid"
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="history-header">
                <div className="header-flex">
                    <div className="text-content">
                        <h2>Your Archive & Trash</h2>
                        <p>Manage your deleted rental records.</p>
                    </div>
                </div>
            </div>

            <div className="history-content">
                {loading ? (
                    <div className="loading-state">Loading your archived history...</div>
                ) : archived.length === 0 ? (
                    <div className="empty-state">
                        <h3>Your archive is empty</h3>
                        <p>You have no deleted rental records.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Rental ID</th>
                                    <th>Car</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Total Price</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {archived.map((booking, index) => {
                                    const rId = booking.rentalID || booking.RentalID;
                                    const carName = booking.carName || booking.CarName || "Unknown Car";
                                    const price = booking.totalPrice || booking.TotalPrice || 0;
                                    const sDate = booking.startDate || booking.StartDate;
                                    const eDate = booking.endDate || booking.EndDate;

                                    return (
                                        <tr key={rId || index}>
                                            <td><strong>#{rId}</strong></td>
                                            <td>{carName}</td>
                                            <td>{new Date(sDate).toLocaleDateString(undefined, dateOptions)}</td>
                                            <td>{new Date(eDate).toLocaleDateString(undefined, dateOptions)}</td>
                                            <td>₱{price.toLocaleString()}</td>
                                            <td style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    className="btn-action btn-accept"
                                                    onClick={() => handleRestore(rId)}
                                                >
                                                    Restore
                                                </button>

                                                <button
                                                    className="btn-action btn-reject"
                                                    onClick={() => handlePermanentHide(rId)}
                                                >
                                                    Delete Permanently
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Archive;