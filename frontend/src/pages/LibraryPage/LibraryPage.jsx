import { useContext, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import apiClient from "../../utils/apiClient.js";
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

const fetchOwnedGames = async () => {
  const res = await apiClient.post(`/users/ownedgames`, {});
  return res.data.ownedGames;
};

const refreshOwnedGames = async () => {
  await apiClient.post(`/refresh/refreshOwnedGames`, {});
};

function LibraryPage() {
  const { user } = useContext(AuthContext);

  const [sortBy, setSortBy] = useState("progress");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: ownedGames,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["ownedGames", user?.id],
    queryFn: fetchOwnedGames,
    enabled: !!user,
    staleTime: 1000 * 60 * 5
  });

  const {
    mutate: refreshLibrary,
    isPending: refreshing
  } = useMutation({
    mutationFn: refreshOwnedGames,
    onSuccess: () => {
      refetch();
    }
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const renderCards = () => {
    if (!ownedGames) return null;

    let allGames = Object.entries(ownedGames).flatMap(([platform, games]) =>
      Object.entries(games).map(([gameId, game]) => ({
        platform,
        gameId,
        ...game
      }))
    );

    if (filterPlatform !== "all") {
      allGames = allGames.filter(game => game.platform === filterPlatform);
    }

    if (searchQuery.trim() !== "") {
      const fuse = new Fuse(allGames, {
        keys: ["gameName"],
        threshold: 0.4,
      });

      const results = fuse.search(searchQuery);
      allGames = results.map(r => r.item);
    }

    if (sortBy === "progress") 
    {
      allGames.sort((a, b) => b.progress - a.progress);
    } 
    else if (sortBy === "alphabet") 
    {
      allGames.sort((a, b) => a.gameName.localeCompare(b.gameName));
    } 
    else if (sortBy === "hoursPlayed") 
    {
      allGames.sort((a, b) => 
      {
        const parseTime = (str) => 
        {
          if (!str) return 0;
          const match = str.match(/(\d+)h\s*(\d+)m\s*(\d+)s/);
          if (!match) return 0;
          const [, h, m, s] = match.map(Number);
          return h * 3600 + m * 60 + s;
        };

        const secondsA = parseTime(a.hoursPlayed);
        const secondsB = parseTime(b.hoursPlayed);
        return secondsB - secondsA;
      });
    } else if (sortBy === "lastPlayed") {
      allGames.sort((a, b) => {
        const dateA = a.lastPlayed ? new Date(a.lastPlayed) : new Date(0);
        const dateB = b.lastPlayed ? new Date(b.lastPlayed) : new Date(0);
        return dateB - dateA;
      });
    }

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

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.body}>
        <Aside />
        <main className={styles.main}>
          <div className={styles.filterPanel}>
            <div className={styles.searchRow}>
              <SearchBar
                placeholder="Search for a game..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

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
            <button
              className={styles.refreshButton}
              onClick={() => refreshLibrary()}
              disabled={refreshing}
            >
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
