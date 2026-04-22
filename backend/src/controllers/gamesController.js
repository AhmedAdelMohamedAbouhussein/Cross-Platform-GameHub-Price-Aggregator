import axios from 'axios';
import gameImages from '../assets/landingPageURLs.js';
import config from "../config/env.js";
import { getGameTrailer } from "../config/youtube.js";
import redisClient from "../config/redis.js";

const RAWG_API_KEY = config.RAWG_API_KEY;

// ── Shared axios client with 8s timeout ──────────────────────────────────────
const axiosClient = axios.create({ timeout: 8000 });

// ── Cache TTLs (seconds) ──────────────────────────────────────────────────────
const TTL_GAME_DETAILS = 3600;  // 1 hour
const TTL_LANDING_PAGE = 36000;   // 10 hour
const TTL_SEARCH = 300;   // 5 min

const formatRequirements = (req) => {
    if (!req) return null;
    return req
        // Strip common international labels for Minimum/Recommended
        .replace(/(?:Minimum|Recommended|Mínimo|Recomendados|Recomendado|Configuration minimale|Configuration recommandée|Mindestanforderungen|Empfohlen|システム要件|最低|推奨|Минимальные требования|Рекомендуемые требования|Requisiti minimi|Requisiti consigliati):/gi, '')
        .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newlines
        .replace(/<[^>]*>/g, '')      // Strip any other HTML tags
        .trim();
};

// ── Helper: safe Redis GET ────────────────────────────────────────────────────
async function cacheGet(key) {
    try {
        const val = await redisClient.get(key);
        if (val) {
            console.log(`[Cache HIT] ${key}`);
            return JSON.parse(val);
        }
    } catch (err) {
        console.warn(`[Cache] Redis GET error for ${key}:`, err.message);
    }
    return null;
}

// ── Helper: safe Redis SET ────────────────────────────────────────────────────
async function cacheSet(key, data, ttl) {
    try {
        await redisClient.setEx(key, ttl, JSON.stringify(data));
        console.log(`[Cache SET] ${key} (TTL: ${ttl}s)`);
    } catch (err) {
        console.warn(`[Cache] Redis SET error for ${key}:`, err.message);
    }
}

// @desc  get topselling games from Steam API
// @route  Get /games/topselling
export const getTopSellers = async (req, res, next) => {
    try {
        const response = await axiosClient.get('https://store.steampowered.com/api/featuredcategories');

        if (response.status === 200) {

            if (!response.data || !response.data.top_sellers || !response.data.top_sellers.items) {
                const err = new Error('Top sellers data not found in response');
                err.status = 404;
                return next(err);
            }

            const formattedGames = response.data.top_sellers.items.map((game) => [game.header_image, `/games/${encodeURIComponent(game.name)}`,]);
            res.status(200).json(formattedGames);
        }
        else {
            const err = new Error('Failed to fetch top selling games from Steam API');
            err.status = response.status;
            next(err);
        }
    }
    catch (error) {
        const err = new Error('Failed to fetch top selling games from Steam API');
        err.status = 500;
        next(err);
    }
};

