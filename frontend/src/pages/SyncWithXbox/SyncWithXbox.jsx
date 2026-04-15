import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Aside from "../../components/Aside/Aside";
import { FaXbox, FaBars } from "react-icons/fa";
import { useState } from "react";

function SyncWithXbox() {
    const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
    const [mobileAsideOpen, setMobileAsideOpen] = useState(false);

    const SyncWithxbox = () => {
        window.location.href = `${BACKEND_URL}/api/sync/xbox`;
    };

    return (
        <div className="page-container">
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
                        <div className="w-20 h-20 rounded-2xl bg-green-900/30 flex items-center justify-center mx-auto">
                            <FaXbox className="text-green-400" size={40} />
                        </div>
                        <h1 className="text-2xl font-bold text-text-primary">Connect Xbox</h1>
                        <p className="text-sm text-text-secondary">
                            Link your Xbox account to sync your game library and achievements.
                        </p>
                        <button onClick={SyncWithxbox} className="btn-primary w-full py-3 text-base">
                            Sync With Xbox
                        </button>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
}

export default SyncWithXbox;