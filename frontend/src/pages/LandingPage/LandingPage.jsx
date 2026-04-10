import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import styles from "./LandingPage.module.css";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient.js";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen.jsx";

const fetchTopSellers = async () => {
  const response = await apiClient.get(`/games/landingpage`);
  return response.data;
};

function LandingPage() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const {
    data: games = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["landingGames"],
    queryFn: fetchTopSellers,
    staleTime: 1000 * 60 * 5,
    retry: 2
  });

  // Auto-scroll logic
  useEffect(() => {
    const container = scrollRef.current;
    let scrollSpeed = 1;

    const scrollInterval = setInterval(() => {
      if (!container) return;
      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 1) {
        container.scrollLeft = 0;
      }
      else {
        container.scrollLeft += scrollSpeed;
      }
    }, 20);

    return () => clearInterval(scrollInterval);
  }, [games]);

  if (isLoading) {
    return <LoadingScreen />
  }

  if (isError) {
    return (
      <>
        <Header />
        <div className={styles.landingContainer}>
          <p style={{ textAlign: "center" }}>
            {error?.message || "Failed to load games"}
          </p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <div className={styles.landingContainer}>
        <div className={styles.GameImageContainer} ref={scrollRef}>
          {games.map(([src, redirect], index) => (
            <img
              key={index}
              className={styles.gameImage}
              src={src}
              alt={`Top selling game ${index + 1}`}
              loading="lazy"
              onClick={() => { navigate(`/games/${redirect}`) }}
            />
          ))}
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
