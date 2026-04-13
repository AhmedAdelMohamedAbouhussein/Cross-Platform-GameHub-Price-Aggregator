import { useContext, useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from 'react-router-dom';
import apiClient from "../../utils/apiClient.js";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Aside from "../../components/Aside/Aside";
import AuthContext from "../../contexts/AuthContext";

import { FaGamepad, FaSteam, FaXbox, FaSearch, FaUserFriends, FaBars, FaExternalLinkAlt, FaCopy } from "react-icons/fa";
import { SiEpicgames, SiGogdotcom, SiPlaystation } from "react-icons/si";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";
import { toast } from "sonner";

function FriendsPage() {
    const { user } = useContext(AuthContext);
    const [friends, setFriends] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activePlatform, setActivePlatform] = useState("User");
    const [mobileAsideOpen, setMobileAsideOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFriends = async () => {
            setLoading(true);
            try {
                const res = await apiClient.post(`/users/friendlist`, {
                    publicID: user.publicID,
                });

                let allFriends = { ...res.data.friends };

                // Enrich App Friends with full profiles
                const userFriends = await Promise.all(
                    (allFriends.User || []).map(async (friend) => {
                        try {
                            const response = await apiClient.get(`/users/${encodeURIComponent(friend.user)}`);
                            return { ...friend, ...response.data.user };
                        } catch (e) {
                            return friend;
                        }
                    })
                );

                allFriends.User = userFriends;
                setFriends(allFriends);
            } catch (err) {
                console.error("Failed to fetch friends:", err);
                toast.error("Failed to sync friends list");
            } finally {
                setLoading(false);
            }
        };

        if (user?.publicID) fetchFriends();
    }, [user]);

    const platforms = [
        { key: "User", label: "App", icon: FaGamepad, color: "from-blue-500 to-indigo-600" },
        { key: "Steam", label: "Steam", icon: FaSteam, color: "from-slate-700 to-slate-900" },
        { key: "Xbox", label: "Xbox", icon: FaXbox, color: "from-green-600 to-emerald-800" },
        { key: "Epic", label: "Epic", icon: SiEpicgames, color: "from-gray-800 to-black" },
        { key: "PSN", label: "PSN", icon: SiPlaystation, color: "from-blue-600 to-blue-800" },
    ];

    const filteredFriends = useMemo(() => {
        if (!friends || !friends[activePlatform]) return [];

        let list = friends[activePlatform].filter(f => f.status === "accepted" || activePlatform !== "User");

        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            list = list.filter(f => {
                const name = (f.displayName || f.name || f.email || "").toLowerCase();
                return name.includes(query);
            });
        }

        return list;
    }, [friends, activePlatform, searchQuery]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="page-container bg-midnight-900 border-none">
            <Header />
            <div className="flex-1 flex min-h-0">
                <Aside isOpen={mobileAsideOpen} onClose={() => setMobileAsideOpen(false)} />

                <main className="flex-1 overflow-y-auto custom-scrollbar no-scrollbar">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

                        {/* 1. Page Header */}
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 text-accent mb-3">
                                    <button
                                        onClick={() => setMobileAsideOpen(true)}
                                        className="lg:hidden p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-midnight-600 transition-colors"
                                    >
                                        <FaBars size={18} />
                                    </button>
                                    <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20">
                                        <FaUserFriends size={24} />
                                    </div>
                                    <h1 className="text-4xl font-black tracking-tight text-text-primary uppercase slant-2">Social Hub</h1>
                                </div>
                                <p className="text-text-muted text-sm max-w-lg font-medium">
                                    Connect with your gaming circle. Track activity, view profiles, and manage your connections across all platforms.
                                </p>
                            </div>

                            <button
                                onClick={() => navigate("/friends/manage")}
                                className="px-6 py-3 bg-midnight-800/80 hover:bg-midnight-700 text-text-primary text-xs font-black uppercase tracking-widest rounded-2xl border border-white/5 transition-all active:scale-95 flex items-center gap-2 group"
                            >
                                Manage Friends <FaSearch className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        {/* 2. Platform Selector & Search */}
                        <div className="flex flex-col md:flex-row gap-6 items-center bg-midnight-800/30 p-2 rounded-[2rem] border border-white/5 animate-in fade-in duration-700 delay-100">
                            <div className="flex items-center gap-2 flex-1 w-full overflow-x-auto no-scrollbar py-3 px-1">
                                {platforms.map((platform) => {
                                    const Icon = platform.icon;
                                    const active = activePlatform === platform.key;
                                    return (
                                        <button
                                            key={platform.key}
                                            onClick={() => setActivePlatform(platform.key)}
                                            className={`
                                                flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                                                ${active
                                                    ? `bg-gradient-to-br ${platform.color} text-white shadow-lg`
                                                    : 'bg-midnight-800/50 text-text-muted hover:text-text-primary hover:bg-midnight-700'
                                                }
                                            `}
                                        >
                                            <Icon size={14} />
                                            {platform.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="relative w-full md:w-72">
                                <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted text-sm" />
                                <input
                                    type="text"
                                    placeholder="Filter by name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-12 bg-midnight-800/80 rounded-2xl pl-12 pr-5 text-xs font-bold text-text-primary placeholder:text-text-muted border border-transparent focus:border-accent/40 focus:ring-4 focus:ring-accent/10 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* 3. Friends Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                            {filteredFriends.length > 0 ? (
                                filteredFriends.map((friend, index) => {
                                    const name = activePlatform === "User"
                                        ? friend.name || friend.email || "Unknown User"
                                        : friend.displayName || "External Friend";
                                    const avatar = friend.profilePicture || friend.avatar || "https://digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png";

                                    return (
                                        <div
                                            key={index}
                                            className="group relative bg-midnight-800/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 flex items-center gap-5 hover:border-accent/30 hover:bg-midnight-800/60 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            {/* Avatar with Status */}
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-110">
                                                    <img src={avatar} alt={name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-midnight-800 border-2 border-midnight-900 flex items-center justify-center">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-black text-text-primary uppercase tracking-tight truncate group-hover:text-accent transition-colors">
                                                    {name}
                                                </h3>
                                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-0.5">
                                                    {activePlatform === "User" ? `@${friend.publicID}` : `${activePlatform} Network`}
                                                </p>

                                                <div className="flex items-center gap-3 mt-3">
                                                    {activePlatform === "User" ? (
                                                        <Link
                                                            to={`/friends/viewprofile/${encodeURIComponent(friend.publicID)}`}
                                                            className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-[9px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all"
                                                        >
                                                            Profile
                                                        </Link>
                                                    ) : (
                                                        friend.profileUrl && (
                                                            <a
                                                                href={friend.profileUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-[9px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all flex items-center gap-1.5"
                                                            >
                                                                External <FaExternalLinkAlt size={8} />
                                                            </a>
                                                        )
                                                    )}

                                                    <button
                                                        onClick={() => copyToClipboard(friend.publicID || friend.externalId)}
                                                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
                                                        title="Copy ID"
                                                    >
                                                        <FaCopy size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Glow Effect */}
                                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full py-32 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-500">
                                    <div className="w-20 h-20 rounded-3xl bg-midnight-800 border border-white/5 flex items-center justify-center text-4xl shadow-inner">
                                        🤝
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-text-primary uppercase">No Friends Found</h3>
                                        <p className="text-sm text-text-muted font-medium max-w-xs mx-auto">
                                            Try syncronizing your accounts or inviting your friends to build your circle.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { setSearchQuery(""); setActivePlatform("User"); }}
                                        className="text-xs font-black text-accent uppercase tracking-widest hover:underline pt-4"
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
}

export default FriendsPage;
