import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useState } from "react"
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

function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

function App() {

  const [isLoggedIn, setIsLogIn] = useState(false);
  const location = useLocation();

  const hideHeader = location.pathname.startsWith("/admin");

  return (
    <>
      {!hideHeader && <Header isLoggedIn={isLoggedIn} setIsLogIn={setIsLogIn} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/car" element={isLoggedIn ? <Car /> : <Navigate to="/login" />} />
        <Route path="/login" element={<Login setIsLogIn={setIsLogIn} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />}></Route>
        <Route path="/forgot" element={<ForgotPass />}></Route>
        <Route path="/admin" element={<AdminDashboard />}></Route>
      </Routes>

      {!hideHeader &&<Footer />}
    </>

  )
}

export default App
