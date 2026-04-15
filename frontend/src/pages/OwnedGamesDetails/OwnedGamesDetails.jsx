import { useContext, useEffect, useState } from "react";
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
  console.log(res);
  return res.data.game;
};

function OwnedGamesDetails() {
  const [searchParams] = useSearchParams();
  const platformQuery = searchParams.get("platform");
  const id = searchParams.get("id");

  const { user } = useContext(AuthContext);
  const [selectedOwnerId, setSelectedOwnerId] = useState(null);

  const {
    data: game,
    isLoading
  } = useQuery({
    queryKey: ["ownedGame", platformQuery, id, user?.id],
    queryFn: () => fetchOwnedGameDetails(platformQuery, id),
    enabled: !!user && !!platformQuery && !!id,
    staleTime: 1000 * 60 * 5
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Set default selected owner when game data loads
  useEffect(() => {
    if (game?.owners?.length && !selectedOwnerId) {
      setSelectedOwnerId(game.owners[0].accountId);
    }
  }, [game, selectedOwnerId]);

  const selectedOwner = game?.owners?.find(o => o.accountId === selectedOwnerId) || game?.owners?.[0];

  function formatDate(dateUnlocked) {
    if (!dateUnlocked) return null;
    const date = new Date(dateUnlocked);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
      });
    }
    return null;
  }

  function renderAchievements() {
    const list = selectedOwner?.achievements || [];

    if (!list.length) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-text-muted">
          <span className="text-4xl mb-3">🏆</span>
          <p>No achievements available for this account.</p>
        </div>
      );
    }

    return list.map((ach, index) => {
      const isUnlocked = ach.unlocked || false;
      const dateUnlocked = ach.dateUnlocked;

      let formattedDate = "Achievement still locked";
      if (isUnlocked && dateUnlocked) {
        formattedDate = formatDate(dateUnlocked);
      }

      return (
        <div
          className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${isUnlocked
            ? 'bg-success/5 border border-success/20'
            : 'bg-white/5 border border-white/10 opacity-70'
            }`}
          key={index}
        >
          <div className="flex-shrink-0">
            {getAchievementIcon(ach)}
          </div>
          <div className="min-w-0 space-y-1">
            <h3 className={`font-bold text-sm truncate ${isUnlocked ? 'text-text-primary' : 'text-text-muted'}`}>{ach.title}</h3>
            <p className="text-[11px] text-text-secondary line-clamp-2">{ach.description}</p>
            <p className="text-[10px] text-text-muted italic">
              {isUnlocked ? `Unlocked: ${formattedDate}` : formattedDate}
            </p>
          </div>
        </div>
      );
    });
  }

  if (isLoading) return <LoadingScreen />;

  if (!game) {
    return (
      <div className="page-container">
        <Header /><div className="flex-1 flex items-center justify-center"><p className="text-text-muted text-lg uppercase font-black tracking-widest">Game data unavailable</p></div><Footer />
      </div>
    );
  }

  const lastPlayed = selectedOwner?.lastPlayed
    ? formatDate(selectedOwner.lastPlayed)
    : "Game hasn't been played on this account";

  const storeLinks = {
    steam: [
      { label: "Steam App", href: `steam://store/${id}`, onClick: true },
      { label: "Steam Web", href: `https://store.steampowered.com/app/${id}` },
    ],
    psn: [{ label: "PSN Store", href: `https://store.playstation.com/en-us/search/${encodeURIComponent(game.gameName)}` }],
    xbox: [{ label: "Xbox Store", href: `https://www.microsoft.com/en-us/p/${encodeURIComponent(game.gameName)}` }],
    epic: [{ label: "Epic Store", href: `https://www.epicgames.com/store/en-US/browse?q=${encodeURIComponent(game.gameName)}` }],
  };

  const normalizedPlatform = platformQuery?.toLowerCase();

  return (
    <div className="page-container">
      <Header />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

          {/* Hero Section */}
          <div className="card-surface p-6 sm:p-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex flex-col md:flex-row gap-10">
              <div className="flex-shrink-0 group">
                <div className="relative overflow-hidden rounded-2xl shadow-2xl shadow-black/40">
                  <img src={game.coverImage} alt={game.gameName} className="w-full md:w-64 lg:w-80 transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/40 to-transparent" />
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between py-2">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-text-primary uppercase slant-2">
                      {game.gameName}
                    </h1>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {storeLinks[normalizedPlatform] && storeLinks[normalizedPlatform].map((link, i) => (
                        <a key={i} className="badge bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all font-bold uppercase tracking-widest text-[10px]"
                          href={link.onClick ? undefined : link.href} onClick={link.onClick ? () => (window.location.href = link.href) : undefined}
                          target={link.onClick ? undefined : "_blank"} rel="noopener noreferrer"> {link.label} ↗ </a>
                      ))}
                    </div>
                  </div>

                  {/* Account Switcher */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Linked Profiles:</span>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {game.owners.map(owner => (
                        <button
                          key={owner.accountId}
                          onClick={() => setSelectedOwnerId(owner.accountId)}
                          className={`flex items-center gap-3 p-1.5 pr-4 rounded-xl transition-all duration-300 border ${selectedOwnerId === owner.accountId ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-midnight-800/50 border-white/5 text-text-muted hover:bg-midnight-800 hover:text-text-primary'}`}
                        >
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-midnight-900 border border-white/5">
                            {owner.avatar ? <img src={owner.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-xs uppercase">{owner.accountName?.charAt(0)}</div>}
                          </div>
                          <div className="text-left">
                            <p className="text-[11px] font-black uppercase tracking-tight">{owner.accountName || owner.accountId}</p>
                            <p className="text-[9px] font-bold opacity-60">ID: {owner.accountId}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Platform</p>
                    <p className="font-black text-accent uppercase text-sm tracking-tight">{platformQuery}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Playtime</p>
                    <p className="font-black text-text-primary text-sm tracking-tight">{selectedOwner?.hoursPlayed || "0h"}</p>
                  </div>
                  <div className="space-y-1 lg:col-span-2">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Last Boot</p>
                    <p className="font-black text-text-primary text-sm tracking-tight">{lastPlayed}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements Section */}
          <div className="card-surface p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <div className="flex items-center justify-between mb-10 pb-4 border-b border-white/5">
              <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight flex items-center gap-3">
                <span className="text-accent">🏆</span> Achievements
              </h2>
              {selectedOwner && (
                <div className="text-right">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Account Progress</p>
                  <p className="text-xl font-black text-accent">{(selectedOwner.achievements?.filter(a => a.unlocked).length || 0)} / {selectedOwner.achievements?.length || 0}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
