import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const GamePage = () => 
{
    const {gameName } = useParams(); 
    const [gameData, setGameData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchGame() 
        {
            try 
            {
                const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
                const response = await axios.get(`${BACKEND_URL}/games/${gameName}`);
                setGameData(response.data);
            } 
            catch (err) 
            {
                setError(err.response?.data?.error || "Failed to fetch game");
            } 
            finally 
            {
                setLoading(false);
            }
            }
        fetchGame();
    }, [gameName]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
        <h1>{gameName}</h1>
        <pre>{JSON.stringify(gameData, null, 2)}</pre>
        </div>
    );
}

export default GamePage;