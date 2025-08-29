

import Aside from "../../components/Aside/Aside";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

import styles from './SyncWithSteam.module.css'

function SyncWithSteam ()
{
    const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;

const syncwithsteam = () => {
  window.location.href = `${BACKEND_URL}/sync/steam`; // full page redirect
};

    return(
    <div className={styles.container}>
        <Header />
        <div className={styles.body}>
            <Aside/>
            <main className={styles.main}>
                <h1>Connect your Steam account to sync your games</h1>
                <div className={styles.buttonContainer}>  
                    <button onClick={syncwithsteam} className={styles.button}>Sync With steam</button>
                </div>
            </main>
        </div>
        <Footer />
    </div>
    )
}
export default SyncWithSteam;