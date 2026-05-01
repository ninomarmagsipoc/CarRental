import { useNavigate } from 'react-router-dom';
import '../Css/home.css';
import ninoImage from '../assets/ninoMar.jpg';
import lawrence from '../assets/lawrence.jpg';
import jacob from '../assets/jacob.jpg';
import kyla from '../assets/kyla.jpg';
import { useEffect, useState } from 'react';

function Home() {
    const [cars, setCars] = useState([]);
    const [paymentMessage, setPaymentMessage] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("");
    const navigate = useNavigate();


    useEffect(() => {
        fetchCars();
    }, []);

    useEffect(() => {
        const verifyReturningPayment = async () => {
            const ref = localStorage.getItem("payMongoRef");
            if (!ref) return;

            try {
                setPaymentStatus("loading");
                setPaymentMessage("Verifying your payment... Please wait.");

                const res = await fetch(`https://localhost:7263/api/payment/verify?payMongoReference=${ref}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                });

                const data = await res.json();

                if (data.statusCode === 200 || data.data === true) {
                    setPaymentStatus("success");
                    setPaymentMessage(data.message || "Payment Successful!");
                } else {
                    setPaymentStatus("error");
                    setPaymentMessage(data.message || "Payment verification failed.");
                }

            } catch (error) {
                console.error("Error verifying payment:", error);
                setPaymentStatus("error");
                setPaymentMessage("Network error while verifying your payment.");
            } finally {
                localStorage.removeItem("payMongoRef");

                setTimeout(() => {
                    setPaymentMessage("");
                    setPaymentStatus("");
                }, 3000);
            }
        };

        verifyReturningPayment();
    }, []);

    const fetchCars = async () => {
        try {
            const res = await fetch("https://localhost:7263/api/cars");
            const data = await res.json();
            setCars((data.data || data.Data).slice(0, 6));
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <>
            {paymentMessage && (
                <div className="floating-alert-overlay">
                    <div className={`floating-alert ${paymentStatus}`}>
                        <p>{paymentMessage}</p>
                    </div>
                </div>
            )}
            
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
                                        src={`https://localhost:7263/${car.CarImage || car.carImage}`}
                                        alt={car.CarName || car.carName}
                                        className="car-img"
                                        onError={(e) => { e.target.src = '/default-car.png' }}
                                    />
                                    <div className="car-badge">Featured</div>
                                </div>
                                <div className="car-content">
                                    <div className="car-title-row">
                                        <h3>{car.CarName || car.carName}</h3>
                                    </div>
                                    <div className="car-info">{car.CarInfo || car.carInfo}</div>
                                    <div className="car-meta">
                                        <span>💺 {car.Seats || car.seats} Seats</span>
                                        <span>⚙️ Auto</span>
                                    </div>
                                    <div className="car-footer">
                                        <div className="car-price">
                                            <span className="price-amount">₱{car.PricePerDay || car.pricePerDay}</span>
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

            <section className="creators-section">
                <div className="creators-header">
                    <h2>Meet the Developers</h2>
                    <p>The minds behind the system</p>
                </div>

                <div className="creators-grid">
                    <div className="creator-card">
                        <div className="creator-image-container">
                            <img
                                src={ninoImage}
                                alt="Nino Mar"
                                className="creator-profile-pic" />
                        </div>
                        <div className="creator-info">
                            <h3>Magsipoc, Niño Mar U.</h3>
                            <p>Backend Developer</p>
                            <a
                                href="https://www.facebook.com/shanon.nam.1"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="fb-link-btn"
                            >
                                <span className="fb-icon">f</span> Visit Facebook Profile
                            </a>
                        </div>
                    </div>
                    <div className="creator-card">
                        <div className="creator-image-container">
                            <img
                                src={lawrence}
                                alt="Creator Name"
                                className="creator-profile-pic"
                            />
                        </div>
                        <div className="creator-info">
                            <h3>Maligro, Lawrence R.</h3>
                            <p>Frontend Developer</p>
                            <a
                                href="https://www.facebook.com/lawrence.maligro.2024"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="fb-link-btn"
                            >
                                <span className="fb-icon">f</span> Visit Facebook Profile
                            </a>
                        </div>
                    </div>
                    <div className="creator-card">
                        <div className="creator-image-container">
                            <img
                                src={jacob}
                                alt="Creator Name"
                                className="creator-profile-pic"
                            />
                        </div>
                        <div className="creator-info">
                            <h3>Bugtong, John Jacob D.</h3>
                            <p>Mobile Developer</p>
                            <a
                                href="https://www.facebook.com/johnz.desabelle"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="fb-link-btn"
                            >
                                <span className="fb-icon">f</span> Visit Facebook Profile
                            </a>
                        </div>
                    </div>
                    <div className="creator-card">
                        <div className="creator-image-container">
                            <img
                                src={kyla}
                                alt="Creator Name"
                                className="creator-profile-pic"
                            />
                        </div>
                        <div className="creator-info">
                            <h3>Francisco, kyla B.</h3>
                            <p>Tester & Document Specialist</p>
                            <a
                                href="https://www.facebook.com/lala.franz.77"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="fb-link-btn"
                            >
                                <span className="fb-icon">f</span> Visit Facebook Profile
                            </a>
                        </div>
                    </div>

                </div>
            </section>
        </>
    )
}

export default Home;