// @desc  Get game details by ID (RAWG)
// @route  GET /games/:id
export const getOneGameDetails = async (req, res, next) => {
    const gameId = req.params.id;

    if (!gameId || gameId.trim() === '') {
        return next(new Error('Game ID is required'));
    }

    console.log(`Received request for game details: ${gameId}`);

    // ── Cache check ───────────────────────────────────────────────────────────
    const cacheKey = `game:details:${gameId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    try {
        const { data } = await axiosClient.get(
            `https://api.rawg.io/api/games/${gameId}`,
            {
                params: { key: RAWG_API_KEY }
            }
        );

        // ✅ Stores
        const formattedStores =
            data.stores?.map(s => ({
                name: s.store.name,
                url: s.url
            })) || [];

        // ✅ Platforms
        const formattedPlatforms =
            data.platforms?.map(p => p.platform.name) || [];

        const gameProfile = {
            id: data.id,
            name: data.name,
            slug: data.slug,
            description: data.description_raw || "No description available.",
            minimumreq: formatRequirements(
                data.platforms?.find(p => p.platform.slug === "pc")?.requirements?.minimum
            ),
            recommendedreq: formatRequirements(
                data.platforms?.find(p => p.platform.slug === "pc")?.requirements?.recommended
            ),
            released: data.released,
            image: data.background_image,
            metacritic: data.metacritic,
            playtime: data.playtime,
            developers: data.developers?.map(d => d.name) || [],
            publishers: data.publishers?.map(p => p.name) || [],
            genres: data.genres?.map(g => g.name) || [],
            stores: formattedStores,
            platforms: formattedPlatforms,
            historyLow: null,
            deals: null,
            youtubeTrailer: null,
            rawgTrailer: null
        };

        // 🎬 YouTube Trailer
        try {
            const releaseYear = data.released ? data.released.split('-')[0] : '';
            gameProfile.youtubeTrailer = await getGameTrailer(`${data.name} official game trailer ${releaseYear}`.trim());
        } catch (err) {
            console.error("YouTube trailer fetch failed:", err.message);
        }

        // 🎬 RAWG Trailer
        try {
            const moviesRes = await axiosClient.get(
                `https://api.rawg.io/api/games/${gameId}/movies`,
                { params: { key: RAWG_API_KEY } }
            );

            if (moviesRes.data?.results?.length > 0) {
                const rawgData = moviesRes.data.results[0].data;
                gameProfile.rawgTrailer = rawgData.max || rawgData[480] || null;
            }
        } catch (err) {
            console.error("RAWG trailer fetch failed:", err.message);
        }

        // 💰 ITAD Integration (Production-Grade Matching)
        try {
            const ITAD_API_KEY = config.iTAD.apiKey;

            if (!ITAD_API_KEY) {
                console.log("No ITAD API key provided");
            } else {

                // 🔍 Search ITAD
                const searchRes = await axiosClient.get(
                    "https://api.isthereanydeal.com/games/search/v1",
                    {
                        params: {
                            key: ITAD_API_KEY,
                            title: data.name,
                            results: 10
                        }
                    }
                );

                if (searchRes.data?.length > 0) {

                    // 🧠 Normalize titles (advanced)
                    const normalize = (str) => {
                        return str
                            .toLowerCase()
                            .replace(/\(.*?\)/g, '') // remove (2023), (Remake)
                            .replace(/\b(game of the year|goty|edition|complete|bundle|definitive|remastered|redux)\b/g, '')
                            .replace(/[^a-z0-9]/g, '');
                    };

                    const rawgName = normalize(data.name);
                    const rawgSlug = normalize(data.slug || "");

                    // 🎯 Scoring function (weighted)
                    const scoreMatch = (a, b) => {
                        if (!a || !b) return 0;

                        if (a === b) return 100;

                        if (a.includes(b) || b.includes(a)) return 90;

                        let matches = 0;
                        for (let i = 0; i < Math.min(a.length, b.length); i++) {
                            if (a[i] === b[i]) matches++;
                        }

                        const baseScore = (matches / Math.max(a.length, b.length)) * 100;

                        return baseScore;
                    };

                    // 🧠 Find BEST match with slug boost
                    let bestMatch = null;
                    let bestScore = 0;

                    for (const g of searchRes.data) {
                        const itadName = normalize(g.title);

                        let score = scoreMatch(itadName, rawgName);

                        // 🚀 BOOST if matches slug
                        if (rawgSlug && itadName.includes(rawgSlug)) {
                            score += 10;
                        }

                        // 🚀 Slight penalty for too long titles (often bundles/DLC)
                        if (itadName.length > rawgName.length * 1.5) {
                            score -= 5;
                        }

                        if (score > bestScore) {
                            bestScore = score;
                            bestMatch = g;
                        }
                    }

                    // 🎯 Threshold
                    const MATCH_THRESHOLD = 65;

                    let selectedGame = null;

                    if (bestMatch && bestScore >= MATCH_THRESHOLD) {
                        console.log(`Best ITAD match: ${bestMatch.title} (${bestScore})`);
                        selectedGame = bestMatch;
                    } else {
                        console.log(`No strong match for: ${data.name} → ignoring ITAD deals`);
                        selectedGame = null;
                    }

                    if (selectedGame) {

                        // 💰 Fetch prices
                        const pricesRes = await axiosClient.post(
                            "https://api.isthereanydeal.com/games/prices/v3",
                            [selectedGame.id],
                            {
                                params: {
                                    key: ITAD_API_KEY,
                                    country: "US"
                                }
                            }
                        );

                        if (pricesRes.data?.length > 0) {
                            const priceData = pricesRes.data[0];

                            // 📉 History Low
                            if (priceData.historyLow) {
                                gameProfile.historyLow = {
                                    all: priceData.historyLow.all?.amount ?? null,
                                    y1: priceData.historyLow.y1?.amount ?? null,
                                    m3: priceData.historyLow.m3?.amount ?? null,
                                };
                            }

                            // 🏷 Deals (with filtering)
                            if (priceData.deals?.length > 0) {
                                gameProfile.deals = priceData.deals.map(deal => ({
                                    store: deal.shop?.name || "Unknown",
                                    price: deal.price?.amount ?? null,
                                    storeLow: deal.storeLow?.amount ?? null,
                                    url: deal.url
                                }));
                            }
                        }
                    }
                }
            }
        } catch (itadErr) {
            console.error("ITAD fetch failed:", itadErr.message);
        }

        // ── Store full profile in cache ───────────────────────────────────────
        await cacheSet(cacheKey, gameProfile, TTL_GAME_DETAILS);

        return res.json(gameProfile);

    } catch (error) {
        console.error('Error fetching game details:', error.message);
        const err = new Error('Failed to fetch game details from RAWG API');
        err.status = 500;
        next(err);
    }
};


