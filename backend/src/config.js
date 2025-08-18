import dotenv from 'dotenv';
dotenv.config(); // load env variables once

export default 
{
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    appUrl: process.env.APP_BACKEND_URL,
    mongoLocal: process.env.LOCAL_MONGO_URL,
    mongoAtlas:
    {
        url: process.env.MONGO_ATLAS_URL,
        username: process.env.MONGO_ATLAS_USERNAME,
        password: process.env.MONGO_ATLAS_PASSWORD,
    },
    google: 
    {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    steam: 
    {
        apiKey: process.env.STEAM_API_KEY,
        steamId: process.env.STEAM_ID,
    },
    iTAD: 
    {
        apiKey: process.env.ISTHEREANYDEAL_API_KEY,
        clientId: process.env.ISTHEREANYDEAL_CLIENT_ID,
        clientSecret: process.env.ISTHEREANYDEAL_CLIENT_SECRET,
    },
    rawg: 
    {
        apiKey: process.env.RAWG_API_KEY,
    },
    security: 
    {
        algorithm: process.env.ALGORITHM,
        encryptionKey: process.env.ENCRYPTION_KEY,
        ivLength: parseInt(process.env.IV_LENGTH, 10),
        bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10),
    },
};
