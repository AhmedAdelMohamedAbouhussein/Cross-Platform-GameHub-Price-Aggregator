import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaLock, FaUnlock } from "react-icons/fa";
import axios from "axios";

import Styles from "./OwnedGamesDetails.module.css";
import AuthContext from "../../contexts/AuthContext";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

function OwnedGamesDetails() {
  const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
  const API_BASE = import.meta.env.MODE === "development" ? "" : BACKEND_URL;

  const [searchParams] = useSearchParams();
  const platform = searchParams.get("platform");
  const id = searchParams.get("id");

  const { user } = useContext(AuthContext);
  const [game, setGame] = useState(null); // <-- state
  const [loading, setLoading] = useState(true);

  // Reset scroll + fetch on mount
  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchGame = async () => {
      try {
        const res = await axios.post(
          `${API_BASE}/api/users/ownedgames/${platform}/${id}`,
          {
            userId: user._id,
          }
        );
        setGame(res.data.game); // <-- update state
        console.log("Fetched owned game:", res.data.game);
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id && platform && id) {
      fetchGame();
    }
  }, [user, API_BASE, platform, id]);

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
      return <p>No achievements available for this game.</p>;
    }

    return game.achievements.map((ach, index) => {
      let formattedDate = "Achievement still locked";

      if (ach.unlocked && ach.dateUnlocked) {
        formattedDate = formatDate(ach.dateUnlocked);
      }

      return (
        <div
          className={Styles.achBar}
          key={index}
          style={{ background: ach.unlocked ? "#0c3718" : "#4f0f0d" }}
        >
          <div className={Styles.achIcon}>
            {ach.unlocked ? (
              <FaUnlock color="#00ff80" />
            ) : (
              <FaLock color="#ff4c4c" />
            )}
          </div>
          <div className={Styles.achText}>
            <h2>{ach.title}</h2>
            <p>{ach.description}</p>
            <p className="date">Unlocked on: {formattedDate}</p>
          </div>
        </div>
      );
    });
  }

  if (loading) {
    return (
      <div className={Styles.container}>
        <Header />
        <p className={Styles.loading}>Loading game details...</p>
        <Footer />
      </div>
    );
  }

  if (!game) {
    return (
      <div className={Styles.container}>
        <Header />
        <p className={Styles.error}>Game not found.</p>
        <Footer />
      </div>
    );
  }

  const lastPlayed = game.lastPlayed
    ? formatDate(game.lastPlayed)
    : "Game hasn't been played";

  return (
    <div className={Styles.container}>
      <Header />
      <div className={Styles.page}>
        <div className={Styles.top}>
          <div className={Styles.info}>
            <h1 className={Styles.gameTitle}>{game.gameName} Details</h1>
            <div className={Styles.link}>
              <label>Open Game at Steam Desktop App: </label>
              <a
                className={Styles.storeLink}
                onClick={() => (window.location.href = `steam://store/${id}`)}
              >
                Steam Link
              </a>
            </div>
            <div className={Styles.link}>
              <label>Open Game at Steam Website: </label>
              <a
                className={Styles.storeLink}
                href={`https://store.steampowered.com/app/${id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Steam Website
              </a>
            </div>
            <p>
              You bought the game on:{" "}
              <strong style={{ color: "yellow" }}>{platform}</strong>
            </p>
            <p>
              Total hours played{" "}
              <strong style={{ color: "yellow" }}>{game.hoursPlayed}</strong>
            </p>
            <p>
              Last played: <strong style={{ color: "yellow" }}>{lastPlayed}</strong>
            </p>
          </div>
          <div className={Styles.imgContainer}>
            <img src={game.coverImage} alt={game.gameName} loading="lazy" />
          </div>
        </div>
        <div className={Styles.achContainer}>{renderAchievements()}</div>
      </div>
      <Footer />
    </div>
  );
}

export default OwnedGamesDetails;
