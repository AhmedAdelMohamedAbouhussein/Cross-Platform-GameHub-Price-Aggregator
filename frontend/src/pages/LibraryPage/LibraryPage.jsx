import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { FaSyncAlt } from "react-icons/fa";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Aside from "../../components/Aside/Aside";
import Card from "../../components/Card/Card";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";
import styles from "./LibraryPage.module.css";

import AuthContext from "../../contexts/AuthContext";

function LibraryPage() {
  const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
  const { user } = useContext(AuthContext);
  const [ownedGames, setOwnedGames] = useState(null);
  const [loading, setLoading] = useState(true); // start as loading
  const [refreshing, setRefreshing] = useState(false);

  // Fetch owned games
  const fetchGames = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/users/ownedgames`, {}, { withCredentials: true });
      setOwnedGames(res.data.ownedGames);
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reset scroll + fetch on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    if (user) {
      fetchGames();
    }
  }, [user]);

  const refreshPage = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await axios.post(`${BACKEND_URL}/refresh/refreshOwnedGames`, {}, { withCredentials: true });
      await fetchGames(); // re-fetch updated games
    } catch (err) {
      console.error("Failed to refresh games:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const renderCards = () => {
    if (!ownedGames) return null;

    // Convert plain object -> Map
    const ownedGamesMap = new Map(Object.entries(ownedGames));

    return Array.from(ownedGamesMap.entries()).flatMap(([platform, gamesObj]) => {
      const gamesMap = new Map(Object.entries(gamesObj));

      // Sort by progress (highest first)
      const sortedGames = Array.from(gamesMap.entries()).sort((a, b) => b[1].progress - a[1].progress);

      return sortedGames.map(([gameId, game]) => (
        <Card
          key={`${platform}-${gameId}`}
          id={gameId}
          platform={platform}
          image={game.coverImage}
          title={game.gameName}
          progress={game.progress}
          lastPlayed={game.lastPlayed}
          hoursPlayed={game.hoursPlayed}
        />
      ));
    });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.body}>
        <Aside />
        <main className={styles.main}>
          <div className={styles.toppanel}> 
            <button className={styles.refreshButton} onClick={refreshPage} disabled={refreshing}>
              <FaSyncAlt className={refreshing ? styles.spin : ""} /> 
              {refreshing ? " Refreshing..." : " Refresh Library"}
            </button>
          </div>
          <div className={styles.cardGrid}>{renderCards()}</div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default LibraryPage;
