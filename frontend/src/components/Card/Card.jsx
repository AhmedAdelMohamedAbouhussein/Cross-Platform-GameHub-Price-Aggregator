import PropTypes from "prop-types";
import { useNavigate} from 'react-router-dom';
import { useEffect, useRef, useState } from "react";
import styles from './Card.module.css'; // Assuming you have a CSS module for styles

import ProgressCircle from "../ProgressCircle/ProgressCircle";

function Card(props) 
{
    const id = props.id;
    const platform = props.platform.trim();
    const title = props.title;
    const image = props.image.trim() !== "" || props.image.trim() !== null 
        ? props.image : "https://static.vecteezy.com/system/resources/previews/008/255/804/non_2x/page-not-found-error-404-system-updates-uploading-computing-operation-installation-programs-system-maintenance-graffiti-sprayed-page-not-found-error-404-isolated-on-white-background-vector.jpg";
    const progress = props.progress;
    const lastPlayed = props.lastPlayed ? new Date(props.lastPlayed).toLocaleDateString() : null;

    const hoursPlayed = props.hoursPlayed;

    const navigate = useNavigate()
    const cardRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => 
            {
                entries.forEach((entry) => 
                {
                    if (entry.isIntersecting) 
                    {
                        console.log(`Card ${title} is now visible`);
                        setIsVisible(true);
                        observer.disconnect(); // load only once
                    }
                });
            },
            { threshold: 0.2 } // trigger when 20% visible
        );

        if (cardRef.current) {
        observer.observe(cardRef.current);
        }

        return () => {
        if (cardRef.current) observer.unobserve(cardRef.current);
        };
    }, []);


    return (
        <div  ref={cardRef} className={styles.card} onClick={() =>navigate(`/ownedgamedetails?platform=${platform}&id=${id}`)}>
            {isVisible ? (
            <>
                <img src={image} alt={title + " picture"} loading="lazy" className={styles.cardImage}></img>
                <h2 className={styles.classTitle}>{props.title}</h2>
                <p>Bought on: {platform}</p>
                <div className={styles.progressWrapper}>
                    <ProgressCircle progress={progress} />
                </div>
                <div className={styles.defaultOverlay}>
                    <p>Hover to see progress</p>
                </div>
                {props.hoursPlayed ? <p>Total Hours Played: {hoursPlayed}</p> : null}
                {props.lastPlayed ? <p>Last Played on: {lastPlayed}</p> : null }
            </>
            ) : (
                <div className={styles.placeholder}>Loading...</div>
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