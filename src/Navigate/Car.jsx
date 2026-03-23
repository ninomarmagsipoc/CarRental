import { useNavigate } from "react-router-dom"

function Car({ isLoggedIn }){
    const navigate = useNavigate();

    const hadleBook = () =>{
        if(!isLoggedIn){
            navigate("/login");
        }else{
            navigate("/car");
        }
    }
    return(
        <div className="body1">
            <h1>LIST OF CAR</h1>
        </div>
    )
}

export default Car