import axios from "axios";
import config from "./env.js";
import redisClient from "./redis.js";

const TRAILER_TTL = 3600; // 1 hour

export async function getGameTrailer(gameName) {
    const cacheKey = `yt:trailer:${gameName.toLowerCase().replace(/\s+/g, '_')}`;

    // ── Cache check ──────────────────────────────────────────────────
    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log(`[Cache HIT] ${cacheKey}`);
            return JSON.parse(cached);
        }
    } catch (cacheErr) {
        console.warn("[Cache] Redis GET failed (youtube):", cacheErr.message);
    }

    // ── YouTube API call ─────────────────────────────────────────────
    try {
        const res = await axios.get(
            "https://www.googleapis.com/youtube/v3/search",
            {
                timeout: 10000,
                params: {
                    key: config.google.youtubeApiKey,
                    q: `${gameName} game official trailer`,
                    part: "snippet",
                    maxResults: 1,
                    type: "video"
                }
            }
        );

        const video = res.data?.items?.[0];
        if (!video) return null;

        const result = {
            videoId: video.id.videoId,
            url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
            embedUrl: `https://www.youtube.com/embed/${video.id.videoId}`,
            title: video.snippet.title,
            thumbnail: video.snippet.thumbnails?.high?.url
        };

        // ── Store in cache ───────────────────────────────────────────
        try {
            await redisClient.setEx(cacheKey, TRAILER_TTL, JSON.stringify(result));
            console.log(`[Cache SET] ${cacheKey} (TTL: ${TRAILER_TTL}s)`);
        } catch (cacheErr) {
            console.warn("[Cache] Redis SET failed (youtube):", cacheErr.message);
        }

        return result;
    }
    catch (err) {
        console.error("YouTube fetch failed:", err.message);
        return null;
    }
}