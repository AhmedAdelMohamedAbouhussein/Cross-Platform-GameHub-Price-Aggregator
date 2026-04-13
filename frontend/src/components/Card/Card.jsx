import PropTypes from "prop-types";
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from "react";
import ProgressCircle from "../ProgressCircle/ProgressCircle";
import { FaSteam, FaXbox, FaPlaystation, FaGamepad } from "react-icons/fa";
import { SiEpicgames } from "react-icons/si";

function Card(props) {
    const id = props.id;
    const platform = props.platform?.trim().toLowerCase() || 'unknown';
    const title = props.title;
    const image = props.image?.trim() !== "" && props.image?.trim() !== null
        ? props.image : "https://static.vecteezy.com/system/resources/previews/008/255/804/non_2x/page-not-found-error-404-system-updates-uploading-computing-operation-installation-programs-system-maintenance-gross-sprayed-page-not-found-error-404-isolated-on-white-background-vector.jpg";
    const progress = props.progress || 0;
    const lastPlayed = props.lastPlayed ? new Date(props.lastPlayed).toLocaleDateString() : null;
    const hoursPlayed = props.hoursPlayed;

    const navigate = useNavigate();
    const cardRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.1 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => {
            if (cardRef.current) observer.unobserve(cardRef.current);
        };
    }, []);

    const platformIcon = {
        steam: <FaSteam />,
        epic: <SiEpicgames />,
        xbox: <FaXbox />,
        psn: <FaPlaystation />,
        playstation: <FaPlaystation />,
    };

    const platformGlow = {
        steam: 'group-hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.2)] group-hover:border-blue-500/40',
        epic: 'group-hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.05)] group-hover:border-white/20',
        xbox: 'group-hover:shadow-[0_0_20px_-5px_rgba(34,197,94,0.2)] group-hover:border-green-500/40',
        psn: 'group-hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.2)] group-hover:border-blue-600/40',
        playstation: 'group-hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.2)] group-hover:border-blue-600/40',
    };

    return (
        <div
            ref={cardRef}
            className={`
                group relative h-full flex flex-col bg-midnight-700/40 backdrop-blur-sm rounded-2xl border border-midnight-500/20 overflow-hidden cursor-pointer
                transition-all duration-500 cubic-bezier(0.23, 1, 0.32, 1)
                hover:-translate-y-2 hover:bg-midnight-700/60
                ${platformGlow[platform] || 'group-hover:border-accent/30'}
                shadow-xl shadow-black/20
            `}
            onClick={() => navigate(`/ownedgamedetails?platform=${platform}&id=${id}`)}
        >
            {isVisible ? (
                <>
                    {/* Landscape Image Container */}
                    <div className="relative aspect-video overflow-hidden flex-shrink-0">
                        <img
                            src={image}
                            alt={title + " cover"}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/90 via-midnight-900/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

                        {/* Top Left Badge (Platform) */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-xl bg-midnight-900/60 backdrop-blur-md border border-white/5 text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
                            <span className="text-accent">{platformIcon[platform] || <FaGamepad />}</span>
                            <span>{platform}</span>
                        </div>

                        {/* Progress overlay on hover (Glassmorphism) */}
                        <div className="absolute inset-0 flex items-center justify-center bg-midnight-900/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500">
                            <div className="scale-75 group-hover:scale-90 transition-transform duration-500">
                                <ProgressCircle progress={progress} />
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                            <h3 className="text-sm font-black text-text-primary uppercase tracking-tight line-clamp-2 group-hover:text-accent transition-colors leading-snug">
                                {title}
                            </h3>

                            <div className="space-y-2">
                                {/* Mini Progress Bar */}
                                <div className="h-1 w-full bg-midnight-600/50 rounded-full overflow-hidden text-accent">
                                    <div
                                        className="h-full bg-current transition-all duration-1000 ease-out"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-text-muted">
                                    <span>{progress}% Mastery</span>
                                    {hoursPlayed && <span className="text-text-secondary">{hoursPlayed}</span>}
                                </div>
                            </div>
                        </div>

                        {lastPlayed ? (
                            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[9px] text-text-muted font-black uppercase tracking-tighter">Last Boot</span>
                                <span className="text-[9px] text-text-muted font-medium">{lastPlayed}</span>
                            </div>
                        ) : (
                            <div className="pt-2 border-t border-transparent" />
                        )}
                    </div>
                </>
            ) : (
                <div className="aspect-video flex items-center justify-center bg-midnight-800 animate-pulse h-full">
                    <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}

Card.propTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    image: PropTypes.string,
    platform: PropTypes.string,
    progress: PropTypes.number,
    lastPlayed: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    hoursPlayed: PropTypes.string
};

export default Card;