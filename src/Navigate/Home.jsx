import { useNavigate } from 'react-router-dom';
import '../Css/home.css'
import { useState } from 'react';
function Home() {

    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();

        // example: redirect to cars page with search query
        navigate(`/car?search=${search}`);
    }

    return (
        <>
            <div className='body1'>
                <div className='container'>
                    <h1 className='h1'>Rent Your Dream Car Today!</h1>
                    <p>Fast, reliable, and affordable car rentals in your area.</p>
                    <button onClick={() => navigate("/car")} className='button'>
                        Browse Cars
                    </button>
                </div>
            </div>
            <div className="body2">

            </div>
        </>
    )
}

export default Home