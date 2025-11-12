import Aside from "../../components/Aside/Aside";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

import styles from './SyncWithEpic.module.css'

function SyncWithEpic ()
{
    const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;

    const syncwithepic = () => {
    window.location.href = `${BACKEND_URL}/sync/epic`; // full page redirect
};

    return(
    <div className={styles.container}>
        <Header />
        <div className={styles.body}>
            <Aside/>
            <main className={styles.main}>
                <h1>Connect your Epic account to sync your games</h1>
                <div className={styles.buttonContainer}>  
                    <button onClick={syncwithepic} className={styles.button}>Sync With Epic</button>
                </div>
            </main>
        </div>
        <Footer />
    </div>
    )
}
export default SyncWithEpic;