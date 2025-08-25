import Aside from "../Aside/Aside";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";

import styles from './SyncWithXbox.module.css'

function SyncWithXbox ()
{
    return(
    <div className={styles.container}>
        <Header />
        <div className={styles.body}>
            <Aside/>
            <main className={styles.main}>
                <h1>Connect your Xbox account to sync your games</h1>
                <div className={styles.buttonContainer}>  
                    <button className={styles.button}>Sync With steam</button>
                </div>
            </main>
        </div>
        <Footer />
    </div>
    )
}
export default SyncWithXbox;