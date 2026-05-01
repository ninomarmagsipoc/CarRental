import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Css/car.css"; 

function Favorite({ isLoggedIn }) {
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    const userId = localStorage.getItem("userId") || 0;

    useEffect(() => {
        if (!isLoggedIn) {
            navigate("/login");
        } else {
            fetchFavorites();
        }
    }, [isLoggedIn]);

    const fetchFavorites = async () => {
        try {
            
            const res = await fetch(`https://localhost:7263/api/cars?userId=${userId}`);
            const data = await res.json();
            
            
            const carList = data.data || data.Data || [];
            const favList = carList.filter(car => car.isFavorite === true);
            
            setFavorites(favList);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching favorites:", err);
            setLoading(false);
        }
    };

    const removeFavorite = async (carId) => {
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
                
                setFavorites(prev => prev.filter(car => car.carID !== carId));
            }
        } catch (err) {
            console.error("Error removing favorite:", err);
        }
    };

    if (loading) return <div className="car-container"><p>Loading favorites...</p></div>;

    return (
        <div className="car-container">
            <h1 className="title">My Favorites</h1>

            <div className="car-grid">
                {favorites.length > 0 ? (
                    favorites.map((car) => (
                        <div key={car.carID} className="car-card">
                            <div className="image-wrapper">
                                <button 
                                    className="fav-btn active" 
                                    onClick={() => removeFavorite(car.carID)}
                                >
                                    ❤️
                                </button>
                                <img
                                    src={`https://localhost:7263/${car.carImage}`}
                                    alt={car.carName}
                                />
                            </div>

                            <div className="car-content">
                                <h2>{car.carName}</h2>
                                <p className="info">{car.carInfo}</p>
                                <div className="details">
                                    <span>👥 {car.seats} seats</span>
                                    <span>💰 ₱{car.pricePerDay}/day</span>
                                </div>
                                <button onClick={() => navigate(`/booking/${car.carName}`)}>
                                    Rent Now
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-favs" style={{ textAlign: "center", width: "100%", padding: "50px" }}>
                        <p>Favorite Car is Empty Please select a Car. 🚗</p>
                        <button onClick={() => navigate("/car")}>Browse Cars</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Favorite;