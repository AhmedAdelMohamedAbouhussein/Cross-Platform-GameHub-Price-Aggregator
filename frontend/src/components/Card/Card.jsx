import PropTypes from "prop-types";
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from "react";
import ProgressCircle from "../ProgressCircle/ProgressCircle";

function Card(props) {
    const id = props.id;
    const platform = props.platform.trim();
    const title = props.title;
    const image = props.image.trim() !== "" || props.image.trim() !== null
        ? props.image : "https://static.vecteezy.com/system/resources/previews/008/255/804/non_2x/page-not-found-error-404-system-updates-uploading-computing-operation-installation-programs-system-maintenance-graffiti-sprayed-page-not-found-error-404-isolated-on-white-background-vector.jpg";
    const progress = props.progress;
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
            { threshold: 0.2 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => {
            if (cardRef.current) observer.unobserve(cardRef.current);
        };
    }, []);

    const platformColors = {
        steam: 'from-blue-600/20 to-blue-900/20',
        epic: 'from-gray-600/20 to-gray-900/20',
        xbox: 'from-green-600/20 to-green-900/20',
        PSN: 'from-blue-500/20 to-indigo-900/20',
    };

    return (
        <div
            ref={cardRef}
            className="group relative bg-midnight-700 rounded-xl border border-midnight-500/30 overflow-hidden cursor-pointer
                       transition-all duration-300 ease-out
                       hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-1 hover:scale-[1.02]"
            onClick={() => navigate(`/ownedgamedetails?platform=${platform}&id=${id}`)}
        >
            {isVisible ? (
                <>
                    {/* Image */}
                    <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${platformColors[platform] || 'from-midnight-600 to-midnight-800'}`}>
                        <img
                            src={image}
                            alt={title + " cover"}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {/* Platform badge */}
                        <span className="absolute top-2 left-2 badge bg-midnight-900/80 backdrop-blur-sm text-text-secondary text-[10px] uppercase tracking-wider">
                            {platform}
                        </span>

                        {/* Progress overlay on hover */}
                        <div className="absolute inset-0 flex items-center justify-center bg-midnight-900/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <ProgressCircle progress={progress} />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                        <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                            {title}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-text-muted">
                            <span>{progress}% complete</span>
                            {hoursPlayed && <span>{hoursPlayed}</span>}
                        </div>
                        {lastPlayed && (
                            <p className="text-[11px] text-text-muted">Last played: {lastPlayed}</p>
                        )}
                    </div>
                </>
            ) : (
                <div className="aspect-[4/3] flex items-center justify-center bg-midnight-800">
                    <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}

Card.propTypes = {
    title: PropTypes.string.isRequired,
    image: PropTypes.string,
    platform: PropTypes.string,
    progress: PropTypes.number,
    lastPlayed: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
};

export default Card;