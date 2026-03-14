import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login({ setIsLogIn }) {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {

    if(email === "admin@gmail.com" && password === "1234"){
      setIsLogIn(true);
      navigate("/", {replace: true});
    } else {
      alert("Invalid login");
    }

  }

  return(
    <div>
      <h2>Login</h2>

      <input
        type="email"
        placeholder="Email"
        onChange={(e)=>setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e)=>setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>

    </div>
  )
}

export default Login;