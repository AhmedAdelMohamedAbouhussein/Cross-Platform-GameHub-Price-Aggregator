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

// @desc  Get game details by ID (RAWG)
// @route  GET /games/:id
export const getOneGameDetails = async (req, res, next) => {
    const gameId = req.params.id;

    if (!gameId || gameId.trim() === '') {
        return next(new Error('Game ID is required'));
    }

    console.log(`Received request for game details: ${gameId}`);

    try {
        const { data } = await axios.get(
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
            trailer: null
        };

        // 🎬 Trailer
        try {
            const releaseYear = data.released ? data.released.split('-')[0] : '';
            gameProfile.trailer = await getGameTrailer(`${data.name} official trailer ${releaseYear}`.trim());
        } catch (err) {
            console.error("Trailer fetch failed:", err.message);
        }

        // 💰 ITAD Integration
        try {
            const ITAD_API_KEY = config.iTAD.apiKey;

            if (!ITAD_API_KEY) {
                console.log("No ITAD API key provided");
            } else {
                const searchRes = await axios.get(
                    'https://api.isthereanydeal.com/games/search/v1',
                    {
                        params: {
                            key: ITAD_API_KEY,
                            title: data.name,
                            results: 10
                        }
                    }
                );

                if (searchRes.data?.length > 0) {
                
                    // 🎯 smarter match
                    const bestMatch = searchRes.data.find(g =>
                        g.title.toLowerCase() === data.name.toLowerCase()
                    ) || searchRes.data[0];

                    const itadGameId = bestMatch.id;

                    const pricesRes = await axios.post(
                        'https://api.isthereanydeal.com/games/prices/v3',
                        [itadGameId],
                        {
                            params: {
                                key: ITAD_API_KEY,
                                country: 'US'
                            }
                        }
                    );

                    const priceData = pricesRes.data[0];

                    gameProfile.historyLow = {
                        all: priceData.historyLow.all.amount,
                        y1: priceData.historyLow.y1.amount,
                        m3: priceData.historyLow.m3.amount,
                    };

                    gameProfile.deals = priceData.deals.map(deal => ({
                        store: deal.shop.name,
                        price: deal.price.amount,
                        storeLow: deal.storeLow.amount,
                        url: deal.url
                    }));
                }
            }
        } catch (itadErr) {
            console.error("ITAD fetch failed:", itadErr.message);
        }

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
        console.log(`Searching for games with query: ${query}`);
        const response = await axios.get(`https://api.rawg.io/api/games?search=${query}&key=${RAWG_API_KEY}&page_size=20`);

        if (response.status === 200) {
            const results = response.data.results.map(game => ({
                id: game.id,
                name: game.name,
                image: game.background_image,
                released: game.released,
                rating: game.rating,
                genres: game.genres?.map(g => g.name) || [],
                released: game.released ? game.released.split('-')[0] : 'N/A'
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