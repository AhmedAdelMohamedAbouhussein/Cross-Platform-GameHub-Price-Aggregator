import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import SearchBar from "../../components/SearchBar/SearchBar.jsx";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen.jsx";
import styles from "./BrowsePage.module.css";

const BrowseGamesPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);

        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        const fetchGames = async () => {
            setLoading(true);
            try {
                // If search term is empty, we could fetch trending/popular games
                // For now, let's just search if there's a term
                const endpoint = debouncedSearch 
                    ? `/games/search?q=${encodeURIComponent(debouncedSearch)}`
                    : `/games/landingpage`; // Fallback to landing page images if empty or a trending endpoint
                
                const response = await apiClient.get(endpoint);
                
                // Unified format check
                const formattedData = debouncedSearch 
                    ? response.data 
                    : response.data.map(([image, link]) => ({
                        image,
                        name: link.replace("/games/", "").replace(/%20/g, " "),
                        id: link
                    }));

                setGames(formattedData);
            } catch (error) {
                console.error("Error fetching games:", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchGames();
    }, [debouncedSearch]);

    const handleGameClick = (game) => {
        // Handle both formats
        const gameName = game.name || game.id.replace("/games/", "");
        navigate(`/games/${gameName}`);
    };

    return (
        <div className={styles.browseContainer}>
            <Header />
            
            <main className={styles.mainContent}>
                <div className={styles.searchHeader}>
                    <h1 className={styles.title}>Browse Games</h1>
                    <p className={styles.subtitle}>Find your next adventure across all platforms</p>
                    
                    <div className={styles.searchWrapper}>
                        <SearchBar 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            placeholder="Type to search games..."
                        />
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loaderWrapper}>
                        <LoadingScreen />
                    </div>
                ) : (
                    <div className={styles.gamesGrid}>
                        {games.length > 0 ? (
                            games.map((game) => (
                                <div 
                                    key={game.id} 
                                    className={styles.gameCard}
                                    onClick={() => handleGameClick(game)}
                                >
                                    <div className={styles.imageWrapper}>
                                        <img src={game.image} alt={game.name} className={styles.gameImage} />
                                        <div className={styles.cardOverlay}>
                                            <span className={styles.viewDetails}>View Details</span>
                                        </div>
                                    </div>
                                    <div className={styles.gameInfo}>
                                        <h3 className={styles.gameName}>{game.name}</h3>
                                        <div className={styles.gameMeta}>
                                            {game.released && <span>📅 {game.released.split("-")[0]}</span>}
                                            {game.rating > 0 && <span className={styles.rating}>⭐ {game.rating}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.noResults}>
                                <p>No games found matching "{debouncedSearch}"</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default BrowseGamesPage;
