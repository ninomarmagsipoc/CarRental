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
            <div className="slider">
                <h1>Features Cars</h1>
                <div className="slider-track">
                    {cars.concat(cars).map((car, index) => ( // duplicate for smooth loop
                        <div key={index} className="car-card">
                            <img src={car.CarImage || car.carImage} alt={car.CarName || car.carName} className="car-img" />
                            <h3>{car.CarName || car.carName}</h3>
                            <p>{car.CarInfo || car.carInfo}</p>
                            <p>Seats: {car.Seats || car.seats}</p>
                            <p>${car.PricePerDay || car.pricePerDay}</p>

                            <button onClick={() => navigate("/car")}>
                                View More
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}

export default Home