// @desc  get landing page game images
// @route  GET /games/landingpage
export const getLandingPageImages = async (req, res, next) => {
    // ── Cache check ───────────────────────────────────────────────────────────
    const cacheKey = 'game:landingpage';
    const cached = await cacheGet(cacheKey);
    if (cached) return res.status(200).json(cached);

    try {
        const response = await axiosClient.get(`https://api.rawg.io/api/games`, {
            params: {
                ordering: '-added',
                page_size: 20,
                key: RAWG_API_KEY
            }
        });
        const results = response.data.results;
        await cacheSet(cacheKey, results, TTL_LANDING_PAGE);
        res.status(200).json(results);
    }
    catch (error) {
        const err = new Error('Failed to fetch game images from the server');
        next(err);
    }
}

// @desc  Search for games
// @route  GET /games/search
export const searchGames = async (req, res, next) => {
    const query = req.query.q;

    if (!query || query.trim() === '') {
        return res.status(200).json([]); // Return empty list if no query
    }

    // ── Cache check ───────────────────────────────────────────────────────────
    const cacheKey = `game:search:${query.trim().toLowerCase()}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.status(200).json(cached);

    try {
        console.log(`Searching for games with query: ${query}`);
        const response = await axiosClient.get(`https://api.rawg.io/api/games?search=${query}&key=${RAWG_API_KEY}&page_size=20`);

        if (response.status === 200) {
            const results = response.data.results.map(game => ({
                id: game.id,
                name: game.name,
                image: game.background_image,
                rating: game.rating,
                genres: game.genres?.map(g => g.name) || [],
                released: game.released ? game.released.split('-')[0] : 'N/A'
            }));
            await cacheSet(cacheKey, results, TTL_SEARCH);
            res.status(200).json(results);
        } else {
            next(new Error('Failed to fetch search results from RAWG'));
        }
    } catch (error) {
        console.error('Search error:', error.message);
        next(new Error('Error searching for games'));
    }
};