import axios from "axios";
import config from "./env.js";

export async function getGameTrailer(gameName) {
    try {
        const res = await axios.get(
            "https://www.googleapis.com/youtube/v3/search",
            {
                params: {
                    key: config.google.youtubeApiKey,
                    q: `${gameName} official trailer`,
                    part: "snippet",
                    maxResults: 1,
                    type: "video"
                }
            }
        );

        const video = res.data?.items?.[0];

        if (!video) return null;

        return {
            videoId: video.id.videoId,
            url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
            embedUrl: `https://www.youtube.com/embed/${video.id.videoId}`,
            title: video.snippet.title,
            thumbnail: video.snippet.thumbnails?.high?.url
        };

    } catch (err) {
        console.error("YouTube fetch failed:", err.message);
        return null;
    }
}