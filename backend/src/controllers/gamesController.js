import axios from 'axios';
import gameImages from '../assets/landingPageURLs.js';

// @desc  get topselling games from Steam API
// @roure  Get /games/topselling

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

// @desc  get game details by name
// @route  GET /games/:gameName
export const getGameDetails = async (req, res, next) => 
{
    const gameName = req.params.gameName;
    if (!gameName || gameName.trim() === '') 
    {
        const err = new Error('Game name is required');
        err.status = 400; 
        return next(err);
    }
    try 
    {
        const response = await axios.get(`https://api.rawg.io/api/games?search=${(gameName)}&key=${process.env.RAWG_API_KEY}`)
        
        if (response.status === 200 && response.data.count > 0) 
        {
            res.status(200).json(response.data);
        }
        else 
        {
            const err = new Error('Game not found');
            err.status = 404; 
            next(err);
        }
    } 
    catch (error) 
    {
        const err = new Error('Failed to fetch game details');
        err.status = 500; 
        next(err);
    }
}

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