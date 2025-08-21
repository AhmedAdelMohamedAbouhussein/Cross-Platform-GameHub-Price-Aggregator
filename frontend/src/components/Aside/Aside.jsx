import React from 'react';
import styles from './Aside.module.css';

function Aside (props) 
{
  return (
    <div className={`${styles.aside} ${props.isOpen ? styles.open : styles.closed}`}>
      <div className={styles.sidebarHandle}></div>
      <div className={styles.content}>
        <h2>Aside Content</h2>
        <ul>
          <li>Library</li>
          <li>Browse game prices</li>
          <li>friends</li>
        </ul>
      </div>
    </div>
  );
};

export default Aside;
