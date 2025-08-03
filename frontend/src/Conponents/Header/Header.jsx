import styles from "./Header.module.css"; 

function Header() {
    return (
        <header className={styles.stickyHeader}>
            <div className={styles.headerContent}>
                <h1>My GameHub</h1>
                <nav>
                    <ul className={styles.navLinks}>
                        <li><a href="/">Home</a></li>
                        <li><a href="/about">About</a></li>
                        <li><a href="/contact">Contact</a></li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}

export default Header;
