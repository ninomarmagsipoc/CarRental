import React, { useState, useEffect } from 'react';

function ManageBooking() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch the bookings as soon as the component loads
    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            // Note: Update this URL to match your backend port (e.g., http://localhost:5000/api/admin/rentals)
            const response = await fetch('https://localhost:7263/api/rental');

            if (!response.ok) throw new Error('Failed to fetch bookings');

            const result = await response.json();
            // Assuming your backend returns ServiceResponse, the list is inside the 'data' property
            setBookings(result.data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    // Handle the Approve or Reject action
    const handleReview = async (rentalId, newStatus) => {
        // Optional: Add a confirmation dialog so you don't accidentally reject someone
        if (!window.confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;

        try {
            const response = await fetch(`https://localhost:7263/api/rental/admin/rentals/${rentalId}/review`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newStatus) // Sending "Approved" or "Rejected"
            });

            if (response.ok) {
                // Instantly update the UI without needing to refresh the page
                setBookings(prevBookings =>
                    prevBookings.map(b =>
                        b.rentalID === rentalId ? { ...b, status: newStatus } : b
                    )
                );
            } else {
                alert("Failed to update booking status. Please check the console.");
            }
        } catch (err) {
            console.error("Error updating booking:", err);
        }
    };

    if (loading) return <div>Loading bookings...</div>;
    if (error) return <div>Error fetching data: {error}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>Manage Pending Bookings</h2>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f4f4f4', borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '10px' }}>Rental ID</th>
                        <th style={{ padding: '10px' }}>Customer</th>
                        <th style={{ padding: '10px' }}>Car ID</th>
                        <th style={{ padding: '10px' }}>Dates</th>
                        <th style={{ padding: '10px' }}>Total Price</th>
                        <th style={{ padding: '10px' }}>Status</th>
                        <th style={{ padding: '10px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map((booking, index) => {
                        // PRO-TIP: If a column is still blank, uncomment the line below to see the EXACT spelling in your browser console!
                        // console.log("Row data:", booking); 

                        // Note: Depending on your .NET version, ID might be 'Id' or 'ID'. We use || to catch both just in case!
                        const rId = booking.rentalID || booking.rentalId;
                        const cId = booking.carID || booking.carId;
                        const uId = booking.userID || booking.userId;

                        return (
                            <tr key={rId || index} style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '10px' }}>{rId}</td>
                                <td style={{ padding: '10px' }}>
                                    {booking.userName} <br />
                                    <small style={{ color: '#888' }}>(ID: {uId})</small>
                                </td>
                                <td style={{ padding: '10px' }}>{cId}</td>
                                <td style={{ padding: '10px' }}>
                                    {booking.startDate ? new Date(booking.startDate).toLocaleDateString() : 'N/A'} to {booking.endDate ? new Date(booking.endDate).toLocaleDateString() : 'N/A'}
                                </td>
                                <td style={{ padding: '10px' }}>₱{booking.totalPrice}</td>
                                <td style={{ padding: '10px' }}>
                                    <strong style={{
                                        color: booking.status === 'Pending' ? 'orange' :
                                            booking.status === 'Approved' ? 'green' : 'red'
                                    }}>
                                        {booking.status}
                                    </strong>
                                </td>
                                <td style={{ padding: '10px' }}>
                                    {booking.status === 'Pending' ? (
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => handleReview(rId, 'Approved')}
                                                style={{ padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReview(rId, 'Rejected')}
                                                style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                                Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <span style={{ color: '#888' }}>Action Completed</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {bookings.length === 0 && <p>No bookings found.</p>}
        </div>
    );
}

export default ManageBooking;