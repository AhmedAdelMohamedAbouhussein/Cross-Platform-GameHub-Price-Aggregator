import React, { useState, useEffect, useRef } from "react";
import styles from "./LandingPage.module.css";
import Header from "../Header/Header.jsx";
import Footer from "../Footer/Footer.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function LandingPage() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [games, setGames] = useState([]);

// ✅ Fetch top-selling games on mount
  useEffect(() => 
  {
    async function getTopSellers() 
    {
      try 
      {
        const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
        const response = await axios.get(`${BACKEND_URL}/games/landingpage`);
        console.log(response.data);
        setGames(response.data);
        
      } 
      catch (error) 
      {
        console.error('Error fetching top sellers:', error.message);
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

  return (
    <>
      <Header />

      <div className={styles.landingContainer}>
        <div className={styles.GameImageContainer} ref={scrollRef}>
          {games.map(([src, redirect], index) => (
            <img key={index} className={styles.gameImage} src={src} alt={`Top selling game ${index + 1}`} loading="lazy" onClick={() => {navigate(redirect)}} />
            ))
          }
        </div>

        <div className={styles.contentContainer}>
          <h1 className={styles.title}>Welcome to My GameHub</h1>
          <p className={styles.subtitle}>Manage your games and explore their features</p>

          <div className={styles.buttonContainer}>
            <button className={styles.landingButtons} onClick={() => {navigate("/login");}}> Login </button>
            <button className={styles.landingButtons} onClick={() => {navigate("/signup");}}> Sign Up </button>
          </div>
        </div>
      </div>


      <Footer />
    </>
  );
}

export default LandingPage;
