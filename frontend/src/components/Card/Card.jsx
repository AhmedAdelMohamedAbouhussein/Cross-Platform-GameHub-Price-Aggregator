import PropTypes from "prop-types";
import styles from './Card.module.css'; // Assuming you have a CSS module for styles

function Card(props) 
{
    const image = props.image.trim() !== "" 
        ? props.image : "https://static.vecteezy.com/system/resources/previews/008/255/804/non_2x/page-not-found-error-404-system-updates-uploading-computing-operation-installation-programs-system-maintenance-graffiti-sprayed-page-not-found-error-404-isolated-on-white-background-vector.jpg";

    const description = props.description.trim() !== "" 
        ? props.description : "No description available";

    return (
        <div className={styles.card}>
            <img src={image} alt={props.title + " picture"} className={styles.cardImage}></img>
            <h2 className={styles.classTitle}>{props.title}</h2>
            <p className={styles.cardText}>{description}</p>
        </div>
    );
}

Card.propTypes = {
    image: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
};

export default Card;