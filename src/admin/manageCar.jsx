import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../adminCss/manageCar.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ManageCars() {
    const [cars, setCars] = useState([]);
    const [bookings, setBookings] = useState([]);

    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedCarName, setSelectedCarName] = useState("");

    const [showEditModal, setShowEditModal] = useState(false);
    const [editCarData, setEditCarData] = useState({
        carId: '', carName: '', carInfo: '', seats: '', pricePerDay: '', maintenanceMonth: '', imageFile: null
    });

    const [confirmModal, setConfirmModal] = useState({
        show: false,
        message: "",
        onConfirm: null
    });

    const [newCar, setNewCar] = useState({
        carName: '',
        carInfo: '',
        seats: '',
        pricePerDay: '',
        imageFile: null
    });

    const [isArchiveView, setIsArchiveView] = useState(false);

    useEffect(() => {
        fetchCars();
    }, [isArchiveView]);

    useEffect(() => {
        fetchCars();
    }, []);

    const fetchCars = async () => {
        try {
            const url = isArchiveView
                ? 'https://localhost:7263/api/archived'
                : 'https://localhost:7263/api/cars';

            const res = await fetch(url);
            const result = await res.json();
            if (result.data) {
                setCars(result.data);
            } else {
                setCars([]);
            }
        } catch (error) {
            console.error("Error fetching cars:", error);
        }
    };

    // ADD NEW CAR
    const handleAddCar = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('CarName', newCar.carName);
        formData.append('CarInfo', newCar.carInfo);
        formData.append('Seats', newCar.seats);
        formData.append('PricePerDay', newCar.pricePerDay);
        formData.append('ImageFile', newCar.imageFile);

        try {
            const res = await fetch('https://localhost:7263/api', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                toast.success("Car added successfully!");
                setNewCar({ carName: '', carInfo: '', seats: '', pricePerDay: '', imageFile: null });
                document.getElementById('carImageInput').value = "";
                fetchCars();
            } else {
                toast.error("Failed to add car.");
            }
        } catch (error) {
            console.error("Error adding car:", error);
        }
    };

    // DELETE / HIDE CAR
    const handleDeleteCar = (id) => {
        setConfirmModal({
            show: true,
            message: "Are you sure you want to hide/delete this car?",
            onConfirm: async () => {
                try {
                    const res = await fetch(`https://localhost:7263/api/${id}`, { method: 'DELETE' });

                    if (res.ok) {
                        toast.success("Car hidden successfully");
                        fetchCars();
                    } else {
                        const result = await res.json();
                        toast.error(result.message || "Failed to hide car. It might have active rentals.");
                    }
                } catch (error) {
                    console.error("Error deleting car:", error);
                    toast.error("Something went wrong.");
                }

                // close modal after action
                setConfirmModal({ show: false });
            }
        });
    };

    // RESTORE CAR
    const handleRestoreCar = (carId) => {
        setConfirmModal({
            show: true,
            message: "Are you sure you want to restore this car?",
            onConfirm: async () => {
                try {
                    const res = await fetch(`https://localhost:7263/api/restore/${carId}`, {
                        method: 'PUT'
                    });

                    if (res.ok) {
                        toast.success("Car restored successfully!");
                        fetchCars();
                    } else {
                        toast.error("Failed to restore car.");
                    }
                } catch (error) {
                    console.error("Error restoring car:", error);
                    toast.error("Something went wrong.");
                }

                // close modal after action
                setConfirmModal({ show: false, message: "", onConfirm: null });
            }
        });
    };

    // OPEN EDIT MODAL
    const openEditModal = (car) => {
        setEditCarData({
            carId: car.carID,
            carName: car.carName || '',
            carInfo: car.carInfo || '',
            seats: car.seats || '',
            pricePerDay: car.pricePerDay || '',
            maintenanceMonth: car.maintenanceMonth || '',
            imageFile: null
        });
        setShowEditModal(true);
    };

    // SUBMIT EDIT CAR
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('CarName', editCarData.carName);
        formData.append('CarInfo', editCarData.carInfo);
        formData.append('Seats', editCarData.seats);
        formData.append('PricePerDay', editCarData.pricePerDay);

        if (editCarData.maintenanceMonth) {
            formData.append('MaintenanceMonth', editCarData.maintenanceMonth);
        }
        if (editCarData.imageFile) {
            formData.append('ImageFile', editCarData.imageFile);
        }

        try {
            const res = await fetch(`https://localhost:7263/api/edit/${editCarData.carId}`, {
                method: 'PUT',
                body: formData
            });

            if (res.ok) {
                toast.success("Car updated successfully!");
                setShowEditModal(false);
                fetchCars();
            } else {
                const errorResult = await res.json();
                console.log("Full Error Result:", errorResult);

                let detailedErrors = "";
                if (errorResult.errors) {
                    detailedErrors = "\\nDetails: " + JSON.stringify(errorResult.errors);
                }

                const errorMessage = errorResult.message || errorResult.title || "Unknown error";

                toast.error("Failed to update car. Reason: " + errorMessage + detailedErrors);
            }

        } catch (error) {
            console.error("Error updating car:", error);
        }
    };

    const openCalendar = async (car) => {
        setSelectedCarName(car.carName);
        try {
            const res = await fetch(`https://localhost:7263/api/rental/car/${car.carID}/booked-dates`);
            const result = await res.json();
            if (result.data) {
                setBookings(result.data);
            } else {
                setBookings([]);
            }
            setShowCalendar(true);
        } catch (error) {
            console.error("Error fetching bookings:", error);
        }
    };

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const formattedDate = date.toLocaleDateString('en-CA');
            const isBooked = bookings.some(booking => {
                const start = new Date(booking.startDate).toLocaleDateString('en-CA');
                const end = new Date(booking.endDate).toLocaleDateString('en-CA');
                return formattedDate >= start && formattedDate <= end;
            });
            if (isBooked) {
                return 'booked-date-black';
            }
        }
        return null;
    };

    return (
        <div className="manage-cars-container">
            {confirmModal.show && (
                <div className="bw-modal-overlay">
                    <div className="bw-modal-content" style={{ textAlign: 'center' }}>
                        <h3>CONFIRM ACTION</h3>
                        <p>{confirmModal.message}</p>

                        <div className="modal-actions-bw">
                            <button
                                className="btn-bw-solid"
                                onClick={confirmModal.onConfirm}
                            >
                                YES
                            </button>

                            <button
                                className="btn-bw-outline"
                                onClick={() => setConfirmModal({ show: false })}
                            >
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="admin-header-section">
                <h2>{isArchiveView ? "ARCHIVED VEHICLES" : "FLEET MANAGEMENT"}</h2>
                <button
                    className={isArchiveView ? "btn-bw-solid" : "btn-bw-outline"}
                    onClick={() => setIsArchiveView(!isArchiveView)}
                >
                    {isArchiveView ? "← BACK TO ACTIVE CARS" : "VIEW ARCHIVE"}
                </button>
            </div>

            <div className="car-grid">
                {/* CAR LIST */}
                {cars.map((car, index) => (
                    <div key={car.carID || index} className="bw-car-card">
                        <div className="car-image-container">
                            <img
                                src={`https://localhost:7263${car.carImage}`}
                                alt={car.carName}
                                className="car-image"
                                onError={(e) => { e.target.src = '/default-car.png'; }}
                            />
                            {car.maintenanceMonth && (
                                <span className="maintenance-badge-bw">
                                    MAINTENANCE: {car.maintenanceMonth}
                                </span>
                            )}
                        </div>
                        <div className="car-info">
                            <h3>{car.carName}</h3>
                            <p className="car-desc">{car.carInfo}</p>
                            <div className="car-specs-bw">
                                <span>{car.seats} SEATS</span>
                                <span className="price">₱{car.pricePerDay} / DAY</span>
                            </div>
                        </div>
                        <div className="car-actions-bw">
                            <button className="btn-bw-solid" onClick={() => openEditModal(car)}>
                                Edit
                            </button>

                            {car.isHidden ? (
                                <button className="btn-bw-outline" onClick={() => handleRestoreCar(car.carID)}>
                                    Restore
                                </button>
                            ) : (
                                <button className="btn-bw-outline" onClick={() => handleDeleteCar(car.carID)}>
                                    Archive
                                </button>
                            )}

                            <button className="btn-bw-text" onClick={() => openCalendar(car)}>
                                View Calendar &rarr;
                            </button>
                        </div>
                    </div>
                ))}

                {/* ADD CAR FORM CARD */}
                {!isArchiveView && (
                    <div className="bw-car-card add-car-card">
                        <div className="car-info">
                            <h3>ADD NEW VEHICLE</h3>
                            <form onSubmit={handleAddCar} className="add-car-form-bw">
                                <input type="text" placeholder="Vehicle Model (e.g. Toyota Vios)" value={newCar.carName} onChange={(e) => setNewCar({ ...newCar, carName: e.target.value })} required className="input-bw" />
                                <textarea placeholder="Vehicle Description" value={newCar.carInfo} onChange={(e) => setNewCar({ ...newCar, carInfo: e.target.value })} required className="input-bw" rows="3"></textarea>
                                <div className="input-group-half">
                                    <input type="number" placeholder="Seats" value={newCar.seats} onChange={(e) => setNewCar({ ...newCar, seats: e.target.value })} required className="input-bw" />
                                    <input type="number" placeholder="Rate per Day" value={newCar.pricePerDay} onChange={(e) => setNewCar({ ...newCar, pricePerDay: e.target.value })} required className="input-bw" />
                                </div>

                                <label className="upload-label-bw">UPLOAD PREVIEW IMAGE:</label>
                                <input type="file" id="carImageInput" accept="image/*" onChange={(e) => setNewCar({ ...newCar, imageFile: e.target.files[0] })} required className="file-input-bw" />

                                <button type="submit" className="btn-bw-solid mt-10">REGISTER VEHICLE</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* EDIT CAR MODAL */}
            {showEditModal && (
                <div className="bw-modal-overlay">
                    <div className="bw-modal-content">
                        <h3>EDIT VEHICLE DETAILS</h3>
                        <form onSubmit={handleEditSubmit} className="add-car-form-bw">
                            <input type="text" placeholder="Vehicle Model" value={editCarData.carName} onChange={(e) => setEditCarData({ ...editCarData, carName: e.target.value })} required className="input-bw" />
                            <textarea placeholder="Description" value={editCarData.carInfo} onChange={(e) => setEditCarData({ ...editCarData, carInfo: e.target.value })} required className="input-bw" rows="3"></textarea>
                            <div className="input-group-half">
                                <input type="number" placeholder="Seats" value={editCarData.seats} onChange={(e) => setEditCarData({ ...editCarData, seats: e.target.value })} required className="input-bw" />
                                <input type="number" placeholder="Rate per Day" value={editCarData.pricePerDay} onChange={(e) => setEditCarData({ ...editCarData, pricePerDay: e.target.value })} required className="input-bw" />
                            </div>

                            <label className="upload-label-bw">MAINTENANCE SCHEDULE:</label>
                            <input type="text" placeholder="e.g. October 2026 (Leave blank if active)" value={editCarData.maintenanceMonth} onChange={(e) => setEditCarData({ ...editCarData, maintenanceMonth: e.target.value })} className="input-bw" />

                            <label className="upload-label-bw">UPDATE IMAGE (OPTIONAL):</label>
                            <input type="file" accept="image/*" onChange={(e) => setEditCarData({ ...editCarData, imageFile: e.target.files[0] })} className="file-input-bw" />

                            <div className="modal-actions-bw">
                                <button type="submit" className="btn-bw-solid">SAVE CHANGES</button>
                                <button type="button" onClick={() => setShowEditModal(false)} className="btn-bw-outline">CANCEL</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CALENDAR MODAL */}
            {showCalendar && (
                <div className="bw-modal-overlay">
                    <div className="bw-modal-content calendar-wrapper-bw">
                        <h3>RESERVATION SCHEDULE</h3>
                        <p className="calendar-subtitle">{selectedCarName}</p>

                        <Calendar tileClassName={tileClassName} className="bw-react-calendar" />

                        <div className="calendar-legend-bw">
                            <div className="legend-box-black"></div>
                            <span>Confirmed Booking</span>
                        </div>

                        <button onClick={() => setShowCalendar(false)} className="btn-bw-outline mt-10">
                            CLOSE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageCars;