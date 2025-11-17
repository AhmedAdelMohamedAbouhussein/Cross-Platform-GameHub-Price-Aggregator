import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import Header from "../../components/Header/Header";
import Aside from "../../components/Aside/Aside";
import Footer from "../../components/Footer/Footer";
import styles from './SyncWithPSN.module.css';

function SyncWithPSN() 
{
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const sync = () => {
        setLoading(true);
        setStatus("Syncing...");

        const handleMessage = async (event) => 
            {
            if (event.data.type === "NPSSO_RESPONSE") 
                {
                if (event.data.npsso) 
                {
                    try 
                    {
                        const npsso = event.data.npsso;
                        await axios.post(`${BACKEND_URL}/sync/psn`, 
                            { npsso }, 
                            {withCredentials: true  // 🔑 so cookies/sessions work 
                        });
                        navigate("/library"); // Redirect to profile on success
                    } 
                    catch (err) 
                    {
                        setStatus("Sync failed");
                        console.error(err.response?.data?.error || err.message);
                        console.log("Failed NPSSO:", event.data.npsso);
                    }
                } 
                else 
                {
                    setStatus("NPSSO not found. Please log in to PSN.");
                }
                setLoading(false);

                // Remove listener after handling the response
                window.removeEventListener("message", handleMessage);
            }
        };

        // Only add listener when user clicks
        window.addEventListener("message", handleMessage);

        // Send request to content script / extension
        window.postMessage({ type: "REQUEST_NPSSO" });
    };

    return (
        <div className={styles.container}>
            <Header />
            <div className={styles.body}>
                <Aside/>
                <main className={styles.main}>
                    <h1>Connect your PlayStation account</h1>
                    <div className={styles.buttonContainer}>
                        <button onClick={sync} className={styles.button} disabled={loading}>
                            {loading ? "Syncing..." : "Sync With PSN"}
                        </button>
                    </div>
                    <p> {status}</p>
                </main>
            </div>
            <Footer />
        </div>
    );
}

export default SyncWithPSN;