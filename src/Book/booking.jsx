import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../Css/rental.css";

function Rental({ isLoggedIn }) {
  const { carName } = useParams();
  const navigate = useNavigate();

  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalDays, setTotalDays] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
    } else {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    fetchCars();
  }, []);

  useEffect(() => {
    if (startDate && endDate && selectedCar) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      setTotalDays(days > 0 ? days : 0);
      setTotalPrice(days > 0 ? days * selectedCar.pricePerDay : 0);
    } else {
      setTotalDays(0);
      setTotalPrice(0);
    }
  }, [startDate, endDate, selectedCar]);

  const fetchCars = async () => {
    try {
      const res = await fetch("https://localhost:7263/api/cars");
      const data = await res.json();
      const allCars = data.data || data.Data;
      setCars(allCars);
      const car = allCars.find(c => c.carName === carName);
      setSelectedCar(car || null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRental = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }

    const userId = localStorage.getItem("userId");
    if (!selectedCar || !startDate || !endDate) {
      setMessage("Please select valid dates.");
      return;
    }

    setIsProcessing(true);
    setMessage("Creating your booking...");

    try {
      // STEP 1: Create the Rental in your DB
      const rentalRes = await fetch("https://localhost:7263/api/rental/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userID: parseInt(userId),
          carID: selectedCar.carID,
          startDate,
          endDate,
          totalPrice: totalPrice
        }),
      });

      const rentalData = await rentalRes.json();
      
      // Safely extract the ID without throwing unnecessary errors
      const rentalId = rentalData.rentalID || rentalData.data?.rentalID || rentalData.Data?.rentalID;

      if (!rentalId) {
        setMessage(rentalData.message || "Failed to create rental. No ID returned.");
        setIsProcessing(false);
        return;
      }

      setMessage("Booking secured! Redirecting to PayMongo...");

      // STEP 2: Create the Payment Link (Hits your C# PaymentService)
      const paymentRes = await fetch("https://localhost:7263/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentalID: rentalId,
          userID: parseInt(userId),
          paymentMethod: "PayMongo" 
        }),
      });

      const paymentData = await paymentRes.json();

      // STEP 3: Redirect user to PayMongo Link
      if (paymentRes.ok && paymentData.data?.checkoutUrl) {
        window.location.href = paymentData.data.checkoutUrl;
      } else {
        setMessage("Booking saved, but failed to generate payment link.");
        console.error("Payment API Error:", paymentData);
      }

    } catch (err) {
      console.error(err);
      setMessage("Server error. Please try again.");
    } finally {
      // If we redirect, this won't matter, but it's safe to keep here.
      setIsProcessing(false); 
    }
  };

  if (!selectedCar) {
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Car not found 😢</p>;
  }

  // Calculate today's date for the minimum input limits
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="rental-page">
      <h1 className="rental-title">🚗 Rent {selectedCar.carName}</h1>

      <div className="rental-card">
        <div className="rental-image">
          <img
            src={`https://localhost:7263/images/${selectedCar.carImage}`}
            alt={selectedCar.carName}
          />
        </div>

        <div className="rental-info">
          <p className="car-info">{selectedCar.carInfo}</p>
          <p>Seats: {selectedCar.seats}</p>
          <p>Price per day: ₱{selectedCar.pricePerDay}</p>

          <div className="rental-dates">
            <label>Start Date:</label>
            <input
              type="date"
              min={today}
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />

            <label>End Date:</label>
            <input 
              type="date" 
              min={startDate || today} 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
            />
          </div>

          {totalDays > 0 && (
            <div className="rental-total">
              <p>Total Days: {totalDays}</p>
              <p>Total Price: ₱{totalPrice.toFixed(2)}</p>
            </div>
          )}

          <button
            className="rental-btn"
            onClick={handleRental}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Book and Pay Now"}
          </button>

          {message && <p className="rental-message">{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default Rental;