import config from '../config/env.js';

const errorHandeler = (err, req, res, next) => 
{
    // If it's a known operational error with a specific status code
    if(err.status)
    {
        return res.status(err.status).json({ message: err.message });
    }
    
    // Handle Multer file size limit error
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: "File is too large. Maximum size is 5MB." });
    }
    
    // For 500 internal server errors, log the actual error but mask it in production
    console.error("Internal Server Error:", err);
    
    const message = config.nodeEnv === 'production' 
        ? "An unexpected internal server error occurred" 
        : err.message;
        
    res.status(500).json({ message });
};

export default errorHandeler;