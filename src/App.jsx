import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useState } from "react"
import Footer from "./Footer"
import Header from "./header"
import Login from "./Login"
import Home from "./Home"
import About from "./About"
import Car from "./Car"

function App() {

  const [isLoggedIn, setIsLogIn] = useState(false);

  if(!isLoggedIn){
    return <Login setIsLogIn={setIsLogIn} />
  }

  return(
   <>
        <Header setIsLogIn={setIsLogIn} />
    <Routes>
     <Route path="/" element={<Home />} />
     <Route path="/about" element={<About />} />
     <Route path="/car" element={<Car />} />
    </Routes>

    <Footer />
   </>
  )
}

export default App
