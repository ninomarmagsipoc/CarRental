import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useState } from "react"
import Footer from "./Header/Footer"
import Header from "./Header/Header"
import Login from "./Auth/Login"
import Home from "./Navigate/Home"
import About from "./Navigate/About"
import Car from "./Navigate/Car"
import Register from "./Auth/Register"

function App() { 

  const [isLoggedIn, setIsLogIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return(
   <>
    <Header isLoggedIn={isLoggedIn} setIsLogIn={setIsLogIn}/>
    <Routes>
     <Route path="/" element={<Home />} />
     <Route path="/about" element={<About />} />
     <Route path="/car" element={ isLoggedIn ? <Car/> : <Navigate to="/login"/>} />
     <Route path="/login" element={<Login setIsLogIn={setIsLogIn}/>}/>
     <Route path="/register" element={<Register />}/>
    </Routes>

    <Footer />
    </>
   
  )
}

export default App
