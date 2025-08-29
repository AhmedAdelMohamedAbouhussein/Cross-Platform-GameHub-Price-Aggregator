import { useContext, useEffect  } from "react";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Aside from '../../components/Aside/Aside';
import Card from '../../components/Card/Card';
import styles from './LibraryPage.module.css';

import AuthContext from "../../contexts/AuthContext";

function LibraryPage() {
  const { user } = useContext(AuthContext);

    // ⬅️ Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const renderCards = () => {
    if (!user?.ownedGames) return null; // nothing if not ready

    // Convert plain object -> Map
    const ownedGamesMap = new Map(Object.entries(user.ownedGames));

    return Array.from(ownedGamesMap.entries()).flatMap(([platform, gamesObj]) => {
      const gamesMap = new Map(Object.entries(gamesObj));

      // Sort by progress (highest first)
      const sortedGames = Array.from(gamesMap.entries())
        .sort((a, b) => b[1].progress - a[1].progress);

      return sortedGames.map(([gameId, game]) => (
        <Card
          key={`${platform}-${gameId}`}
          id={gameId}             // pass gameId explicitly
          platform={platform}     // better to use platform from map key
          image={game.coverImage}
          title={game.gameName}
          progress={game.progress}
          lastPlayed={game.lastPlayed}
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
          <div className={styles.cardGrid}>
            {renderCards()}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default LibraryPage;
