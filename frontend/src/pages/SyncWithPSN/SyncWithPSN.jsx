import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import apiClient from "../../utils/apiClient.js";
import Header from "../../components/Header/Header";
import Aside from "../../components/Aside/Aside";
import Footer from "../../components/Footer/Footer";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";
import { SiPlaystation } from "react-icons/si";
import { FaBars } from "react-icons/fa";

function SyncWithPSN() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [mobileAsideOpen, setMobileAsideOpen] = useState(false);

    const sync = () => {
        setLoading(true);
        toast.info("Syncing with PlayStation...");

        const handleMessage = async (event) => {
            if (event.data.type === "NPSSO_RESPONSE") {
                if (event.data.npsso) {
                    try {
                        const npsso = event.data.npsso;
                        await apiClient.post(`/sync/psn`, { npsso });
                        toast.success("PlayStation synced successfully!");
                        navigate("/library");
                    } catch (err) {
                        toast.error("Sync failed");
                        console.error(err.response?.data?.error || err.message);
                    }
                } else {
                    toast.error("NPSSO not found. Please log in to PSN.");
                }
                setLoading(false);
                window.removeEventListener("message", handleMessage);
            }
        };

        window.addEventListener("message", handleMessage);
        window.postMessage({ type: "REQUEST_NPSSO" });
    };

    return (
        <div className="page-container">
            {loading && <LoadingScreen />}
            <Header />
            <div className="flex-1 flex">
                <Aside />
                <Aside isOpen={mobileAsideOpen} onClose={() => setMobileAsideOpen(false)} />
                <main className="flex-1 flex items-center justify-center px-4 py-12">
                    <div className="card-surface p-8 sm:p-12 max-w-md w-full text-center space-y-6 animate-slide-up">
                        <button
                            onClick={() => setMobileAsideOpen(true)}
                            className="lg:hidden absolute top-20 left-4 p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-midnight-600 transition-colors"
                        >
                            <FaBars size={18} />
                        </button>
                        <div className="w-20 h-20 rounded-2xl bg-blue-900/30 flex items-center justify-center mx-auto">
                            <SiPlaystation className="text-blue-300" size={40} />
                        </div>
                        <h1 className="text-2xl font-bold text-text-primary">Connect PlayStation</h1>
                        <p className="text-sm text-text-secondary">
                            Link your PlayStation Network account to sync your game library and trophies.
                        </p>
                        <button
                            onClick={sync}
                            className="btn-primary w-full py-3 text-base"
                            disabled={loading}
                        >
                            Sync With PSN
                        </button>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
}

export default SyncWithPSN;
