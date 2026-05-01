import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import Footer from "./Header/Footer"
import Header from "./Header/Header"
import Login from "./Auth/Login"
import Home from "./Navigate/Home"
import About from "./Navigate/About"
import Car from "./Navigate/Car"
import Register from "./Auth/Register"
import Verify from "./Auth/verify"
import ForgotPass from "./Auth/ForgotPass"
import AdminDashboard from "./admin/adminDashboard"
import Rental from "./Book/booking"
import Profile from "./dropdown-menu/profile"
import ManageBooking from "./admin/manageBooking"
import AdminLayout from "./admin/AdminLayout"
import ManageCars from "./admin/manageCar"
import ManageCustomer from "./admin/manageCustomers"
import ManagePayment from "./admin/managePayment"
import ReportAnalytics from "./admin/reportAnalytics"
import Notification from "./dropdown-menu/notification"
import Favorite from "./dropdown-menu/favorites"
import MyRentalHistory from "./dropdown-menu/rent-history"
import NotificationAdmin from "./admin/notificationAmin"
import Archive from "./dropdown-menu/archive"

function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

function App() {

  const [isLoggedIn, setIsLogIn] = useState(!!localStorage.getItem("user") || !!localStorage.getItem("admin"));
  const location = useLocation();

  const hideHeader = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (!location.pathname.startsWith("/admin") && localStorage.getItem("admin")) {
      localStorage.removeItem("admin");

      setIsLogIn(!!localStorage.getItem("user"));
    }
  }, [location.pathname]);

  return (
    <>
      {!hideHeader && <Header isLoggedIn={isLoggedIn} setIsLogIn={setIsLogIn} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/car" element={<Car isLoggedIn={isLoggedIn} />} />
        <Route path="/login" element={<Login setIsLogIn={setIsLogIn} />} />
        <Route path="/booking/:carName" element={<Rental isLoggedIn={isLoggedIn} />}></Route>
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />}></Route>
        <Route path="/forgot" element={<ForgotPass />}></Route>
        <Route path="/profile" element={<Profile />}></Route>
        <Route path="/notifications" element={<Notification />}></Route>
        <Route path="/favorites" element={<Favorite isLoggedIn={isLoggedIn} />}></Route>
        <Route path="/my-rentals" element={<MyRentalHistory />} />
        <Route path="/archive" element={<Archive />} />


        <Route path="/admin" element={<AdminLayout setIsLogIn={setIsLogIn} />}>
          <Route index element={<AdminDashboard />} />
          <Route path="manage-booking" element={<ManageBooking />} />
          <Route path="manage-car" element={<ManageCars />} />
          <Route path="customers" element={<ManageCustomer />} />
          <Route path="manage-payment" element={<ManagePayment />} />
          <Route path="notifications" element={<NotificationAdmin />} />
        </Route>
      </Routes>

      {!hideHeader && <Footer />}
    </>

  )
}

export default App
