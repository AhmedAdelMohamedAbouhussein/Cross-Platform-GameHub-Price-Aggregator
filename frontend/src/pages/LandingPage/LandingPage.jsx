import { useState, useEffect, useRef } from "react";
import styles from "./LandingPage.module.css";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen.jsx";

function LandingPage() 
{
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true); // <-- loading state

  // ✅ Fetch top-selling games on mount
  useEffect(() => 
  {
    async function getTopSellers() 
    {
      setLoading(true); // start loading
      try 
      {
        const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
        const response = await axios.get(`${BACKEND_URL}/games/landingpage`);
        setGames(response.data);
      } 
      catch (error) 
      {
        console.error('Error fetching top sellers:', error.message);
      } 
      finally 
      {
        setLoading(false); // end loading
      }
    }

    getTopSellers();
  }, []);

  //  Auto-scroll logic
  useEffect(() => 
  {
    const container = scrollRef.current;
    let scrollSpeed = 1; // px per interval (slower than before)

    const scrollInterval = setInterval(() => 
    {
      if (!container) return;
      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 1) 
        {
        container.scrollLeft = 0; // Loop to start
      }
      else 
      {
        container.scrollLeft += scrollSpeed;
      }
    }, 30); // Slower refresh rate (30ms)

    return () => clearInterval(scrollInterval); // Cleanup
  }, []);

  if (loading) 
  {
    return <LoadingScreen/>
  }

  return (
    <>
      <Header />

      <div className={styles.landingContainer}>
        <div className={styles.GameImageContainer} ref={scrollRef}>
          {games.map(([src, redirect], index) => (
            <img key={index} className={styles.gameImage} src={src} alt={`Top selling game ${index + 1}`} loading="lazy" onClick={() => {navigate(`/games/${redirect}`)}} />
            ))
          }
        </div>

        <div className={styles.contentContainer}>
          <h1 className={styles.title}>Welcome to My GameHub</h1>
          <p className={styles.subtitle}>Manage your games and explore their features</p>

          <div className={styles.cardContainer}>
            <div className={styles.card} onClick={() => navigate("/library")}>
              <div className={styles.cardIcon}>📚</div>
              <h2>My GameHub</h2>
              <p>View and manage your owned games in a personalized hub</p>
            </div>

            <div className={styles.card} onClick={() => navigate("/games")}>
              <div className={styles.cardIcon}>🎮</div>
              <h2>Browse Game</h2>
              <p>Browse games across platforms and compare prices</p>
            </div>
          </div>
        </div>

      </div>
      <Footer />
    </>
  );
}

export default LandingPage;
