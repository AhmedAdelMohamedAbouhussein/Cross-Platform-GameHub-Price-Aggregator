import PropTypes from "prop-types";
import Button from "../Buttons/Buttons.jsx";
import styles from './Card.module.css'; // Assuming you have a CSS module for styles

function Card(props) 
{
    const image = props.image.trim() !== "" 
        ? props.image : "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";

    const description = props.description.trim() !== "" 
        ? props.description : "No description available";

    return (
        <div className={styles.card}>
            <img src={image} alt={props.title + " picture"} className={styles.cardImage}></img>
            <h2 className={styles.classTitle}>{props.title}</h2>
            <p className={styles.cardText}>{description}</p>
            <Button buttonName="Add to cart"/>
        </div>
    );
}

Card.propTypes = {
    image: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
};

export default Card;