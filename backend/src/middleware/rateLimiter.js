import rateLimit from 'express-rate-limit';

export const syncLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 510, // Limit each IP to 5 requests per `window` (here, per 5 minutes)
    message: { message: "Too many sync attempts from this IP, please try again after 5 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
});
