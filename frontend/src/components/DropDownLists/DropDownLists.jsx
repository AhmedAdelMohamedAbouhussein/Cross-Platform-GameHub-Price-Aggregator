import React from "react";
import styles from "./DropDownLists.module.css";

function Dropdown({ options = [], value, onChange, label }) {
  return (
    <div className={styles.dropdownContainer}>
      {label && <label className={styles.label}>{label}</label>}
      <select
        className={styles.select}
        value={value}
        onChange={onChange}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default Dropdown;
