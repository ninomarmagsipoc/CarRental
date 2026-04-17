import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../Css/rental.css";

function Rental({ isLoggedIn }) {
  const { carName } = useParams();
  const navigate = useNavigate();

 // Function aron makuha ang sakto nga YYYY-MM-DD format base sa Philippine Time
  const getPhToday = () => {
    const phTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const year = phTime.getFullYear();
    const month = String(phTime.getMonth() + 1).padStart(2, "0");
    const day = String(phTime.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const today = getPhToday(); // Kani na ang imong gamiton

  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);

  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState("");

  const [totalDays, setTotalDays] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState(null);

  // NEW: State to hold individual field errors
  const [errors, setErrors] = useState({});

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
      let days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      // I-apply ang Minimum 1 Day logic parehas sa backend
      if (days <= 0) {
        days = 1;
      }
      
      setTotalDays(days);
      setTotalPrice(days * selectedCar.pricePerDay);
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

  // NEW: Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full Name is required.";
    } else if (fullName.length > 50) {
      newErrors.fullName = "Full Name cannot exceed 50 characters.";
    } else if (/\d/.test(fullName)) {
      newErrors.fullName = "Full Name cannot contain numbers.";
    }

    if (!contactNumber.trim()) {
      newErrors.contactNumber = "Contact Number is required.";
    } else if (!/^09\d{9}$/.test(contactNumber)) {
      newErrors.contactNumber = "Must start with '09' and be exactly 11 digits.";
    }

    if (!pickupLocation.trim()) {
      newErrors.pickupLocation = "Pickup Location is required.";
    }

    if (!endDate) {
      newErrors.endDate = "End Date is required.";
    }

    setErrors(newErrors);
    // Returns true if there are no errors
    return Object.keys(newErrors).length === 0;
  };

  const handleRental = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }

    setMessage(""); // Clear global message

    // Run validations before proceeding
    if (!validateForm()) {
      return;
    }

    const userId = localStorage.getItem("userId");
    setIsProcessing(true);
    setMessage("Creating your booking...");

    try {
      const rentalRes = await fetch("https://localhost:7263/api/rental/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userID: parseInt(userId),
          carID: selectedCar.carID,
          startDate: startDate,
          endDate: endDate,
          totalPrice: totalPrice,
          fullName: fullName.trim(),
          contactNumber: contactNumber.trim(),
          pickupLocation: pickupLocation.trim()
        }),
      });

      const rentalData = await rentalRes.json();
      const rentalId = rentalData.rentalID || rentalData.data?.rentalID || rentalData.Data?.rentalID;

      if (!rentalId) {
        setMessage(rentalData.message || "Failed to create rental. No ID returned.");
        setIsProcessing(false);
        return;
      }

      setMessage("Booking secured! Redirecting to PayMongo...");

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

      if (paymentRes.ok && paymentData.data?.checkoutUrl) {
        localStorage.setItem("payMongoRef", paymentData.data.reference);
        window.location.href = paymentData.data.checkoutUrl;
      } else {
        setMessage("Booking saved, but failed to generate payment link.");
      }

    } catch (err) {
      console.error(err);
      setMessage("Server error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedCar) {
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Car not found 😢</p>;
  }

  return (
    <div className="rental-page">
      <h1 className="rental-title">🚗 Rent {selectedCar.carName}</h1>

      <div className="rental-card">

        {/* --- LEFT SIDE: Image and Car Info --- */}
        <div className="rental-left">
          <div className="rental-image">
            <img
              src={`https://localhost:7263/images/${selectedCar.carImage}`}
              alt={selectedCar.carName}
            />
          </div>
          <div className="car-details">
            {selectedCar.carInfo && <p className="car-desc">{selectedCar.carInfo}</p>}
            <p><strong>Seats:</strong> {selectedCar.seats}</p>
            <p><strong>Price per day:</strong> ₱{selectedCar.pricePerDay}</p>
          </div>
        </div>

        {/* --- RIGHT SIDE: Booking Form --- */}
        <div className="rental-right">
          <div className="rental-form-group">
            <label>Full Name:</label>
            <input
              type="text"
              placeholder="e.g. Juan Dela Cruz"
              maxLength={50}
              value={fullName}
              onChange={e => {
                const val = e.target.value.replace(/[0-9]/g, "");
                setFullName(val);
                if (errors.fullName) setErrors({ ...errors, fullName: null });
              }}
              className={errors.fullName ? "input-error" : ""}
            />
            {errors.fullName && <span className="error-text">{errors.fullName}</span>}
            <br />

            <label>Contact Number:</label>
            <input
              type="tel"
              placeholder="09XXXXXXXXX"
              maxLength={11}
              value={contactNumber}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, "");
                setContactNumber(val);
                if (errors.contactNumber) setErrors({ ...errors, contactNumber: null });
              }}
              className={errors.contactNumber ? "input-error" : ""}
            />
            {errors.contactNumber && <span className="error-text">{errors.contactNumber}</span>}
            <br />
            <label>Pickup Location:</label>
            <input
              type="text"
              placeholder="e.g. Mactan Airport, Terminal 1"
              value={pickupLocation}
              onChange={e => {
                setPickupLocation(e.target.value);
                if (errors.pickupLocation) setErrors({ ...errors, pickupLocation: null });
              }}
              className={errors.pickupLocation ? "input-error" : ""}
            />
            {errors.pickupLocation && <span className="error-text">{errors.pickupLocation}</span>}
          </div>
          <div className="rental-dates">
            <label>Start Date:</label>
            <input
              type="date"
              min={today} 
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                if (endDate && e.target.value > endDate) {
                  setEndDate("");
                }
              }}
            />
            <br />
            
            <label>End Date:</label>
            <input
              type="date"
              min={startDate || today} 
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value);
                if (errors.endDate) setErrors({ ...errors, endDate: null });
              }}
              className={errors.endDate ? "input-error" : ""}
            />
            {errors.endDate && <span className="error-text">{errors.endDate}</span>}
          </div>

          {totalDays > 0 && !errors.endDate && (
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