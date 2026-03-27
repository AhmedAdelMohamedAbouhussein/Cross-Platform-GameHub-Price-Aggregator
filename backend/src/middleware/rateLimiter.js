import rateLimit from 'express-rate-limit';

export const syncLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per `window` (here, per 15 minutes)
    message: { message: "Too many sync attempts from this IP, please try again after 15 minutes" },
    standardHeaders: true, 
    legacyHeaders: false,
});
