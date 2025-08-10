import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';


dotenv.config();

const router = express.Router();

router.get('/topselling', async (req, res) => 
{
    try 
    {
        const response = await axios.get('https://store.steampowered.com/api/featuredcategories');
        const formattedGames = response.data.top_sellers.items.map((game) => [
            game.header_image,
            `/games/${encodeURIComponent(game.name)}`,
        ]);
        
        res.status(200).json(formattedGames);
    } 
    catch (error) 
    {
        console.log('Error fetching top sellers:', error.message);
        res.status(500).json({ error: 'Failed to fetch top-selling games' });
    }
});

const gameImages = [
    [
        "https://i.pinimg.com/736x/25/68/01/256801b2f79a64c4fb33bdd82151b52d.jpg",
        `/${encodeURIComponent("Red Dead Redemption 2")}`
    ],
    [
        "https://4kwallpapers.com/images/wallpapers/marvels-spider-man-1080x1920-11609.jpeg",
        `/${encodeURIComponent("Marvel's Spider-Man 2")}`
    ],
    [
        "https://pbs.twimg.com/media/DXoWn1TUQAAgfQn.jpg",
        `/${encodeURIComponent("God of War Ragnarok")}`
    ],
    [
        "https://upload.wikimedia.org/wikipedia/en/2/2f/Forza_7_art.jpg",
        `/${encodeURIComponent("Forza Motorsport 7")}`
    ],
    [
        "https://m.media-amazon.com/images/I/61BlQmnK8XS._UF894,1000_QL80_.jpg",
        `/${encodeURIComponent("Rainbow Six Siege")}`
    ],
    [
        "https://cdna.artstation.com/p/assets/images/images/043/897/516/large/seed-seven-twodots-seedseven-eldenring-1.jpg?1638544010",
        `/${encodeURIComponent("Elden Ring")}`
    ],
    [
        "https://media.printler.com/media/photo/152784.jpg?rmode=crop&width=725&height=1024",
        `/${encodeURIComponent("Cyberpunk 2077")}`
    ],
    [
        "https://i.pinimg.com/736x/5d/8a/41/5d8a41501af6aab5d2e754de44f58834.jpg",
        `/${encodeURIComponent("The Witcher 3: Wild Hunt")}`
    ],
    [
        "https://m.media-amazon.com/images/M/MV5BNjJiNTFhY2QtNzZkYi00MDNiLWEzNGEtNWE1NzBkOWIxNmY5XkEyXkFqcGc@._V1_.jpg",
        `/${encodeURIComponent("God of War (2018)")}`
    ],
    [
        "https://m.media-amazon.com/images/I/61nNH31Cy5L.jpg",
        `/${encodeURIComponent("Resident Evil 4 Remake")}`
    ],
    [
        "https://media.diy.com/is/image/KingfisherDigital/assassin-s-creed-valhalla-game-art-61-x-91-5cm-maxi-poster~5028486484577_01c_MP?$MOB_PREV$&$width=1200&$height=1200",
        `/${encodeURIComponent("Assassin's Creed Valhalla")}`
    ],
    [
        "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/35271885-b64b-49da-b43d-e9aa8fa4d471/dg0902e-78d7be0c-bc6c-4f78-bb72-1143cf69c24b.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzM1MjcxODg1LWI2NGItNDlkYS1iNDNkLWU5YWE4ZmE0ZDQ3MVwvZGcwOTAyZS03OGQ3YmUwYy1iYzZjLTRmNzgtYmI3Mi0xMTQzY2Y2OWMyNGIuanBnIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.bC10_Q7aNxPHoMEMjB_nsG9N0rwQAXslGfPPTKb-sqY",
        `/${encodeURIComponent("Starfield")}`
    ],
    [
        "https://m.media-amazon.com/images/I/81A9m2D-mVL._UF894,1000_QL80_.jpg",
        `/${encodeURIComponent("Hogwarts Legacy")}`
    ],
    [
        "https://cdn2.steamgriddb.com/thumb/4b3dd8900b9635955aeefd0d8e5e3da5.jpg",
        `/${encodeURIComponent("Monster Hunter: World")}`
    ],
    [
        "https://upload.wikimedia.org/wikipedia/en/6/6e/Sekiro_art.jpg",
        `/${encodeURIComponent("Sekiro: Shadows Die Twice")}`
    ]
];

router.get('/landingpage', async (req, res) => 
{
    try 
    {
        res.status(200).json(gameImages);
    } 
    catch (error) 
    {
        console.log('Error fetching top sellers:', error.message);
        res.status(500).json({ error: 'Failed to fetch top-selling games' });
    }
});

router .get('/:gameName', async (req, res) => 
{
    const gameName = req.params.gameName;
    const response = await axious.get(`https://api.rawg.io/api/games?${gameName}&key=${process.env.RAWG_API_KEY}`); 
    if (response.status === 200) 
    {
        return res.status(200).json(response.data);
    } 
    else 
    {
        return res.status(response.status).json({ error: 'Game not found' });
    }
});

export default router;