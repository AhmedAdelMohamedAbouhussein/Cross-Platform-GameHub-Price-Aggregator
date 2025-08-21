import styles from "./LoadingScreen.module.css";

export default function LoadingScreen() 
{
    return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <h2 className={styles.title}>My GameHub</h2>
            <p className={styles.subtitle}>Loading your game universe...</p>
        </div>
    );
}
