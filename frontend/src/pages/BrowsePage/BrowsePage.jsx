import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import SearchBar from "../../components/SearchBar/SearchBar.jsx";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen.jsx";

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
                const endpoint = debouncedSearch
                    ? `/games/search?q=${encodeURIComponent(debouncedSearch)}`
                    : `/games/landingpage`;

                const response = await apiClient.get(endpoint);

                const formattedData = debouncedSearch
                    ? response.data
                    : response.data.map(([image, link]) => ({
                        image,
                        name: decodeURIComponent(link.split("/:").pop()),
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
        const gameName = game.name || game.id.replace("/games/", "");
        navigate(`/games/${gameName}`);
    };

    return (
        <div className="page-container">
            <Header />

            <main className="flex-1">
                {/* Search header */}
                <section className="bg-gradient-to-b from-midnight-900 to-midnight-800 py-10 sm:py-14 lg:py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                            <span className="bg-gradient-to-r from-accent via-accent-glow to-blue-300 bg-clip-text text-transparent">
                                Browse Games
                            </span>
                        </h1>
                        <p className="text-text-secondary text-sm sm:text-base max-w-lg mx-auto">
                            Find your next adventure across all platforms
                        </p>

                        <div className="max-w-xl mx-auto pt-2">
                            <SearchBar
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Type to search games..."
                            />
                        </div>
                    </div>
                </section>

                {/* Results */}
                <section className="page-content">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {games.length > 0 ? (
                                games.map((game) => (
                                    <div
                                        key={game.id}
                                        className="group card-surface overflow-hidden cursor-pointer hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-1 transition-all duration-300"
                                        onClick={() => handleGameClick(game)}
                                    >
                                        <div className="relative aspect-[3/4] overflow-hidden">
                                            <img
                                                src={game.image}
                                                alt={game.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-midnight-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                                                <span className="badge bg-accent text-white text-xs font-semibold px-4 py-1.5">
                                                    View Details
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-4 space-y-1.5">
                                            <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                                                {game.name}
                                            </h3>
                                            <div className="flex items-center gap-3 text-xs text-text-muted">
                                                {game.released && <span>📅 {game.released.split("-")[0]}</span>}
                                                {game.rating > 0 && <span className="text-warning">⭐ {game.rating}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full flex flex-col items-center justify-center py-20 text-text-muted">
                                    <span className="text-5xl mb-4">🎮</span>
                                    <p className="text-lg">No games found matching "{debouncedSearch}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default BrowseGamesPage;
