import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../Css/car.css";

function Car({ isLoggedIn }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [cars, setCars] = useState([]);
    
    // 🟢 GI-ADD: State para sa seat filter
    const [selectedSeats, setSelectedSeats] = useState(""); 

    const userId = localStorage.getItem("userId") || 0; 

    const query = new URLSearchParams(location.search);
    const searchTerm = query.get("search")?.toLowerCase() || "";

    useEffect(() => {
        fetchCars();
    }, [location.search, isLoggedIn]); 

    const fetchCars = async () => {
        try {
            const res = await fetch(`https://localhost:7263/api/cars?userId=${userId}`);
            const data = await res.json();
            setCars(data.data || data.Data);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleFavorite = async (carId) => {
        if (!isLoggedIn) {
            navigate("/login");
            return;
        }

        try {
            const res = await fetch("https://localhost:7263/api/cars/favorite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: parseInt(userId),
                    carId: carId
                })
            });

            if (res.ok) {
                setCars(prevCars => 
                    prevCars.map(car => 
                        car.carID === carId ? { ...car, isFavorite: !car.isFavorite } : car
                    )
                );
            }
        } catch (err) {
            console.error("Error toggling favorite:", err);
        }
    };

    const handleBook = (carName) => {
        if (!isLoggedIn) {
            navigate("/login");
        } else {
            navigate(`/booking/${carName}`);
        }
    };

    // 🟢 GI-ADD: Pagkuha sa mga unique nga gidaghanon sa seats para sa dropdown
    const uniqueSeats = [...new Set(cars.map(car => car.seats))].sort((a, b) => a - b);

    // 🟢 GI-ILISAN: Gi-update ang filter para ma-apil ang selectedSeats checking
    const filteredCars = cars.filter(car => {
        const words = car.carName.toLowerCase().split(" ");
        const searchLower = searchTerm.toLowerCase();
        
        // Check kung nag-match sa search text
        const matchesSearch = searchTerm === "" ? true : words.some(word => word.startsWith(searchLower));
        
        // Check kung nag-match sa gi-select nga seat
        const matchesSeats = selectedSeats === "" ? true : car.seats === parseInt(selectedSeats);

        // I-return lang ang car kung ni-match sa duha (Search ug Seats)
        return matchesSearch && matchesSeats;
    });

    return (
        <div className="car-container">
            <h1 className="title">Available Cars</h1>

            {/* 🟢 GI-ADD: Dropdown UI para sa Seat Filter sa babaw */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <label htmlFor="seatFilter" style={{ marginRight: "10px", fontWeight: "bold" }}>
                    Filter by Seats:
                </label>
                <select 
                    id="seatFilter" 
                    value={selectedSeats} 
                    onChange={(e) => setSelectedSeats(e.target.value)}
                    style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc", cursor: "pointer" }}
                >
                    <option value="">All Seats</option>
                    {uniqueSeats.map((seat) => (
                        <option key={seat} value={seat}>
                            {seat} Seats
                        </option>
                    ))}
                </select>
            </div>

            <div className="car-grid">
                {filteredCars.length > 0 ? (
                    filteredCars.map((car) => (
                        <div key={car.carID} className="car-card">
                            <div className="image-wrapper">
                                <button 
                                    className={`fav-btn ${car.isFavorite ? 'active' : ''}`} 
                                    onClick={() => toggleFavorite(car.carID)}
                                >
                                    {car.isFavorite ? '❤️' : '🤍'}
                                </button>

                                <img
                                    src={car.carImage ? `https://localhost:7263/${car.carImage}` : '/images/${car.carImage}'}
                                    alt={car.carName}
                                />
                            </div>

                            <div className="car-content">
                                <h2>{car.carName}</h2>
                                <p className="info">{car.carInfo}</p>

                                <div className="details">
                                    <span>👥 {car.seats} seats</span>
                                    <span>₱{car.pricePerDay}/day</span>
                                </div>

                                <button onClick={() => handleBook(car.carName)}>
                                    Rent Now
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p style={{ textAlign: "center", width: "100%" }}>
                        No cars found 
                    </p>
                )}
            </div>
        </div>
    );
}

export default Car;