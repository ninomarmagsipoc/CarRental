import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../Css/rental.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Importante ni para sa design sa calendar
import { format, parseISO, subDays, addDays, eachDayOfInterval } from "date-fns"; // Para sa pag-format sa YYYY-MM-DD

function Rental({ isLoggedIn }) {
  const { carName } = useParams();
  const navigate = useNavigate();

  const getPhToday = () => {
    const phTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const year = phTime.getFullYear();
    const month = String(phTime.getMonth() + 1).padStart(2, "0");
    const day = String(phTime.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const today = getPhToday();

  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);

  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  // 🟢 GI-ADD: State para sa Driver's License
  const [driverLicense, setDriverLicense] = useState(null);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState("");

  const [totalDays, setTotalDays] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState(null);
  const [errors, setErrors] = useState({});

  // PSGC API STATES
  const [cebuPlaces, setCebuPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);

  // State para sa mga dates nga naka-book na (dili ma-click)
  const [bookedDates, setBookedDates] = useState([]);
  const [statusCode, setStatusCode] = useState(null); // Idugang ni
  // Example: Pagkuha sa mga Booked Dates gikan sa Backend inig load sa selectedCar

  useEffect(() => {
    const fetchBookedDates = async () => {
      // Siguraduhin na may napiling sasakyan bago mag-fetch
      if (selectedCar && selectedCar.carID) {
        try {
          // PALITAN ANG URL KUNG IBA ANG PORT NG IYONG C# BACKEND
          const response = await fetch(`https://localhost:7263/api/rental/car/${selectedCar.carID}/booked-dates`);

          if (response.ok) {
            const existingBookings = await response.json();
            let allBlockedDates = [];

            existingBookings.forEach(booking => {
              // Kunin ang tunay na StartDate at EndDate mula sa database
              const start = parseISO(booking.startDate);
              const end = parseISO(booking.endDate);

              // I-apply ang 3 days buffer (Allowance sa maintenance)
              const startWithBuffer = subDays(start, 3);
              const endWithBuffer = addDays(end, 3);

              // Kunin ang lahat ng araw sa pagitan ng Start at End (kasama buffer)
              const datesInRange = eachDayOfInterval({
                start: startWithBuffer,
                end: endWithBuffer
              });

              allBlockedDates = [...allBlockedDates, ...datesInRange];
            });

            // I-set ang totoong blocked dates sa state ng kalendaryo
            setBookedDates(allBlockedDates);
          }
        } catch (error) {
          console.error("Error fetching booked dates:", error);
        }
      }
    };

    fetchBookedDates();
  }, [selectedCar]); // Mag-re-run ito tuwing magpapalit ng sasakyan

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
    fetchCebuPlaces();
  }, []);

  const fetchCebuPlaces = async () => {
    try {
      const response = await fetch('https://psgc.gitlab.io/api/provinces/072200000/cities-municipalities.json');
      const data = await response.json();
      const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
      setCebuPlaces(sortedData);
    } catch (error) {
      console.error("Error fetching Cebu places:", error);
    } finally {
      setLoadingPlaces(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate && selectedCar) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      let days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      if (days <= 0) days = 1;
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

  const validateForm = () => {
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = "Full Name is required.";
    else if (fullName.length > 50) newErrors.fullName = "Full Name cannot exceed 50 characters.";
    else if (/\d/.test(fullName)) newErrors.fullName = "Full Name cannot contain numbers.";

    if (!contactNumber.trim()) newErrors.contactNumber = "Contact Number is required.";
    else if (!/^09\d{9}$/.test(contactNumber)) newErrors.contactNumber = "Must start with '09' and be exactly 11 digits.";

    if (!pickupLocation.trim()) newErrors.pickupLocation = "Pickup Location is required.";
    if (!driverLicense) newErrors.driverLicense = "Driver's License is required."; // 🟢 License Validation
    if (!endDate) newErrors.endDate = "End Date is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRental = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }

    // I-reset ang message ug status code kada click
    setMessage("");
    setStatusCode(null);

    if (!validateForm()) return;

    const userId = localStorage.getItem("userId");
    setIsProcessing(true);

    // Default to 200 aron black ang loading text
    setStatusCode(200);
    setMessage("Creating your booking...");

    try {
      const formData = new FormData();
      formData.append("userID", parseInt(userId));
      formData.append("carID", selectedCar.carID);
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("totalPrice", totalPrice);
      formData.append("fullName", fullName.trim());
      formData.append("contactNumber", contactNumber.trim());
      formData.append("pickupLocation", pickupLocation.trim());
      formData.append("driverLicense", driverLicense);

      const rentalRes = await fetch("https://localhost:7263/api/rental/create", {
        method: "POST",
        body: formData,
      });

      const rentalData = await rentalRes.json();
      const rentalId = rentalData.rentalID || rentalData.data?.rentalID || rentalData.Data?.rentalID;

      // 🟢 KUHAON NATO ANG STATUS CODE GIKAN SA C# (200 o 400)
      const currentStatus = rentalData.statusCode || rentalRes.status;
      setStatusCode(currentStatus);

      // KUNG WALAY ID O DILI 200 ANG STATUS (Sama sa Maintenance error)
      if (!rentalId || currentStatus !== 200) {
        setMessage(rentalData.message || "Failed to create rental.");
        setIsProcessing(false);
        return; // Mo-stop na siya dinhi, ug RED ang mogawas sa screen
      }

      // KUNG 200 SUCCESS:
      setMessage("Booking secured! Redirecting to PayMongo...");

      const paymentRes = await fetch("https://localhost:7263/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentalID: rentalId,
          userID: parseInt(userId),
          paymentMethod: "PayMongo",
          successUrl: `${window.location.origin}/`,
          cancelUrl: `${window.location.origin}/`
        }),
      });

      const paymentData = await paymentRes.json();
      if (paymentRes.ok && paymentData.data?.checkoutUrl) {
        localStorage.setItem("payMongoRef", paymentData.data.reference);
        window.location.href = paymentData.data.checkoutUrl;
      } else {
        setStatusCode(400); // I-set og red kung nag-error ang PayMongo
        setMessage("Booking saved, but failed to generate payment link.");
      }
    } catch (err) {
      console.error(err);
      setStatusCode(500); // I-set og red kung nag-crash ang server
      setMessage("Server error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Kini mag-check kung ang adlaw nga gipakita sa calendar kay under maintenance ba
  const isDateAllowed = (date) => {
    if (selectedCar && selectedCar.maintenanceMonth) {
      // I-convert ang petsa sa calendar ngadto sa "Month Year" (e.g. "October 2026")
      const calendarMonthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toLowerCase();
      const maintMonth = selectedCar.maintenanceMonth.trim().toLowerCase();

      // Kung mag-match ang buwan sa calendar ug ang maintenance month, i-disable
      if (maintMonth === calendarMonthYear) {
        return false; // Dili pwede ma-click
      }
    }
    return true; // Available, pwede ma-click
  };

  if (!selectedCar) {
    return <p style={{ textAlign: "center", marginTop: "50px", fontWeight: "bold" }}>Car not found 😢</p>;
  }

  return (
    <div className="rental-page">
      <h1 className="rental-title">Rent {selectedCar.carName}</h1>
      <div className="rental-card">

        {/* 🟢 LEFT SIDE: Info & Agreement */}
        <div className="rental-left">
          <div className="rental-image">
            <img src={`https://localhost:7263/${selectedCar.carImage}`} alt={selectedCar.carName} />
          </div>

          <div className="car-details">
            {selectedCar.carInfo && <p className="car-desc">{selectedCar.carInfo}</p>}
            <p><strong>Seats:</strong> {selectedCar.seats}</p>
            <p><strong>Price per day:</strong> ₱{selectedCar.pricePerDay}</p>
          </div>

          {/* 🟢 BAG-O: AGREEMENT / DESCRIPTION (Limpyo na, way inline styles) */}
          <div className="agreement-box">
            <h3>Rental Agreement & Terms</h3>
            <p><strong>Description:</strong> Well-maintained vehicle, fully air-conditioned, and comes with a full tank upon pick-up.</p>
            <ul>
              <li>A valid Driver's License must be uploaded before booking.</li>
              <li>Late returns will automatically incur penalty charges.</li>
              <li>Vehicle must be returned in the exact condition it was picked up.</li>
              <li>The renter assumes full liability for damages during the rental period.</li>
            </ul>
          </div>
        </div>

        {/* 🟢 RIGHT SIDE: Form */}
        <div className="rental-right">
          <div className="rental-form-group">

            <div>
              <label>Full Name</label>
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
            </div>

            <div>
              <label>Contact Number</label>
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
            </div>

            <div>
              <label>Pickup Location (Cebu)</label>
              <select
                value={pickupLocation}
                onChange={e => {
                  setPickupLocation(e.target.value);
                  if (errors.pickupLocation) setErrors({ ...errors, pickupLocation: null });
                }}
                className={errors.pickupLocation ? "input-error" : ""}
                disabled={loadingPlaces}
              >
                <option value="">{loadingPlaces ? "Loading Locations..." : "-- Select City/Municipality --"}</option>
                {cebuPlaces.map((place) => (
                  <option key={place.code} value={place.name}>{place.name}</option>
                ))}
              </select>
              {errors.pickupLocation && <span className="error-text">{errors.pickupLocation}</span>}
            </div>

            <div>
              <label>Upload Driver's License</label>
              <input
                type="file"
                accept="image/jpeg, image/png, application/pdf"
                onChange={(e) => {
                  setDriverLicense(e.target.files[0]);
                  if (errors.driverLicense) setErrors({ ...errors, driverLicense: null });
                }}
                className={errors.driverLicense ? "input-error" : ""}
              />
              {errors.driverLicense && <span className="error-text">{errors.driverLicense}</span>}
            </div>
          </div>

          <div className="rental-dates">
            <div>
              <label>Start Date</label>
              <DatePicker
                selected={startDate ? parseISO(startDate) : null}
                onChange={(date) => {
                  const formattedDate = format(date, "yyyy-MM-dd");
                  setStartDate(formattedDate);
                  if (endDate && formattedDate > endDate) setEndDate("");
                }}
                minDate={new Date()}
                excludeDates={bookedDates}
                filterDate={isDateAllowed}
                dayClassName={(date) =>
                  bookedDates.some((bookedDate) =>
                    bookedDate.getDate() === date.getDate() &&
                    bookedDate.getMonth() === date.getMonth() &&
                    bookedDate.getFullYear() === date.getFullYear()
                  ) ? "rented-green-date" : undefined
                }
                dateFormat="MMMM d, yyyy"
                className="calendar-input"
                placeholderText="Select start date"
              />
            </div>

            <div>
              <label>End Date</label>
              <DatePicker
                selected={endDate ? parseISO(endDate) : null}
                onChange={(date) => {
                  const formattedDate = format(date, "yyyy-MM-dd");
                  setEndDate(formattedDate);
                  if (errors.endDate) setErrors({ ...errors, endDate: null });
                }}
                minDate={startDate ? parseISO(startDate) : new Date()}
                excludeDates={bookedDates}
                dayClassName={(date) =>
                  bookedDates.some((bookedDate) =>
                    bookedDate.getDate() === date.getDate() &&
                    bookedDate.getMonth() === date.getMonth() &&
                    bookedDate.getFullYear() === date.getFullYear()
                  ) ? "rented-green-date" : undefined
                }
                dateFormat="MMMM d, yyyy"
                className={`calendar-input ${errors.endDate ? "input-error" : ""}`}
                placeholderText="Select end date"
              />
              {errors.endDate && <span className="error-text">{errors.endDate}</span>}
            </div>
          </div>

          {totalDays > 0 && !errors.endDate && (
            <div className="rental-total">
              <p>Total Days: {totalDays}</p>
              <p>Total Price: ₱{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          )}

          <button className="rental-btn" onClick={handleRental} disabled={isProcessing}>
            {isProcessing ? "Processing..." : "Book and Pay Now"}
          </button>

          {message && (
            <p
              className="rental-message"
              style={{ color: statusCode === 200 ? 'black' : 'red' }}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Rental;