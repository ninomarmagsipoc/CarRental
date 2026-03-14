import { Link, useNavigate } from 'react-router-dom';

function Header({ setIsLogIn }){

    const navigate = useNavigate();

    const HandleLogout = () => {
        setIsLogIn(false);
        navigate("/");
    }

    return(
        <header>
            <h1>My website</h1>
            <nav>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/about">About Us</Link></li>
                    <li><Link to="/Car">Cars</Link></li>
                    <li><button onClick={HandleLogout}>Log out</button></li>
                </ul>
            </nav>
            <hr />
        </header>
    );
}

export default Header