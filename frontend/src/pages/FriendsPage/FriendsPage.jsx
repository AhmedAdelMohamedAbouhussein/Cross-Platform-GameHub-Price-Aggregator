import { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import apiClient from "../../utils/apiClient.js";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import AuthContext from "../../contexts/AuthContext";

import { FaGamepad, FaSteam, FaXbox } from "react-icons/fa";
import { SiEpicgames, SiGogdotcom, SiPlaystation } from "react-icons/si";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";

function FriendsPage() {
    const { user } = useContext(AuthContext);
    const [friends, setFriends] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFriends = async () => {
            setLoading(true);
            try {
                const res = await apiClient.post(`/users/friendlist`, {
                    publicID: user.publicID,
                });

                let allFriends = { ...res.data.friends };

                const userFriends = await Promise.all(
                    (allFriends.User || []).map(async (friend) => {
                        const response = await apiClient.get(`/users/${encodeURIComponent(friend.user)}`);
                        return { ...friend, ...response.data.user };
                    })
                );

                allFriends.User = userFriends;
                setFriends(allFriends);
            } catch (err) {
                console.error("Failed to fetch friends:", err);
            } finally {
                setLoading(false);
            }
        };

        if (user?.publicID) fetchFriends();
    }, [user]);

    const platforms = [
        { key: "User", label: "App Friends", icon: FaGamepad, color: "bg-warning" },
        { key: "Steam", label: "Steam Friends", icon: FaSteam, color: "bg-blue-700" },
        { key: "Xbox", label: "Xbox Friends", icon: FaXbox, color: "bg-green-700" },
        { key: "Epic", label: "Epic Games Friends", icon: SiEpicgames, color: "bg-gray-700" },
        { key: "PSN", label: "PlayStation Friends", icon: SiPlaystation, color: "bg-blue-800" },
        { key: "Nintendo", label: "Nintendo Friends", icon: FaGamepad, color: "bg-red-700" },
        { key: "GOG", label: "GOG Friends", icon: SiGogdotcom, color: "bg-purple-700" },
    ];

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="page-container">
            <Header />
            <main className="flex-1">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
                    {platforms.map((platform) => {
                        const Icon = platform.icon;
                        const acceptedFriends = friends?.[platform.key]?.filter(f => f.status === "accepted") || [];

                        return (
                            <div key={platform.key} className="card-surface p-4 sm:p-6 animate-fade-in">
                                {/* Platform header */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl ${platform.color} flex items-center justify-center text-white`}>
                                            <Icon size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-text-primary">{platform.label}</h2>
                                            <p className="text-xs text-text-muted">{acceptedFriends.length} friend{acceptedFriends.length !== 1 ? 's' : ''}</p>
                                        </div>
                                    </div>

                                    {platform.key === "User" && (
                                        <button
                                            className="btn-primary text-sm"
                                            onClick={() => navigate("/managefriends")}
                                        >
                                            Manage Friends
                                        </button>
                                    )}
                                </div>

                                {/* Friends list */}
                                {acceptedFriends.length > 0 ? (
                                    <div className="space-y-2">
                                        {acceptedFriends.map((friend, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-4 px-4 py-3 rounded-lg bg-midnight-800 border border-midnight-500/20 hover:border-midnight-500/40 transition-colors"
                                            >
                                                <img
                                                    src={friend.avatar || friend.profilePicture || "https://digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png"}
                                                    alt={friend.displayName || friend.name || "Friend"}
                                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-midnight-500 flex-shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-text-primary truncate">
                                                        {platform.key === "User"
                                                            ? friend.name || friend.email || "Unknown"
                                                            : friend.displayName || "Unknown"}
                                                    </p>
                                                    {platform.key === "User" ? (
                                                        <p className="text-xs text-text-muted">ID: {friend.publicID}</p>
                                                    ) : (
                                                        friend.externalId && (
                                                            <p className="text-xs text-text-muted">{platform.key} ID: {friend.externalId}</p>
                                                        )
                                                    )}
                                                </div>
                                                {platform.key === "User" ? (
                                                    <Link
                                                        to={`/friends/viewprofile/${friend.publicID}`}
                                                        className="text-xs text-accent hover:text-accent-glow font-medium transition-colors whitespace-nowrap"
                                                    >
                                                        View Profile
                                                    </Link>
                                                ) : (
                                                    friend.profileUrl && (
                                                        <a
                                                            href={friend.profileUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs text-accent hover:text-accent-glow font-medium transition-colors whitespace-nowrap"
                                                        >
                                                            View Profile
                                                        </a>
                                                    )
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-text-muted text-center py-4">No friends on this platform yet</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default FriendsPage;
