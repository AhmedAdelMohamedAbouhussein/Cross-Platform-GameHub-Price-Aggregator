import axios from 'axios';
import gameImages from '../assets/landingPageURLs.js';
import config from "../config/env.js";
import { getGameTrailer } from "../config/youtube.js";

const RAWG_API_KEY = config.RAWG_API_KEY;

const formatRequirements = (req) => {
    if (!req) return null;
    return req
        // Strip common international labels for Minimum/Recommended
        .replace(/(?:Minimum|Recommended|Mínimo|Recomendados|Recomendado|Configuration minimale|Configuration recommandée|Mindestanforderungen|Empfohlen|システム要件|最低|推奨|Минимальные требования|Рекомендуемые требования|Requisiti minimi|Requisiti consigliati):/gi, '')
        .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newlines
        .replace(/<[^>]*>/g, '')      // Strip any other HTML tags
        .trim();
};

// @desc  get topselling games from Steam API
// @route  Get /games/topselling

export const getTopSellers = async (req, res, next) => {
    try {
        const response = await axios.get('https://store.steampowered.com/api/featuredcategories');

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

// @desc  Get game details by name
// @route  GET /games/:gameName
export const getOneGameDetails = async (req, res, next) => {
    const gameName = req.params.gameName;

    if (!gameName || gameName.trim() === '') {
        return next(new Error('Game name is required'));
    }

    try {
        const PREFERRED = ["Steam", "Epic Games", "PlayStation Store", "Microsoft Store", "Xbox Store", "Nintendo Store", "EA App (Origin)"];

        const response = await axios.get(`https://api.rawg.io/api/games?search=${gameName}&key=${RAWG_API_KEY}&search_precise=true`);

        if (response.status === 200 && response.data.count > 0) {
            // Heuristic: Find a game that has preferred stores (Steam, Epic, etc.) 
            // and preferably is a 'primary' record (no localized suffixes in slug if obvious)
            const firstGame = response.data.results.find(game =>
                game.stores?.some(s => PREFERRED.includes(s.store.name)) &&
                !game.slug.includes('-jp') && !game.slug.includes('-cn')
            ) || response.data.results.find(game => game.stores?.some(s => PREFERRED.includes(s.store.name)))
                || response.data.results[0];

            console.log("Selected game:", firstGame.id);
            if (!firstGame) {
                return next(new Error('Game not found'));
            }

            // Fetch the full details for this specific game
            const detailResponse = await axios.get(`https://api.rawg.io/api/games/${firstGame.id}?key=${RAWG_API_KEY}`);
            const details = detailResponse.data;
            console.log(details.platforms);

            // Extract preferred stores with their direct purchase URLs
            const formattedStores = details.stores
                ?.filter(s => PREFERRED.includes(s.store.name))
                .map(s => ({
                    name: s.store.name,
                    url: s.url
                })) || [];

            const gameProfile = {
                id: details.id,
                name: details.name,
                description: details.description_raw || "No description available.",
                minimumreq: formatRequirements(details.platforms?.find(p => p.platform.slug === "pc")?.requirements?.minimum),
                recommendedreq: formatRequirements(details.platforms?.find(p => p.platform.slug === "pc")?.requirements?.recommended),
                released: details.released,
                image: details.background_image,
                metacritic: details.metacritic,
                playtime: details.playtime,
                developers: details.developers?.map(d => d.name) || [],
                publishers: details.publishers?.map(p => p.name) || [],
                genres: details.genres?.map(g => g.name) || [],
                stores: formattedStores,
                historyLow: null,
                deals: null,
                trailer: null
            };

            // --- YouTube Integration ---
            try {
                const trailer = await getGameTrailer(details.name);
                gameProfile.trailer = trailer;
            }
            catch (err) {
                console.error("YouTube fetch failed:", err.message);
            }

            // --- ITAD Integration ---
            try {
                const ITAD_API_KEY = config.iTAD.apiKey;

                if (!ITAD_API_KEY) {
                    console.log("No ITAD API key provided");
                    return;
                }

                // 1️⃣ SEARCH for game ID
                const searchRes = await axios.get(
                    'https://api.isthereanydeal.com/games/search/v1',
                    {
                        params: {
                            key: ITAD_API_KEY,
                            title: details.name,
                            results: 1
                        }
                    }
                );

                if (!searchRes.data || searchRes.data.length === 0) {
                    console.log("No game found for:", details.name);
                    return;
                }

                const gameId = searchRes.data[0].id;

                // 2️⃣ GET PRICES (POST)
                const pricesRes = await axios.post(
                    'https://api.isthereanydeal.com/games/prices/v3',
                    [gameId], // MUST be array
                    {
                        params: {
                            key: ITAD_API_KEY,
                            country: 'US',
                            //deals: true
                        }
                    }
                );

                gameProfile.historyLow = {
                    all: pricesRes.data[0].historyLow.all.amount,
                    y1: pricesRes.data[0].historyLow.y1.amount,
                    m3: pricesRes.data[0].historyLow.m3.amount,
                };

                gameProfile.deals = pricesRes.data[0].deals.map(deal => ({
                    store: deal.shop.name,
                    price: deal.price.amount,
                    storeLow: deal.storeLow.amount,
                    url: deal.url
                }));

            } catch (itadErr) {
                console.error("ITAD fetch failed:", itadErr.message);
            }

            return res.json(gameProfile);
        }
        else {
            return next(new Error('Game not found'));
        }
    }
    catch (error) {
        return next(new Error('Failed to fetch game details'));
    }
};


// @desc  get landing page game images
// @route  GET /games/landingpage
export const getLandingPageImages = async (req, res, next) => {
    try {
        res.status(200).json(gameImages);
    }
    catch (error) {
        const err = new Error('Failed to fetch game images from the server');
        next(err); // Pass the error to the error handler
    }
}

// @desc  Search for games
// @route  GET /games/search
export const searchGames = async (req, res, next) => {
    const query = req.query.q;

    if (!query || query.trim() === '') {
        return res.status(200).json([]); // Return empty list if no query
    }

    try {
        const response = await axios.get(`https://api.rawg.io/api/games?search=${encodeURIComponent(query)}&key=${RAWG_API_KEY}&page_size=20`);

        if (response.status === 200) {
            const results = response.data.results.map(game => ({
                id: game.id,
                name: game.name,
                image: game.background_image,
                released: game.released,
                rating: game.rating,
                genres: game.genres?.map(g => g.name) || []
            }));
            res.status(200).json(results);
        } else {
            next(new Error('Failed to fetch search results from RAWG'));
        }
    } catch (error) {
        console.error('Search error:', error.message);
        next(new Error('Error searching for games'));
    }
};