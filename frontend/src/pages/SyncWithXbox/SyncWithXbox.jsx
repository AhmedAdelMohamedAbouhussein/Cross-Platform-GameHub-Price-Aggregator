import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Aside from "../../components/Aside/Aside";
import { FaXbox, FaBars, FaExclamationTriangle } from "react-icons/fa";
import { useState } from "react";

const STEPS = [
    {
        num: 1,
        title: "Make sure your Xbox profile is public",
        desc: "Go to Xbox.com → your profile → Privacy & online safety. Set your game & app history to Public so we can read your library.",
        warn: true,
    },
    {
        num: 2,
        title: "Click the button below",
        desc: "You'll be redirected to Microsoft's official login page. Sign in with your Microsoft / Xbox account credentials.",
    },
    {
        num: 3,
        title: "Authorise GameHub",
        desc: "After signing in, Microsoft will ask you to grant GameHub permission to read your profile and game list. Accept to complete the sync.",
    },
    {
        num: 4,
        title: "You're done!",
        desc: "You'll be redirected back and your Xbox library will be imported automatically.",
    },
];

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
                <main className="flex-1 px-4 py-12">
                    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">

                        <div className="flex items-center lg:hidden mb-4">
                            <button
                                onClick={() => setMobileAsideOpen(true)}
                                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-midnight-600 transition-colors"
                            >
                                <FaBars size={20} />
                            </button>
                        </div>

                        {/* Hero card */}
                        <div className="card-surface p-8 text-center space-y-4">
                            <div className="w-20 h-20 rounded-2xl bg-green-900/30 border border-green-500/20 flex items-center justify-center mx-auto">
                                <FaXbox className="text-green-400" size={42} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-text-primary">Connect Xbox</h1>
                                <p className="text-sm text-text-secondary mt-1">Link your Xbox / Microsoft account via OAuth to sync your game library and achievements.</p>
                            </div>
                        </div>

                        {/* Steps */}
                        <div className="card-surface p-6 space-y-5">
                            <h2 className="text-xs font-black uppercase tracking-widest text-text-muted">Before you start</h2>
                            {STEPS.map(s => (
                                <div key={s.num} className="flex gap-4">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${s.warn ? 'bg-amber-500/15 text-amber-400' : 'bg-accent/10 text-accent'}`}>
                                        {s.num}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
                                            {s.title}
                                            {s.warn && <FaExclamationTriangle className="text-amber-400" size={12} />}
                                        </p>
                                        <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Privacy warning */}
                        <div className="flex gap-3 items-start bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                            <FaExclamationTriangle className="text-amber-400 mt-0.5 flex-shrink-0" size={14} />
                            <p className="text-xs text-amber-300 leading-relaxed">
                                <strong>Privacy settings matter.</strong> Xbox's API respects your privacy settings. If your game history is set to "Friends only" or "Private", the sync will complete but your library may appear empty.
                            </p>
                        </div>

                        {/* CTA */}
                        <button
                            onClick={SyncWithxbox}
                            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-3"
                        >
                            <FaXbox size={20} />
                            Connect with Xbox
                        </button>

                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
}

export default SyncWithXbox;