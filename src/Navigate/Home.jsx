import { useNavigate } from 'react-router-dom';
import '../Css/home.css'
import { useEffect, useState } from 'react';
function Home() {

    const [cars, setCars] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCars();
    }, []);

    const fetchCars = async () => {
        try {
            const res = await fetch("https://localhost:7263/api/cars");
            const data = await res.json();

            setCars((data.data || data.Data).slice(0, 6));
        }
        catch (err) {
            console.error(err);
        }
    }

    return (
        <>
            <div className='body1'>
                <div className='container'>
                    <h1 className='h1'>Rent Your Dream Car Today!</h1>
                    <p>Fast, reliable, and affordable car rentals in your area.</p>
                    <button onClick={() => navigate("/car")} className='button'>
                        Browse Cars
                    </button>
                </div>
            </div>
           <div className="slider-container">
    <div className="slider-header">
        <h2>Featured Cars</h2>
        <p>Discover our most popular rentals</p>
    </div>

    <div className="slider-viewport">
        <div className="slider-track">
            {cars.concat(cars).map((car, index) => (
                <div key={index} className="car-card">
                    <div className="car-image-wrapper">
                        <img 
                            src={`https://localhost:7263/images/${car.CarImage || car.carImage}`} 
                            alt={car.CarName || car.carName} 
                            className="car-img" 
                            onError={(e) => { e.target.src = '/default-car.png' }} // Fallback if image fails to load
                        />
                        <div className="car-badge">Featured</div>
                    </div>

                    <div className="car-content">
                        <div className="car-title-row">
                            <h3>{car.CarName || car.carName}</h3>
                        </div>
                        
                        <p className="car-info">{car.CarInfo || car.carInfo}</p>
                        
                        <div className="car-meta">
                            <span>💺 {car.Seats || car.seats} Seats</span>
                            <span>⚙️ Auto</span> {/* Add transmission or other static details if you have them */}
                        </div>

                        <div className="car-footer">
                            <div className="car-price">
                                <span className="price-amount">${car.PricePerDay || car.pricePerDay}</span>
                                <span className="price-period">/ day</span>
                            </div>
                            <button className="view-more-btn" onClick={() => navigate("/car")}>
                                View More
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
</div>
        </>
    )
}

export default Home