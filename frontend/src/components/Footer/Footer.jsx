import styles from "./Footer.module.css";

function Footer() 
{
    return(
        <footer className={styles.footer}>
            <p className={styles.footerContent}> &copy; {new Date().getFullYear()} My GameHub</p>
        </footer>
    );
}
export default Footer;
