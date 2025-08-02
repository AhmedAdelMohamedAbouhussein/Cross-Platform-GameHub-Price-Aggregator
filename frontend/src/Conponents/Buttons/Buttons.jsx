import PropTypes from "prop-types";
import styles from "./Buttons.module.css"; // Assuming you have a CSS module for styles
function Button(props)
{
    const addToCart = (e) => 
    {
        e.target.textContent = "Added successfully to cart";
        e.target.disabled = true; // Disable the button after adding to cart
    }

    if(props.buttonName === "Add to cart") 
    {
        return(
            <button className={styles.customButton} onClick={ (e) => addToCart(e)}> {props.buttonName}</button>
        );
    }
}


Button.propTypes = 
{
    buttonName: PropTypes.string.isRequired,
};
export default Button;