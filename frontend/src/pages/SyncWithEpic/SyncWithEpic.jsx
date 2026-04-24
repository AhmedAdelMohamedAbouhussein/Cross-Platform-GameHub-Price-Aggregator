import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Aside from "../../components/Aside/Aside";
import { SiEpicgames } from "react-icons/si";
import { FaBars, FaExclamationTriangle } from "react-icons/fa";
import { useState } from "react";

const STEPS = [
    {
        num: 1,
        title: "Click the button below",
        desc: "You'll be redirected to Epic Games' official login page. Sign in with your Epic account credentials.",
    },
    {
        num: 2,
        title: "Authorise GameHub",
        desc: "Epic will show a permission screen asking you to allow GameHub to read your profile. Click Accept / Authorise.",
    },
    {
        num: 3,
        title: "You're done!",
        desc: "You'll be redirected back to GameHub and your Epic library will sync automatically.",
    },
];

const NOTES = [
    "Epic Games uses OAuth 2.0 — we never see or store your password.",
    "Only games in your Epic library are imported. Free games claimed via the Epic Store are included.",
    "If you linked your Epic account to an external provider (Google, Facebook, etc.), use that same login.",
];

function SyncWithEpic() {
    const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
    const [mobileAsideOpen, setMobileAsideOpen] = useState(false);

    const syncwithepic = () => {
        window.location.href = `${BACKEND_URL}/api/sync/epic`;
    };

    return (
        <div className="page-container">
            <Header />
            <div className="flex-1 flex">
                <Aside />
                <Aside isOpen={mobileAsideOpen} onClose={() => setMobileAsideOpen(false)} />
                <main className="flex-1 px-4 py-12">
                    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">

                        {/* Hero card */}
                        <div className="card-surface p-8 text-center space-y-4">
                            <div className="w-20 h-20 rounded-2xl bg-gray-800/60 border border-white/10 flex items-center justify-center mx-auto">
                                <SiEpicgames className="text-gray-200" size={42} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-text-primary">Connect Epic Games</h1>
                                <p className="text-sm text-text-secondary mt-1">Link your Epic Games account via OAuth to sync your game library including all free claimed titles.</p>
                            </div>
                        </div>

                        {/* Steps */}
                        <div className="card-surface p-6 space-y-5">
                            <h2 className="text-xs font-black uppercase tracking-widest text-text-muted">How it works</h2>
                            {STEPS.map(s => (
                                <div key={s.num} className="flex gap-4">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm bg-accent/10 text-accent">
                                        {s.num}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary">{s.title}</p>
                                        <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Notes */}
                        <div className="card-surface p-5 space-y-3">
                            <h2 className="text-xs font-black uppercase tracking-widest text-text-muted">Good to know</h2>
                            <ul className="space-y-2">
                                {NOTES.map((note, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-text-muted leading-relaxed">
                                        <span className="text-accent mt-0.5 flex-shrink-0">•</span>
                                        {note}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* CTA */}
                        <button
                            onClick={syncwithepic}
                            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-3"
                        >
                            <SiEpicgames size={20} />
                            Connect with Epic Games
                        </button>

                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
}

export default SyncWithEpic;