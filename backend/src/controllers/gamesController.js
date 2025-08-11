import axios from 'axios';
import gameImages from '../assets/landingPageURLs.js';

// @desc  get topselling games from Steam API
// @route  Get /games/topselling

export const getTopSellers = async (req, res, next) => 
{
    try 
    {
        const response = await axios.get('https://store.steampowered.com/api/featuredcategories');
        
        if (response.status === 200) 
        {
            
            if (!response.data || !response.data.top_sellers || !response.data.top_sellers.items) 
            {
                const err = new Error('Top sellers data not found in response');
                err.status = 404; 
                return next(err);
            }
            
            const formattedGames = response.data.top_sellers.items.map((game) => [game.header_image, `/games/${encodeURIComponent(game.name)}`, ]);
            res.status(200).json(formattedGames);
        }
        else 
        {
            const err = new Error('Failed to fetch top selling games from Steam API');
            err.status = response.status;
            next(err); 
        }
    }
    catch (error) 
    {
        const err = new Error('Failed to fetch top selling games from Steam API');
        err.status = 500; 
        next(err); 
    }
};

// @desc  Get game details by name
// @route  GET /games/:gameName
export const getGameDetails = async (req, res, next) => 
{
    const gameName = req.params.gameName;

    if (!gameName || gameName.trim() === '') 
    {
        return next(new Error('Game name is required'));
    }

    try 
    {
        const PREFERRED = ["Steam", "Epic Games", "PlayStation Store", "Microsoft Store", "Xbox Store", "Nintendo Store", "EA App (Origin)"];

        const response = await axios.get(`https://api.rawg.io/api/games?search=${encodeURIComponent(gameName)}&key=${process.env.RAWG_API_KEY}`);

        if (response.status === 200 && response.data.count > 0) 
        {
            const filtered = response.data.results.filter(game => game.stores?.some(s => PREFERRED.includes(s.store.name)))
                .map(game => ({
                    id: game.id,
                    name: game.name,
                    released: game.released,
                    image: game.background_image,
                    stores: game.stores
                ?.filter(s => PREFERRED.includes(s.store.name)).map(s => s.store.name)
                }));

        return res.json(filtered);
        } 
        else 
        {
        return next(new Error('Game not found'));
        }
    } 
    catch (error) 
    {
        return next(new Error('Failed to fetch game details'));
    }
};


// @desc  get landing page game images
// @route  GET /games/landingpage
export const getLandingPageImages = async (req, res, next) => 
{
    try 
    {
        res.status(200).json(gameImages);
    } 
    catch (error) 
    {
        const err = new Error('Failed to fetch game images from the server');
        next(err); // Pass the error to the error handler
    }
}