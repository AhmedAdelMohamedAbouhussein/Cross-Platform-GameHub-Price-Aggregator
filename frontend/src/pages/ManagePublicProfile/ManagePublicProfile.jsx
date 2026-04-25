import { useState, useContext, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Cropper from "react-easy-crop";
import apiClient from "../../utils/apiClient.js";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";
import AuthContext from "../../contexts/AuthContext.jsx";
import getCroppedImg from "../../utils/cropImage";

import { FaArrowLeft, FaImage, FaCheck, FaGamepad, FaLock, FaGlobe, FaUser } from "react-icons/fa";

function ManagePublicProfile() {
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    // Privacy / settings state
    const [allowPublicFriendRequests, setAllowPublicFriendRequests] = useState(user?.allowPublicFriendRequests ?? true);
    const [visibility, setVisibility] = useState(user?.profileVisibility || "public");
    const [visibilitychange, setVisibilitychange] = useState(false);
    const [username, setUsername] = useState(user?.name || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [namechange, setNamechange] = useState(false);
    const [biochange, setBiochange] = useState(false);

    // Profile Picture state
    const [profilePicPreview, setProfilePicPreview] = useState(null);
    const [croppingMode, setCroppingMode] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedArea, setCroppedArea] = useState(null);
    const [croppedBlob, setCroppedBlob] = useState(null);
    const [profilePic, setProfilePic] = useState(null);
    const [imagechange, setImagechange] = useState(false);

    // Background state
    const [profileBackground, setProfileBackground] = useState(user?.profileBackground || null);
    const [bgPreview, setBgPreview] = useState(null);
    const [bgFile, setBgFile] = useState(null);

    // Favorite Games state
    const [favoriteGames, setFavoriteGames] = useState(user?.favoriteGames || []);


    const fetchOwnedGames = async () => {
        const res = await apiClient.post(`/users/ownedgames`, {});
        return res.data.ownedGames;
    };

    // Fetch owned games to select favorites
    const { data: ownedGamesData, isLoading: loadingGames } = useQuery({
        queryKey: ["ownedgames"],
        queryFn: fetchOwnedGames,
        enabled: !!user
    });

    const allGames = [];
    if (ownedGamesData) {
        Object.entries(ownedGamesData).forEach(([platform, gamesObj]) => {
            Object.entries(gamesObj).forEach(([id, game]) => {
                let hoursNum = 0;
                if (game.totalHours) {
                    const match = game.totalHours.match(/(\d+)h/);
                    if (match) hoursNum = parseInt(match[1]);
                }
                allGames.push({ 
                    platform, 
                    gameId: id, 
                    gameName: game.title || game.gameName, 
                    coverImage: game.coverImage,
                    hoursPlayed: hoursNum,
                    progress: game.maxProgress || 0
                });
            });
        });
    }

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicPreview(URL.createObjectURL(file));
            setCroppingMode(true);
        }
    };

    const onCropComplete = useCallback((_, croppedAreaPixels) => {
        setCroppedArea(croppedAreaPixels);
    }, []);

    const handleCropDone = async () => {
        try {
            setLoading(true);
            const blob = await getCroppedImg(profilePicPreview, croppedArea);
            setCroppedBlob(blob);
            setImagechange(true);
            setProfilePic(URL.createObjectURL(blob));
            setCroppingMode(false);
            setProfilePicPreview(null);
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Failed to process image");
        }
        finally {
            setLoading(false);
        }
    };

    const handleBgChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBgPreview(URL.createObjectURL(file));
            setBgFile(file);
        }
    };

    const toggleFavorite = (game) => {
        const exists = favoriteGames.find(g => g.gameId === game.gameId && g.platform === game.platform);
        if (exists) {
            setFavoriteGames(favoriteGames.filter(g => g.gameId !== game.gameId || g.platform !== game.platform));
        } else {
            if (favoriteGames.length >= 4) {
                toast.error("You can only select up to 4 favorite games.");
                return;
            }
            setFavoriteGames([...favoriteGames, game]);
        }
    };

    const saveChanges = async () => {
        setLoading(true);
        try {
            // Upload background if changed
            let updatedBg = profileBackground;
            if (bgFile) {
                const formData = new FormData();
                formData.append("profileBackground", bgFile);
                const res = await apiClient.post(`/setting/profileBackground`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                updatedBg = res.data.profileBackground;
            }

            // Upload profile picture if changed
            if (imagechange && croppedBlob) {
                const formData = new FormData();
                formData.append("profileImage", croppedBlob, "profile.jpg");
                await apiClient.post(`/setting/profileImage`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            }

            // Update settings
            const payload = {
                allowPublicFriendRequests,
                favoriteGames: favoriteGames
            };
            if (namechange) payload.username = username;
            if (biochange) payload.bio = bio;
            if (visibilitychange) payload.visibility = visibility;

            const userRes = await apiClient.post(`/setting/updateProfile`, payload);

            // Update auth context
            setUser(userRes.data.user);

            toast.success("Public profile updated successfully!");
            navigate(`/profile/${encodeURIComponent(user.publicID)}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            {loading && <LoadingScreen />}
            <Header />
            <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">

                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-muted hover:text-white mb-6 text-sm font-bold transition-colors">
                    <FaArrowLeft /> Back
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent border border-accent/20">
                        <FaGlobe size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">Customize Public Profile</h1>
                        <p className="text-text-muted text-sm mt-1">Design how the world sees your gaming identity.</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Basic Info Section */}
                    <div className="card-surface p-6 sm:p-8">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <FaUser className="text-blue-400" /> Basic Info
                        </h2>

                        <div className="space-y-8">
                            <section className="flex flex-col items-center justify-center pb-8 mb-8 border-b border-white/5">
                                {!croppingMode ? (
                                    <div className="flex flex-col items-center gap-4 group">
                                        <div className="relative">
                                            <img
                                                src={profilePic || user?.profilePicture || "https://digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png"}
                                                alt="Profile"
                                                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover ring-4 ring-accent/20 group-hover:ring-accent/50 transition-all duration-500 shadow-2xl"
                                            />
                                            <label 
                                                htmlFor="profilePicUpload" 
                                                className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                                            >
                                                <FaImage className="text-white text-2xl mb-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-300" />
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">Upload Image</span>
                                            </label>
                                            <input type="file" id="profilePicUpload" accept="image/*" onChange={handleProfilePicChange} className="hidden" />
                                        </div>
                                        <p className="text-xs text-text-muted font-bold tracking-wide">Recommended: 400x400px</p>
                                    </div>
                                ) : (
                                    <div className="w-full flex flex-col items-center space-y-6">
                                        <div className="relative w-full aspect-square max-w-sm rounded-3xl overflow-hidden bg-midnight-900 border border-white/10 shadow-2xl">
                                            <Cropper
                                                image={profilePicPreview}
                                                crop={crop}
                                                zoom={zoom}
                                                aspect={1}
                                                cropShape="round"
                                                showGrid={false}
                                                onCropChange={setCrop}
                                                onZoomChange={setZoom}
                                                onCropComplete={onCropComplete}
                                            />
                                        </div>
                                        <div className="flex flex-col items-center w-full max-w-sm gap-5 bg-midnight-800/50 p-5 rounded-2xl border border-white/5">
                                            <div className="w-full space-y-2">
                                                <div className="flex justify-between text-[10px] font-black uppercase text-text-muted tracking-widest">
                                                    <span>Zoom</span>
                                                    <span>{Math.round(zoom * 100)}%</span>
                                                </div>
                                                <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-accent h-1.5 bg-midnight-900 rounded-lg appearance-none cursor-pointer" />
                                            </div>
                                            <div className="flex gap-3 w-full">
                                                <button onClick={handleCropDone} className="btn-primary flex-1 text-xs font-black uppercase tracking-widest py-3">Apply Crop</button>
                                                <button onClick={() => setCroppingMode(false)} className="btn-secondary flex-1 text-xs font-black uppercase tracking-widest py-3">Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>

                            <section className="flex flex-col items-center space-y-3">
                                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider text-center">Display Name</h3>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => { setUsername(e.target.value); setNamechange(true); }}
                                    className="input-field w-full max-w-sm text-center font-bold text-lg"
                                />
                            </section>

                            <section className="flex flex-col items-center space-y-3">
                                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider text-center">Bio</h3>
                                <textarea
                                    value={bio}
                                    onChange={(e) => { setBio(e.target.value); setBiochange(true); }}
                                    className="input-field w-full max-w-lg min-h-[120px] resize-y text-center p-4 leading-relaxed"
                                    placeholder="Tell us about yourself..."
                                    maxLength={300}
                                />
                                <div className="w-full max-w-lg text-right pr-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${bio.length >= 300 ? 'text-red-400' : 'text-text-muted'}`}>
                                        {bio.length} / 300
                                    </span>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Background Selection */}
                    <div className="card-surface p-6 sm:p-8">
                        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                            <FaImage className="text-accent" /> Profile Background
                        </h2>
                        <p className="text-xs text-text-muted mb-6">Upload a high-resolution wallpaper to display behind your profile.</p>

                        <div className="relative w-full aspect-[21/9] sm:aspect-[16/9] max-h-[300px] rounded-2xl overflow-hidden bg-midnight-900 border-2 border-dashed border-white/10 group flex items-center justify-center">
                            {(bgPreview || profileBackground) ? (
                                <img src={bgPreview || profileBackground} alt="Background Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                            ) : (
                                <div className="text-center text-text-muted group-hover:text-white transition-colors">
                                    <FaImage className="text-4xl mx-auto mb-2 opacity-50" />
                                    <p className="text-sm font-bold">Click to Upload Wallpaper</p>
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleBgChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        </div>
                    </div>

                    {/* Privacy Settings */}
                    <div className="card-surface p-6 sm:p-8">
                        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                            <FaLock className="text-emerald-400" /> Privacy & Interaction
                        </h2>
                        <p className="text-xs text-text-muted mb-6">Control who can see your profile and interact with you.</p>

                        <div className="space-y-6">
                            <section className="space-y-2">
                                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Profile Visibility</h3>
                                <select
                                    value={visibility}
                                    onChange={(e) => { setVisibility(e.target.value); setVisibilitychange(true); }}
                                    className="input-field w-full max-w-md"
                                >
                                    <option value="public">Public</option>
                                    <option value="private">Private</option>
                                </select>
                            </section>

                            <label className="flex items-center justify-between p-4 rounded-2xl bg-midnight-800/50 border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                                <div>
                                    <h3 className="text-sm font-bold text-white">Allow Friend Requests</h3>
                                    <p className="text-[10px] text-text-muted mt-1">If disabled, the "Add Friend" button will be hidden from the public.</p>
                                </div>
                                <div className="relative inline-block w-12 h-6 rounded-full bg-midnight-900 border border-white/10">
                                    <input type="checkbox" className="sr-only peer" checked={allowPublicFriendRequests} onChange={(e) => setAllowPublicFriendRequests(e.target.checked)} />
                                    <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-text-muted peer-checked:bg-accent peer-checked:translate-x-6 transition-all duration-300"></span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Favorite Games Picker */}
                    <div className="card-surface p-6 sm:p-8">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                    <FaGamepad className="text-purple-400" /> Favorite Games
                                </h2>
                                <p className="text-xs text-text-muted">Select up to 4 games to highlight at the very top of your profile.</p>
                            </div>
                            <span className="text-xs font-black px-3 py-1 bg-midnight-800 rounded-lg border border-white/5 text-accent">{favoriteGames.length} / 4</span>
                        </div>

                        {loadingGames ? (
                            <div className="py-10 text-center text-text-muted"><LoadingScreen /></div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-h-[500px] overflow-y-auto custom-scrollbar p-4">
                                {allGames.map((game, idx) => {
                                    const isSelected = favoriteGames.some(g => g.gameId === game.gameId && g.platform === game.platform);
                                    return (
                                        <div
                                            key={`${game.platform}-${game.gameId}-${idx}`}
                                            onClick={() => toggleFavorite(game)}
                                            className={`relative aspect-video rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${isSelected ? 'ring-4 ring-accent scale-95 shadow-xl' : 'hover:scale-105 hover:ring-2 hover:ring-white/20'}`}
                                        >
                                            <img src={game.coverImage || "/placeholder-game.jpg"} alt={game.gameName} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-midnight-900 to-transparent opacity-80" />
                                            <p className="absolute bottom-2 left-2 right-2 text-[10px] font-bold text-white truncate drop-shadow">{game.gameName}</p>

                                            {isSelected && (
                                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white shadow-lg">
                                                    <FaCheck size={10} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button onClick={saveChanges} className="btn-primary px-10 py-3 text-sm">Save & Preview Profile</button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default ManagePublicProfile;
