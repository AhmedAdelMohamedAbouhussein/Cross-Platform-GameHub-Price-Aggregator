import { useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "../../utils/apiClient.js";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import AuthContext from "../../contexts/AuthContext";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";

import { FaHeart, FaRegHeart, FaUserPlus, FaUserMinus, FaCheck, FaClock, FaGamepad, FaUsers } from "react-icons/fa";

function ViewProfilePage() {
    const { publicID } = useParams();
    const { user: currentUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isLoading, isError } = useQuery({
        queryKey: ["profile", publicID],
        queryFn: async () => {
            const res = await apiClient.get(`/users/profile/${encodeURIComponent(publicID)}`);
            return res.data.profile;
        },
        enabled: !!publicID
    });

    const invalidateProfile = () => {
        queryClient.invalidateQueries({ queryKey: ["profile", publicID] });
    };

    const likeMutation = useMutation({
        mutationFn: () => apiClient.post(`/users/profile/${encodeURIComponent(publicID)}/like`),
        onSuccess: (res) => {
            toast.success(res.data.message);
            invalidateProfile();
        }
    });

    const friendMutation = useMutation({
        mutationFn: ({ action, id }) => apiClient.post(`/friends/${action}/${encodeURIComponent(id)}`, {
            publicID: currentUser.publicID
        }),
        onSuccess: (res) => {
            toast.success(res.data.message);
            invalidateProfile();
            queryClient.invalidateQueries({ queryKey: ["friends"] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Action failed");
        }
    });

    if (isLoading) return <LoadingScreen />;
    if (isError || !data) {
        return (
            <div className="page-container">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <h2 className="text-xl font-bold text-text-primary mb-2">User Not Found</h2>
                    <p className="text-text-muted mb-6">The profile you are looking for doesn't exist or is private.</p>
                    <button onClick={() => navigate("/friends")} className="btn-primary">Back to Friends</button>
                </div>
                <Footer />
            </div>
        );
    }

    const { 
        name, bio, profilePicture, likesCount, isLiked, 
        friendsCount, totalGames, totalHours, topGames, 
        friendshipStatus, profileVisibility 
    } = data;

    const renderFriendButton = () => {
        if (publicID === currentUser?.publicID) return null;

        switch (friendshipStatus) {
            case "accepted":
                return (
                    <button 
                        className="btn-danger flex items-center gap-2"
                        onClick={() => friendMutation.mutate({ action: "remove", id: publicID })}
                    >
                        <FaUserMinus /> Remove Friend
                    </button>
                );
            case "pending":
                return (
                    <button className="btn-ghost flex items-center gap-2 cursor-default" disabled>
                        <FaClock /> Request Pending
                    </button>
                );
            case "requested_by_target":
                return (
                    <div className="flex gap-2">
                        <button 
                            className="btn-primary flex items-center gap-2"
                            onClick={() => friendMutation.mutate({ action: "accept", id: publicID })}
                        >
                            <FaCheck /> Accept
                        </button>
                        <button 
                            className="btn-danger flex items-center gap-2"
                            onClick={() => friendMutation.mutate({ action: "reject", id: publicID })}
                        >
                             Reject
                        </button>
                    </div>
                );
            default:
                return (
                    <button 
                        className="btn-primary flex items-center gap-2"
                        onClick={() => friendMutation.mutate({ action: "add", id: publicID })}
                    >
                        <FaUserPlus /> Add Friend
                    </button>
                );
        }
    };

    return (
        <div className="page-container">
            <Header />
            <main className="flex-1">
                <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
                    
                    {/* Hero Section */}
                    <div className="card-surface p-6 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start gap-8 relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        
                        <div className="relative">
                            <img 
                                src={profilePicture || "https://digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png"} 
                                alt={name}
                                className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl object-cover ring-4 ring-midnight-500 shadow-2xl"
                            />
                        </div>

                        <div className="flex-1 text-center sm:text-left space-y-4">
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">{name}</h1>
                                <p className="text-accent font-medium mt-1">@{publicID}</p>
                            </div>
                            
                            <p className="text-text-secondary leading-relaxed max-w-xl">
                                {bio || "No bio yet. This gamer is a mystery!"}
                            </p>

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
                                <button 
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${isLiked ? 'bg-danger/20 text-danger border border-danger/30' : 'bg-midnight-700 text-text-muted hover:text-text-primary border border-midnight-500/30'}`}
                                    onClick={() => likeMutation.mutate()}
                                >
                                    {isLiked ? <FaHeart className="animate-pulse" /> : <FaRegHeart />}
                                    <span className="font-bold">{likesCount}</span>
                                </button>
                                {renderFriendButton()}
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="card-surface p-6 flex items-center gap-4 border-l-4 border-accent">
                            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                                <FaGamepad size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Total Games</p>
                                <p className="text-2xl font-black text-text-primary">{totalGames}</p>
                            </div>
                        </div>
                        <div className="card-surface p-6 flex items-center gap-4 border-l-4 border-purple-500">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <FaClock size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Playtime</p>
                                <p className="text-2xl font-black text-text-primary">{Math.round(totalHours)}h</p>
                            </div>
                        </div>
                        <div className="card-surface p-6 flex items-center gap-4 border-l-4 border-warning">
                            <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center text-warning">
                                <FaUsers size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Friends</p>
                                <p className="text-2xl font-black text-text-primary">{friendsCount}</p>
                            </div>
                        </div>
                    </div>

                    {/* Top Games Section */}
                    {topGames.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <FaGamepad className="text-accent" /> Top Games
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {topGames.map((game, idx) => (
                                    <div key={idx} className="card-surface overflow-hidden group hover:border-accent/40 transition-all">
                                        <div className="h-32 w-full relative">
                                            <img 
                                                src={game.coverImage || "/placeholder-game.jpg"} 
                                                alt={game.gameName}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-midnight-900 to-transparent"></div>
                                            <div className="absolute bottom-3 left-4">
                                                <p className="text-white font-bold truncate pr-4">{game.gameName}</p>
                                                <p className="text-white/60 text-xs">{game.platform}</p>
                                            </div>
                                        </div>
                                        <div className="p-4 flex justify-between items-center bg-midnight-800">
                                            <div className="text-xs text-text-muted">
                                                {game.hoursPlayed} Hours
                                            </div>
                                            {game.progress > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-midnight-600 rounded-full overflow-hidden">
                                                        <div className="h-full bg-accent" style={{ width: `${game.progress}%` }}></div>
                                                    </div>
                                                    <span className="text-[10px] text-accent font-bold">{game.progress}%</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </main>
            <Footer />
        </div>
    );
}

export default ViewProfilePage;
