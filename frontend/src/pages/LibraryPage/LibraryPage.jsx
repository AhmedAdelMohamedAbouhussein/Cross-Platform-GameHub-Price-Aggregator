import { useContext, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "../../utils/apiClient.js";
import { FaSyncAlt, FaBars } from "react-icons/fa";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Aside from "../../components/Aside/Aside";
import Card from "../../components/Card/Card";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";
import SearchBar from "../../components/SearchBar/SearchBar";
import Dropdown from "../../components/DropDownLists/DropDownLists";

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
  const [mobileAsideOpen, setMobileAsideOpen] = useState(false);

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
      toast.success("Library refreshed successfully!");
      refetch();
    },
    onError: () => {
      toast.error("Failed to refresh library");
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

    if (sortBy === "progress") {
      allGames.sort((a, b) => b.progress - a.progress);
    }
    else if (sortBy === "alphabet") {
      allGames.sort((a, b) => a.gameName.localeCompare(b.gameName));
    }
    else if (sortBy === "hoursPlayed") {
      allGames.sort((a, b) => {
        const parseTime = (str) => {
          if (!str) return 0;
          const match = str.match(/(\d+)h\s*(\d+)m\s*(\d+)s/);
          if (!match) return 0;
          const [, h, m, s] = match.map(Number);
          return h * 3600 + m * 60 + s;
        };
        return parseTime(b.hoursPlayed) - parseTime(a.hoursPlayed);
      });
    } else if (sortBy === "lastPlayed") {
      allGames.sort((a, b) => {
        const dateA = a.lastPlayed ? new Date(a.lastPlayed) : new Date(0);
        const dateB = b.lastPlayed ? new Date(b.lastPlayed) : new Date(0);
        return dateB - dateA;
      });
    }

    if (allGames.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-text-muted">
          <span className="text-5xl mb-4">🎮</span>
          <p className="text-lg">No games found</p>
          <p className="text-sm mt-1">Try adjusting your filters or sync a platform</p>
        </div>
      );
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
    <div className="page-container">
      <Header />
      <div className="flex-1 flex">
        {/* Desktop sidebar */}
        <Aside />
        {/* Mobile sidebar drawer */}
        <Aside isOpen={mobileAsideOpen} onClose={() => setMobileAsideOpen(false)} />

        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Top bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileAsideOpen(true)}
                  className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-midnight-600 transition-colors"
                >
                  <FaBars size={18} />
                </button>
                <h1 className="text-2xl font-bold text-text-primary">My Library</h1>
              </div>

              <button
                className="btn-secondary inline-flex items-center gap-2 text-sm"
                onClick={() => refreshLibrary()}
                disabled={refreshing}
              >
                <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Refreshing..." : "Refresh Library"}
              </button>
            </div>

            {/* Filters */}
            <div className="card-surface p-4 space-y-4">
              <SearchBar
                placeholder="Search for a game..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <div className="flex flex-wrap gap-4">
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

            {/* Game Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {renderCards()}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default LibraryPage;
