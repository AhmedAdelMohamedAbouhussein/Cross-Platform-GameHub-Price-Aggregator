import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/apiClient.js";

import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

const STORE_COLORS = {
    "Steam": "bg-blue-900/30 border-blue-500/30 hover:bg-blue-900/50",
    "Epic Games": "bg-gray-900/30 border-gray-500/30 hover:bg-gray-900/50",
    "PlayStation Store": "bg-blue-800/30 border-blue-400/30 hover:bg-blue-800/50",
    "Microsoft Store": "bg-green-900/30 border-green-500/30 hover:bg-green-900/50",
    "Xbox Store": "bg-green-900/30 border-green-500/30 hover:bg-green-900/50",
    "Nintendo Store": "bg-red-900/30 border-red-400/30 hover:bg-red-900/50",
    "EA App (Origin)": "bg-orange-900/30 border-orange-400/30 hover:bg-orange-900/50",
};

function formatDate(dateStr) {
    if (!dateStr) return "TBA";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

const fetchGame = async (gameName) => {
    const response = await apiClient.get(`/games/${encodeURIComponent(gameName)}`);
    return response.data;
};

const GamePage = () => {
    const { gameName } = useParams();
    const navigate = useNavigate();

    const {
        data: game,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ["game", gameName],
        queryFn: () => fetchGame(gameName),
        enabled: !!gameName,
        staleTime: 1000 * 60 * 5,
        retry: 2
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [gameName]);

    if (isLoading) return <LoadingScreen />;

    if (isError) {
        return (
            <div className="page-container">
                <Header />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="card-surface p-8 text-center space-y-4 max-w-md animate-fade-in">
                        <span className="text-5xl">😕</span>
                        <h2 className="text-xl font-bold text-text-primary">Something went wrong</h2>
                        <p className="text-sm text-text-secondary">
                            {error?.response?.data?.message || error?.response?.data?.error || "Failed to fetch game details"}
                        </p>
                        <button className="btn-primary" onClick={() => navigate("/")}>
                            Back to Home
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!game) return null;

    return (
        <div className="page-container">
            <Header />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0">
                        {game.image && (
                            <img
                                className="w-full h-full object-cover opacity-20 blur-xl scale-110"
                                src={game.image}
                                alt=""
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-midnight-900/50 via-midnight-800/80 to-midnight-800" />
                    </div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20">
                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {game.image && (
                                <img
                                    className="w-full max-w-xs sm:max-w-sm lg:max-w-md rounded-xl shadow-2xl shadow-black/40 border border-midnight-500/20 flex-shrink-0"
                                    src={game.image}
                                    alt={game.name}
                                />
                            )}
                            <div className="space-y-4 animate-slide-up">
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-text-primary">
                                    {game.name}
                                </h1>
                                <div className="flex flex-wrap gap-2">
                                    <span className="badge bg-midnight-700 text-text-secondary">
                                        📅 {formatDate(game.released)}
                                    </span>
                                    {game.playtime > 0 && (
                                        <span className="badge bg-midnight-700 text-text-secondary">
                                            ⏱️ Avg {game.playtime}h
                                        </span>
                                    )}
                                    {game.metacritic && (
                                        <span className="badge bg-success/10 text-success border border-success/20">
                                            ⭐ {game.metacritic}
                                        </span>
                                    )}
                                </div>

                                {game.trailer && (
                                    <button
                                        className="btn-primary inline-flex items-center gap-2"
                                        onClick={() => document.getElementById('trailers-section')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        ▶️ Watch Trailer
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                    {/* Trailer Section */}
                    {game.trailer && (
                        <section id="trailers-section" className="card-surface p-4 sm:p-6">
                            <h2 className="section-title mb-4">🎬 Official Trailer</h2>
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                                <iframe
                                    className="absolute inset-0 w-full h-full"
                                    src={`${game.trailer.embedUrl}?rel=0&modestbranding=1`}
                                    title={`${game.name} Trailer`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </section>
                    )}

                    {/* Deals Section */}
                    {(game.deals || game.historyLow) && (
                        <section className="card-surface p-4 sm:p-6 space-y-4">
                            <h2 className="section-title">💰 Best Deals & Prices</h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Best Deal */}
                                <div className="bg-midnight-800 rounded-xl p-5 border border-accent/20 space-y-4">
                                    {game.deals && game.deals.length > 0 ? (
                                        <>
                                            <span className="badge bg-accent/10 text-accent border border-accent/20">Best Deal</span>
                                            <div className="text-3xl font-extrabold text-accent">${game.deals[0].price}</div>
                                            <p className="text-sm text-text-secondary">
                                                available at <strong className="text-text-primary">{game.deals[0].store}</strong>
                                            </p>

                                            {game.historyLow && (
                                                <div className="space-y-2 pt-2 border-t border-midnight-500/30">
                                                    <span className="badge bg-success/10 text-success text-xs">
                                                        📉 All-Time Low: ${game.historyLow.all}
                                                    </span>
                                                    <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                                                        <span>1Y Low: ${game.historyLow.y1}</span>
                                                        <span>3M Low: ${game.historyLow.m3}</span>
                                                    </div>
                                                    {game.deals[0].storeLow && (
                                                        <span className="text-xs text-text-muted">
                                                            🏪 {game.deals[0].store} Low: ${game.deals[0].storeLow}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <a
                                                href={game.deals[0].url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-primary inline-block text-center w-full"
                                            >
                                                Get This Deal ↗
                                            </a>
                                        </>
                                    ) : (
                                        <p className="text-text-muted text-sm">No active deals found at the moment.</p>
                                    )}
                                </div>

                                {/* Other stores */}
                                {/* Other stores */}
                                {game.deals && game.deals.length > 1 && (
                                    <div className="bg-midnight-800 rounded-xl p-5 border border-midnight-500/30 space-y-2">
                                        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                                            Other Stores
                                        </p>

                                        {game.deals.slice(1).map((deal, idx) => (
                                            <a
                                                key={idx}
                                                href={deal.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between px-4 py-3 rounded-lg bg-midnight-700 hover:bg-midnight-600 border border-midnight-500/20 transition-colors"
                                            >
                                                <div className="space-y-0.5">
                                                    <span className="text-sm font-medium text-text-primary">
                                                        {deal.store}
                                                    </span>

                                                    {deal.storeLow && (
                                                        <span className="block text-xs text-text-muted">
                                                            All Time Low: ${deal.storeLow}
                                                        </span>
                                                    )}
                                                </div>

                                                <span className="text-sm font-bold text-accent">
                                                    ${deal.price} ↗
                                                </span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted pt-2 border-t border-midnight-500/30">
                                <span>Data by <a href="https://isthereanydeal.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">IsThereAnyDeal</a></span>
                                <span>•</span>
                                <span>Game data by <a href="https://rawg.io" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">RAWG</a></span>
                            </div>
                        </section>
                    )}

                    {/* Main Content: Description + Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Description & Requirements */}
                        <div className="lg:col-span-2 space-y-6">
                            {game.description && (
                                <div className="card-surface p-4 sm:p-6">
                                    <h2 className="section-title mb-4">About</h2>
                                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                                        {game.description}
                                    </p>
                                </div>
                            )}

                            {(game.minimumreq || game.recommendedreq) && (
                                <div className="card-surface p-4 sm:p-6">
                                    <h2 className="section-title mb-4">⚙️ System Requirements (PC)</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {game.minimumreq && (
                                            <div className="bg-midnight-800 rounded-lg p-4 border border-midnight-500/20">
                                                <h3 className="text-sm font-semibold text-warning mb-2">Minimum</h3>
                                                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">{game.minimumreq}</p>
                                            </div>
                                        )}
                                        {game.recommendedreq && (
                                            <div className="bg-midnight-800 rounded-lg p-4 border border-midnight-500/20">
                                                <h3 className="text-sm font-semibold text-success mb-2">Recommended</h3>
                                                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">{game.recommendedreq}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {(!game.description && !game.minimumreq && !game.recommendedreq) && (
                                <div className="card-surface p-8 text-center">
                                    <p className="text-text-muted">Detailed information for this title is currently unavailable.</p>
                                </div>
                            )}
                        </div>

                        {/* Right: Metadata */}
                        <div className="space-y-4">
                            {game.developers?.length > 0 && (
                                <div className="card-surface p-4">
                                    <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Developer</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {game.developers.map((dev, i) => (
                                            <span key={i} className="badge bg-midnight-600 text-text-secondary text-xs">{dev}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {game.publishers?.length > 0 && (
                                <div className="card-surface p-4">
                                    <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Publisher</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {game.publishers.map((pub, i) => (
                                            <span key={i} className="badge bg-midnight-600 text-text-secondary text-xs">{pub}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {game.genres?.length > 0 && (
                                <div className="card-surface p-4">
                                    <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Genre</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {game.genres.map((genre, i) => (
                                            <span key={i} className="badge bg-accent/10 text-accent text-xs border border-accent/20">{genre}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {game.stores?.length > 0 && (
                                <div className="card-surface p-4">
                                    <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Available On</p>
                                    <div className="space-y-2">
                                        {game.stores.map((storeConfig, idx) => (
                                            <a
                                                key={idx}
                                                href={storeConfig.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors ${STORE_COLORS[storeConfig.name] || 'bg-midnight-600/30 border-midnight-500/30 hover:bg-midnight-600'}`}
                                            >
                                                <span className="text-text-primary font-medium">{storeConfig.name}</span>
                                                <span className="text-text-muted">↗</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default GamePage;