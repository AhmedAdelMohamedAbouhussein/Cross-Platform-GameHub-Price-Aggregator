import styles from "./Header.module.css"; 
import { Link } from 'react-router-dom';

function Header() {

    return (
        <header className={styles.stickyHeader}>
            <div className={styles.headerContent}>
                <h1>My GameHub</h1>
                <nav>
                    <ul className={styles.navLinks}>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/about">About</Link></li>
                        <li><Link to="/contact ">Contact</Link></li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}

export default Header;
