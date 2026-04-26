import rateLimit from 'express-rate-limit';

// Global rate limiter
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per window
    message: { message: "Too many requests from this IP, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth rate limiter for brute-force protection
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 login/signup requests per window
    message: { message: "Too many authentication attempts from this IP, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
});

export const syncLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // Limit each IP to 10 requests per `window` (here, per 5 minutes)
    message: { message: "Too many sync attempts from this IP, please try again after 5 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
});
