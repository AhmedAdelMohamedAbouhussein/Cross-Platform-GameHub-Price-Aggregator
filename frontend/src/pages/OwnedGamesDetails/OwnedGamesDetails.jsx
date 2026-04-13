import { useContext, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaLock, FaUnlock } from "react-icons/fa";
import apiClient from "../../utils/apiClient.js";

import AuthContext from "../../contexts/AuthContext";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";

import bronzeIcon from "../../assets/bronze.png";
import silverIcon from "../../assets/silver.png";
import goldIcon from "../../assets/gold.png";
import platinumIcon from "../../assets/plat.png";

function getAchievementIcon(ach) {
  const iconSize = 45;

  switch (ach.type) {
    case "bronze":
      return <img src={bronzeIcon} alt="Bronze" width={iconSize + 5} height={iconSize + 20} />;
    case "silver":
      return <img src={silverIcon} alt="Silver" width={iconSize + 5} height={iconSize + 20} />;
    case "gold":
      return <img src={goldIcon} alt="Gold" width={iconSize + 5} height={iconSize + 20} />;
    case "platinum":
      return <img src={platinumIcon} alt="Platinum" width={iconSize + 5} height={iconSize + 20} />;
    default:
      break;
  }

  if (ach.unlocked) {
    return <FaUnlock color="#10b981" size={iconSize} />;
  } else {
    return <FaLock color="#ef4444" size={iconSize} />;
  }
}

const fetchOwnedGameDetails = async (platform, id) => {
  const res = await apiClient.post(`/users/ownedgames/${platform}/${id}`, {});
  return res.data.game;
};

function OwnedGamesDetails() {
  const [searchParams] = useSearchParams();
  const platform = searchParams.get("platform");
  const id = searchParams.get("id");

  const { user } = useContext(AuthContext);

  const {
    data: game,
    isLoading
  } = useQuery({
    queryKey: ["ownedGame", platform, id, user?.id],
    queryFn: () => fetchOwnedGameDetails(platform, id),
    enabled: !!user && !!platform && !!id,
    staleTime: 1000 * 60 * 5
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function formatDate(dateUnlocked) {
    const date = new Date(dateUnlocked);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
    return null;
  }

  function renderAchievements() {
    if (!game?.achievements?.length) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-text-muted">
          <span className="text-4xl mb-3">🏆</span>
          <p>No achievements available for this game.</p>
        </div>
      );
    }

    return game.achievements.map((ach, index) => {
      let formattedDate = "Achievement still locked";
      if (ach.unlocked && ach.dateUnlocked) {
        formattedDate = formatDate(ach.dateUnlocked);
      }

      return (
        <div
          className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
            ach.unlocked
              ? 'bg-success/5 border border-success/20'
              : 'bg-danger/5 border border-danger/20'
          }`}
          key={index}
        >
          <div className="flex-shrink-0">
            {getAchievementIcon(ach)}
          </div>
          <div className="min-w-0 space-y-1">
            <h3 className="font-semibold text-sm text-warning truncate">{ach.title}</h3>
            <p className="text-xs text-text-secondary">{ach.description}</p>
            <p className="text-[11px] text-text-muted italic">
              {ach.unlocked ? `Unlocked: ${formattedDate}` : formattedDate}
            </p>
          </div>
        </div>
      );
    });
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!game) {
    return (
      <div className="page-container">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted text-lg">Game not found.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const lastPlayed = game.lastPlayed
    ? formatDate(game.lastPlayed)
    : "Game hasn't been played";

  const storeLinks = {
    steam: [
      { label: "Steam App", href: `steam://store/${id}`, onClick: true },
      { label: "Steam Web", href: `https://store.steampowered.com/app/${id}` },
    ],
    PSN: [
      { label: "PSN Store", href: `https://store.playstation.com/en-us/search/${encodeURIComponent(game.gameName)}` },
    ],
    xbox: [
      { label: "Xbox Store", href: `https://www.microsoft.com/en-us/p/${encodeURIComponent(game.gameName)}` },
    ],
    epic: [
      { label: "Epic Store", href: `https://www.epicgames.com/store/en-US/browse?q=${encodeURIComponent(game.gameName)}` },
    ],
  };

  return (
    <div className="page-container">
      <Header />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">

          {/* Hero card */}
          <div className="card-surface p-4 sm:p-6 lg:p-8 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-6 lg:gap-10">
              {/* Game image */}
              <div className="flex-shrink-0">
                <img
                  src={game.coverImage}
                  alt={game.gameName}
                  loading="lazy"
                  className="w-full md:w-56 lg:w-72 rounded-xl shadow-lg shadow-black/30 object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-text-primary">
                  {game.gameName}
                </h1>

                {/* Store links */}
                {storeLinks[platform] && (
                  <div className="flex flex-wrap gap-2">
                    {storeLinks[platform].map((link, i) => (
                      <a
                        key={i}
                        className="badge bg-accent/10 text-accent border border-accent/20 cursor-pointer hover:bg-accent/20 transition-colors"
                        href={link.onClick ? undefined : link.href}
                        onClick={link.onClick ? () => (window.location.href = link.href) : undefined}
                        target={link.onClick ? undefined : "_blank"}
                        rel="noopener noreferrer"
                      >
                        {link.label} ↗
                      </a>
                    ))}
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <p className="text-text-secondary">
                    Platform: <span className="font-semibold text-accent uppercase">{platform}</span>
                  </p>
                  <p className="text-text-secondary">
                    Total hours played: <span className="font-semibold text-accent">{game.hoursPlayed}</span>
                  </p>
                  <p className="text-text-secondary">
                    Last played: <span className="font-semibold text-accent">{lastPlayed}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="card-surface p-4 sm:p-6">
            <h2 className="section-title mb-6">🏆 Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderAchievements()}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}

export default OwnedGamesDetails;
