import Aside from "../Aside/Aside";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";

import styles from './SyncWithXbox.module.css'

function SyncWithXbox ()
{
    const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;

    const SyncWithxbox = () => {
        window.location.href = `${BACKEND_URL}/sync/xbox`; // full page redirect
    };

    return(
    <div className={styles.container}>
        <Header />
        <div className={styles.body}>
            <Aside/>
            <main className={styles.main}>
                <h1>Connect your Xbox account to sync your games</h1>
                <div className={styles.buttonContainer}>  
                    <button className={styles.button} onClick={SyncWithxbox}>Sync With Xbox</button>
                </div>
            </main>
        </div>
        <Footer />
    </div>
    )
}
export default SyncWithXbox;