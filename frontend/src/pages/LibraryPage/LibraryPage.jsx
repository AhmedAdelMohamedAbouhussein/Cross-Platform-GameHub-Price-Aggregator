import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { FaSyncAlt } from "react-icons/fa";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Aside from "../../components/Aside/Aside";
import Card from "../../components/Card/Card";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";
import SearchBar from "../../components/SearchBar/SearchBar";
import Dropdown from "../../components/DropDownLists/DropDownLists";

import styles from "./LibraryPage.module.css";

import AuthContext from "../../contexts/AuthContext";
import Fuse from "fuse.js";

function LibraryPage() {
  const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
  const { user } = useContext(AuthContext);
  const [ownedGames, setOwnedGames] = useState(null);
  const [loading, setLoading] = useState(true); // start as loading
  const [refreshing, setRefreshing] = useState(false);

  const [sortBy, setSortBy] = useState("progress"); // "progress" | "alphabet" | "platform"
  const [filterPlatform, setFilterPlatform] = useState("all"); // "all" or specific platform
  const [searchQuery, setSearchQuery] = useState("");


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

  // Convert nested object → single list
  let allGames = Object.entries(ownedGames).flatMap(([platform, games]) =>
    Object.entries(games).map(([gameId, game]) => ({
      platform,
      gameId,
      ...game
    }))
  );

  // Filter by platform
  if (filterPlatform !== "all") {
    allGames = allGames.filter(game => game.platform === filterPlatform);
  }

  // Fuzzy search
  if (searchQuery.trim() !== "") {
    const fuse = new Fuse(allGames, {
      keys: ["gameName"],   // field(s) to search
      threshold: 0.4,       // smaller = stricter, bigger = fuzzier
    });

    const results = fuse.search(searchQuery);
    allGames = results.map(r => r.item);
  }

  // Sorting
  if (sortBy === "progress") {
    allGames.sort((a, b) => b.progress - a.progress);
  } else if (sortBy === "alphabet") {
    allGames.sort((a, b) => a.gameName.localeCompare(b.gameName));
  } else if (sortBy === "hoursPlayed") {
    allGames.sort((a, b) => {
      const parseTime = (str) => {
        if (!str) return 0;
        const match = str.match(/(\d+)h\s*(\d+)m\s*(\d+)s/);
        if (!match) return 0;
        const [, h, m, s] = match.map(Number);
        return h * 3600 + m * 60 + s; // total seconds
      };
    
      const secondsA = parseTime(a.hoursPlayed);
      const secondsB = parseTime(b.hoursPlayed);
      return secondsB - secondsA; // descending order
    });
  } else if (sortBy === "lastPlayed") {
    allGames.sort((a, b) => {
      const dateA = a.lastPlayed ? new Date(a.lastPlayed) : new Date(0); // null = oldest
      const dateB = b.lastPlayed ? new Date(b.lastPlayed) : new Date(0);
      return dateB - dateA; // descending order
    });
  }

  // Render
  return allGames.map(game => (
    <Card
      key={`${game.platform}-${game.gameId}`}
      id={game.gameId}
      platform={game.platform}
      image={game.coverImage}
      title={game.gameName}
      progress={game.progress}
      lastPlayed={game.lastPlayed}
      hoursPlayed={game.hoursPlayed}
    />
  ));
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
          <div className={styles.filterPanel}>
            {/* Row 1: Search bar */}
            <div className={styles.searchRow}>
              <SearchBar
                placeholder="Search for a game..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Row 2: Filters */}
            <div className={styles.filtersRow}>
              <Dropdown
                label="Sort by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: "alphabet", label: "Alphabetical" },
                  { value: "progress", label: "Progress" },
                  { value: "hoursPlayed", label: "Hours Played" },
                  { value: "lastPlayed", label: "Last Played" }
                ]}
              />
              <Dropdown
                label="Platform"
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                options={[
                  { value: "all", label: "All Platforms" },
                  { value: "steam", label: "Steam" },
                  { value: "epic", label: "Epic" },
                  { value: "xbox", label: "Xbox" },
                  { value: "PSN", label: "PlayStation" }
                ]}
              />
            </div>
          </div>
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
