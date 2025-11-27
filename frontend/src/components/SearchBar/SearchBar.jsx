import React from "react";
import styles from "./SearchBar.module.css"; // optional CSS for styling

function SearchBar({ value, onChange, placeholder = "Search..." }) {
    return (
        <input
            type="text"
            className={styles.searchInput}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
        />
    );
}

export default SearchBar;
