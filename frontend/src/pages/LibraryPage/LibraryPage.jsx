import { useContext, useEffect, useState } from "react";
import axios from "axios";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Aside from "../../components/Aside/Aside";
import Card from "../../components/Card/Card";
import styles from "./LibraryPage.module.css";

import AuthContext from "../../contexts/AuthContext";

function LibraryPage() {
  const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
  const API_BASE = import.meta.env.MODE === "development" ? "" : BACKEND_URL;

  const { user } = useContext(AuthContext);
  const [ownedGames, setOwnedGames] = useState(null); // <-- state

  // Reset scroll + fetch on mount
  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchGames = async () => {
      try {
        const res = await axios.post(`${API_BASE}/api/users/ownedgames`, {
          userId: user._id,
        });
        setOwnedGames(res.data.ownedGames); // <-- update state
        console.log("Fetched owned games:", res.data.ownedGames);
      } catch (err) {
        console.error("Fetch failed:", err);
      }
    };

    if (user?._id) {
      fetchGames();
    }
  }, [user, API_BASE]);

  const renderCards = () => {
    if (!ownedGames) return <p>Loading games...</p>; // wait for fetch

    // Convert plain object -> Map
    const ownedGamesMap = new Map(Object.entries(ownedGames));

    return Array.from(ownedGamesMap.entries()).flatMap(([platform, gamesObj]) => {
      const gamesMap = new Map(Object.entries(gamesObj));

      // Sort by progress (highest first)
      const sortedGames = Array.from(gamesMap.entries()).sort(
        (a, b) => b[1].progress - a[1].progress
      );

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

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.body}>
        <Aside />
        <main className={styles.main}>
          <div className={styles.cardGrid}>{renderCards()}</div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default LibraryPage;
