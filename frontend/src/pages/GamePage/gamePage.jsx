import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient.js";

import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import styles from "./GamePage.module.css";

// Map store names from RAWG to CSS class + display label
const STORE_STYLES = {
    "Steam": { className: "storeSteam", label: "Steam" },
    "Epic Games": { className: "storeEpic", label: "Epic Games" },
    "PlayStation Store": { className: "storePlayStation", label: "PlayStation Store" },
    "Microsoft Store": { className: "storeMicrosoft", label: "Microsoft Store" },
    "Xbox Store": { className: "storeXbox", label: "Xbox Store" },
    "Nintendo Store": { className: "storeNintendo", label: "Nintendo Store" },
    "EA App (Origin)": { className: "storeEA", label: "EA App" },
};

function getStoreStyle(storeName) {
    return STORE_STYLES[storeName] || { className: "storeDefault", label: storeName };
}

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

const GamePage = () => {
    const { gameName } = useParams();
    const navigate = useNavigate();

    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);

        async function fetchGame() {
            try {
                const response = await apiClient.get(`/games/${encodeURIComponent(gameName)}`);
                setGame(response.data);
            }
            catch (err) {
                setError(err.response?.data?.message || err.response?.data?.error || "Failed to fetch game details");
            }
            finally {
                setLoading(false);
            }
        }
        fetchGame();
    }, [gameName]);

    if (loading) return <LoadingScreen />;

    if (error) {
        return (
            <div className={styles.container}>
                <Header />
                <div className={styles.errorContainer}>
                    <h2>😕 Something went wrong</h2>
                    <p>{error}</p>
                    <button className={styles.backButton} onClick={() => navigate("/")}>
                        Back to Home
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    if (!game) return null;

    return (
        <div className={styles.container}>
            <Header />
            <div className={styles.page}>

                {/* Hero Section */}
                <div className={styles.hero}>
                    {game.image ? (
                        <img
                            className={styles.heroImage}
                            src={game.image}
                            alt={game.name}
                        />
                    ) : (
                        <div className={styles.heroImage} style={{ background: '#1b2838' }} />
                    )}

                    <div className={styles.heroContent}>
                        <h1 className={styles.heroTitle}>{game.name}</h1>
                        <div className={styles.statsRow}>
                            <span className={styles.statBadge}>
                                📅 Released: {formatDate(game.released)}
                            </span>
                            {game.playtime > 0 && (
                                <span className={styles.statBadge}>
                                    ⏱️ Avg Playtime: {game.playtime}h
                                </span>
                            )}
                            {game.metacritic && (
                                <span className={`${styles.statBadge} ${styles.metacritic}`}>
                                    ⭐ Metacritic: {game.metacritic}
                                </span>
                            )}
                        </div>

                        {/* Hero Actions */}
                        {game.trailer && (
                            <div className={styles.heroActions}>
                                <button
                                    className={styles.watchTrailerBtn}
                                    onClick={() => document.getElementById('trailers-section')?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    ▶️ Watch Trailer
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Gameplay & Trailers Section */}
                {game.trailer && (
                    <div id="trailers-section" className={styles.videosSection}>
                        <h2 className={styles.sectionTitle}>🎬 Gameplay & Official Trailer</h2>
                        <div className={styles.videoWrapper}>
                            <iframe
                                className={styles.videoPlayer}
                                src={`${game.trailer.embedUrl}?rel=0&modestbranding=1`}
                                title={`${game.name} Trailer`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                )}

                {/* Price Comparison & Deals Section */}
                {(game.deals || game.historyLow) && (
                    <div className={styles.dealsSection}>
                        <h2 className={styles.sectionTitle}>💰 Best Deals & Price Comparison</h2>
                        <div className={styles.dealsGrid}>

                            {/* Best Current Deal */}
                            <div className={styles.bestDealCard}>
                                {game.deals && game.deals.length > 0 ? (
                                    <>
                                        <span className={styles.bestDealBadge}>Best Deal</span>
                                        <div className={styles.priceDisplay}>
                                            ${game.deals[0].price}
                                        </div>
                                        <div className={styles.shopName}>
                                            available at <strong>{game.deals[0].store}</strong>
                                        </div>

                                        {game.historyLow && (
                                            <div className={styles.historyLowsContainer}>
                                                <div className={styles.historyLowBadge}>
                                                    📉 All-Time Low: ${game.historyLow.all}
                                                </div>
                                                <div className={styles.historyLowSub}>
                                                    <span>1 Year Low: ${game.historyLow.y1}</span>
                                                    <span>3 Month Low: ${game.historyLow.m3}</span>
                                                </div>
                                                {game.deals[0].storeLow && (
                                                    <div className={styles.storeLowBadge}>
                                                        🏪 {game.deals[0].store} Low: ${game.deals[0].storeLow}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <a
                                            href={game.deals[0].url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.getDealBtn}
                                        >
                                            Get This Deal ↗
                                        </a>
                                    </>
                                ) : (
                                    <div className={styles.description}>No active deals found at the moment.</div>
                                )}
                            </div>

                            {/* Alternative Prices */}
                            {game.deals && game.deals.length > 1 && (
                                <div className={styles.alternativePrices}>
                                    <div className={styles.detailLabel} style={{ marginBottom: '10px' }}>Other Stores</div>
                                    {game.deals.slice(1, 6).map((deal, idx) => (
                                        <a
                                            key={idx}
                                            href={deal.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.altPriceRow}
                                        >
                                            <div className={styles.altStoreInfo}>
                                                <span>{deal.store}</span>
                                                {deal.storeLow && (
                                                    <span className={styles.altStoreLow}> All-Time Low: ${deal.storeLow}</span>
                                                )}
                                            </div>
                                            <span className={styles.altPriceValue}>
                                                ${deal.price} ↗
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Data Source Attributions */}
                        <div className={styles.attributionContainer}>
                            <span>Data provided by <a href="https://isthereanydeal.com" target="_blank" rel="noopener noreferrer">IsThereAnyDeal</a></span>
                            <span className={styles.divider}>|</span>
                            <span>Game data & images from <a href="https://rawg.io" target="_blank" rel="noopener noreferrer">RAWG</a></span>
                        </div>
                    </div>
                )}

                {/* Main Content Layout */}
                <div className={styles.mainContent}>

                    {/* Left Column: Description & System Requirements */}
                    <div className={styles.leftCol}>

                        {/* About Section */}
                        {game.description && (
                            <div className={styles.descriptionSection}>
                                <h2 className={styles.sectionTitle}>About</h2>
                                <p className={styles.descriptionText}>{game.description}</p>
                            </div>
                        )}

                        {/* Requirements Section */}
                        {(game.minimumreq || game.recommendedreq) && (
                            <div className={styles.requirementsSection}>
                                <h2 className={styles.sectionTitle}>⚙️ System Requirements (PC)</h2>
                                <div className={styles.reqGrid}>
                                    {game.minimumreq && (
                                        <div className={styles.reqCard}>
                                            <h3 className={styles.reqType}>Minimum</h3>
                                            <div className={styles.reqText}>{game.minimumreq}</div>
                                        </div>
                                    )}
                                    {game.recommendedreq && (
                                        <div className={styles.reqCard}>
                                            <h3 className={styles.reqType}>Recommended</h3>
                                            <div className={styles.reqText}>{game.recommendedreq}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {(!game.description && !game.minimumreq && !game.recommendedreq) && (
                            <div className={styles.noDataPlaceholder}>
                                <p>Detailed information for this title is currently unavailable.</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Specs and Stores */}
                    <div className={styles.rightCol}>

                        {/* Developers */}
                        {game.developers?.length > 0 && (
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Developer</span>
                                <div className={styles.tagsContainer}>
                                    {game.developers.map((dev, i) => (
                                        <span key={i} className={styles.tag}>{dev}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Publishers */}
                        {game.publishers?.length > 0 && (
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Publisher</span>
                                <div className={styles.tagsContainer}>
                                    {game.publishers.map((pub, i) => (
                                        <span key={i} className={styles.tag}>{pub}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Genres */}
                        {game.genres?.length > 0 && (
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Genre</span>
                                <div className={styles.tagsContainer}>
                                    {game.genres.map((genre, i) => (
                                        <span key={i} className={styles.tag}>{genre}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stores List */}
                        {game.stores?.length > 0 && (
                            <div className={styles.detailRow} style={{ marginTop: '10px' }}>
                                <span className={styles.detailLabel}>Available On</span>
                                <div className={styles.storesList}>
                                    {game.stores.map((storeConfig, idx) => {
                                        const uiStyle = getStoreStyle(storeConfig.name);
                                        return (
                                            <a
                                                key={idx}
                                                href={storeConfig.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`${styles.storeLink} ${styles[uiStyle.className]}`}
                                            >
                                                <span>{uiStyle.label}</span>
                                                <span>↗</span>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
            <Footer />
        </div>
    );
};

export default GamePage;