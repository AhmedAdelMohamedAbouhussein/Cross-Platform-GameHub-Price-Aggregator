import { useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Cropper from "react-easy-crop";
import apiClient from "../../utils/apiClient.js";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";
import getCroppedImg from "../../utils/cropImage";

import AuthContext from "../../contexts/AuthContext.jsx";
import {
    FaUser, FaShieldAlt, FaLock, FaExclamationTriangle,
    FaLink, FaSteam, FaXbox, FaGamepad, FaTrashAlt, FaPlus
} from "react-icons/fa";
import { SiEpicgames, SiPlaystation } from 'react-icons/si';

function SettingsPage() {
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState("profile");

    // Profile states
    const [profilePic, setProfilePic] = useState(null);
    const [username, setUsername] = useState(user.name);
    const [bio, setBio] = useState(user.bio ? user.bio : "");
    const [visibility, setVisibility] = useState(user.profileVisibility);

    // Profile Picture states
    const [profilePicPreview, setProfilePicPreview] = useState(null);
    const [croppingMode, setCroppingMode] = useState(false);

    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedArea, setCroppedArea] = useState(null);
    const [croppedBlob, setCroppedBlob] = useState(null);

    // Change flags
    const [imagechange, setImagechange] = useState(false);
    const [namechange, setNamechange] = useState(false);
    const [biochange, setBiochange] = useState(false);
    const [profileVisibilitychange, setProfileVisibility] = useState(false);

    // Connections states
    const [npssoModalOpen, setNpssoModalOpen] = useState(false);
    const [npsso, setNpsso] = useState("");

    // Danger zone states
    const [dangerModalOpen, setDangerModalOpen] = useState(false);


    // Soft delete handler
    const handleSoftDelete = async () => {
        try {
            setLoading(true);
            const res = await apiClient.patch("/users/delete/soft");
            if (res.status === 200) {
                toast.success("Account deleted successfully");
                setDangerModalOpen(false);
                setUser(null);
                localStorage.removeItem("user");
                navigate("/");
            }
        } catch (error) {
            console.error("Error deleting account:", error);
            toast.error("Failed to delete account");
            setDangerModalOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const saveAllChanges = async () => {
        setLoading(true);
        try {
            if (imagechange && croppedBlob) {
                const formData = new FormData();
                formData.append("profileImage", croppedBlob, "profile.jpg");
                await apiClient.post(`/setting/profileImage`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            }

            const payload = {};
            if (biochange) payload.bio = bio;
            if (namechange) payload.username = username;
            if (profileVisibilitychange) payload.visibility = visibility;

            if (Object.keys(payload).length > 0) {
                await apiClient.post(`/setting/updateProfile`, payload);
            }

            toast.success("Changes saved successfully!");
            navigate(0);
        }
        catch (error) {
            console.error("Save failed:", error);
            toast.error("Failed to save changes. Try again.");
        }
        finally {
            setLoading(false);
        }
    };

    const discardChanges = () => {
        navigate(0);
    };

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

    const handleDisconnect = async (platform, accountId) => {
        if (!window.confirm(`Are you sure you want to disconnect this ${platform} account?`)) return;
        setLoading(true);
        try {
            await apiClient.delete(`/sync/${platform}/${accountId}`);
            toast.success(`Disconnected ${platform} account successfully`);

            // Update local user state
            const updatedLinked = { ...user.linkedAccounts };
            if (updatedLinked[platform]) {
                updatedLinked[platform] = updatedLinked[platform].filter(acc => acc.accountId !== accountId);
                if (updatedLinked[platform].length === 0) delete updatedLinked[platform];
            }
            setUser({ ...user, linkedAccounts: updatedLinked });
        } catch (error) {
            toast.error("Failed to disconnect account");
        } finally {
            setLoading(false);
        }
    };

    const handlePSNSync = async () => {
        if (!npsso) return toast.error("Please enter your NPSSO");
        setLoading(true);
        try {
            await apiClient.post("/sync/psn", { npsso });
            toast.success("PSN account synced successfully!");
            setNpssoModalOpen(false);
            setNpsso("");
            navigate(0);
        } catch (error) {
            toast.error(error.response?.data?.error || "PSN sync failed");
        } finally {
            setLoading(false);
        }
    };

    const menuItems = [
        { key: "profile", label: "Profile", icon: FaUser },
        { key: "account", label: "Account", icon: FaLock },
        { key: "connections", label: "Connections", icon: FaLink },
        { key: "privacy", label: "Privacy", icon: FaShieldAlt },
        { key: "danger", label: "Danger Zone", icon: FaExclamationTriangle },
    ];

    const renderContent = () => {
        switch (selected) {
            case "profile":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary mb-1">Profile Settings</h2>
                            <p className="text-sm text-text-muted">Customize how others see you</p>
                        </div>

                        <section className="space-y-4">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Profile Picture</h3>
                            <div className="flex flex-col items-center gap-4">
                                {!croppingMode ? (
                                    <>
                                        <img
                                            src={profilePic || user.profilePicture || "https://digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png"}
                                            alt="Profile"
                                            className="w-24 h-24 rounded-full object-cover ring-4 ring-accent/20"
                                        />
                                        <div>
                                            <input type="file" id="profilePicUpload" accept="image/*" onChange={handleProfilePicChange} className="hidden" />
                                            <label htmlFor="profilePicUpload" className="btn-secondary cursor-pointer text-sm">Upload Image</label>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full space-y-4">
                                        <div className="relative w-full aspect-square max-w-sm mx-auto rounded-xl overflow-hidden bg-midnight-900 border border-white/10">
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
                                        <div className="flex flex-col items-center gap-3">
                                            <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full max-w-xs accent-accent" />
                                            <div className="flex gap-3">
                                                <button onClick={handleCropDone} className="btn-primary text-sm px-6">Done</button>
                                                <button onClick={() => setCroppingMode(false)} className="btn-secondary text-sm px-6">Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="space-y-2">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Display Name</h3>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => { setUsername(e.target.value); setNamechange(true); }}
                                className="input-field max-w-md"
                            />
                        </section>

                        <section className="space-y-2">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Bio</h3>
                            <textarea
                                value={bio}
                                onChange={(e) => { setBio(e.target.value); setBiochange(true); }}
                                className="input-field max-w-md min-h-[100px] resize-y"
                                placeholder="Tell us about yourself..."
                            />
                        </section>
                    </div>
                );

            case "account":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary mb-1">Account Settings</h2>
                            <p className="text-sm text-text-muted">Manage your email and security</p>
                        </div>
                        <section className="space-y-3">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Email Address</h3>
                            <input type="email" value={user.email} disabled className="input-field max-w-md opacity-50 cursor-not-allowed" />
                            <p className="text-[10px] text-text-muted italic">Email changes are currently restricted.</p>
                        </section>
                        <section className="space-y-3">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Password</h3>
                            <button className="btn-secondary text-sm">Request Password Reset Email</button>
                        </section>
                    </div>
                );

            case "connections":
                const platforms = [
                    { id: "Steam", name: "Steam", icon: FaSteam, color: "text-[#1b2838]", route: "/api/sync/steam" },
                    { id: "PSN", name: "PlayStation", icon: SiPlaystation, color: "text-[#003087]", type: "modal" },
                    { id: "Xbox", name: "Xbox Live", icon: FaXbox, color: "text-[#107c10]", route: "/api/sync/xbox" },
                    { id: "Epic", name: "Epic Games", icon: SiEpicgames, color: "text-white", route: "/api/sync/epic" },
                ];

                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary mb-1">Connections</h2>
                            <p className="text-sm text-text-muted">Manage your linked gaming accounts</p>
                        </div>

                        <div className="grid gap-6">
                            {platforms.map(platform => {
                                const linked = user.linkedAccounts?.[platform.id] || [];
                                const Icon = platform.icon;

                                return (
                                    <div key={platform.id} className="bg-midnight-700/50 border border-white/5 rounded-2xl p-6 transition-all hover:bg-midnight-700">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl bg-midnight-900 ${platform.color} border border-white/5`}>
                                                    <Icon size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-text-primary">{platform.name}</h3>
                                                    <p className="text-xs text-text-muted">{linked.length} linked</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => platform.type === 'modal' ? setNpssoModalOpen(true) : window.location.href = `${apiClient.defaults.baseURL}${platform.route}`}
                                                className="btn-primary text-xs flex items-center gap-2 px-4"
                                            >
                                                <FaPlus size={10} /> Link New
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {linked.length > 0 ? linked.map(acc => (
                                                <div key={acc.accountId} className="flex items-center justify-between p-3 rounded-xl bg-midnight-900/50 border border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-midnight-800 flex items-center justify-center">
                                                            {acc.avatar ? <img src={acc.avatar} alt="" className="w-full h-full object-cover" /> : <FaGamepad className="text-text-muted" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-text-primary">{acc.displayName || acc.accountId}</p>
                                                            <p className="text-[10px] text-text-muted uppercase tracking-wider">ID: {acc.accountId}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleDisconnect(platform.id, acc.accountId)} className="p-2 text-text-muted hover:text-danger transition-colors">
                                                        <FaTrashAlt size={14} />
                                                    </button>
                                                </div>
                                            )) : (
                                                <p className="text-center py-4 text-[10px] text-text-muted italic bg-midnight-900/20 rounded-xl border border-dashed border-white/5 uppercase tracking-widest">
                                                    No connections
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {npssoModalOpen && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                                <div className="bg-midnight-800 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                                    <h3 className="text-xl font-bold text-text-primary mb-2">Sync PlayStation</h3>
                                    <p className="text-sm text-text-muted mb-6">Enter your 64-character NPSSO code.</p>
                                    <input type="text" placeholder="NPSSO code..." className="input-field mb-6" value={npsso} onChange={(e) => setNpsso(e.target.value)} />
                                    <div className="flex gap-3">
                                        <button onClick={handlePSNSync} className="btn-primary flex-1">Sync</button>
                                        <button onClick={() => setNpssoModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case "privacy":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary mb-1">Privacy</h2>
                            <p className="text-sm text-text-muted">Control your visibility</p>
                        </div>
                        <section className="space-y-3">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Profile Visibility</h3>
                            <select
                                value={visibility}
                                onChange={(e) => { setVisibility(e.target.value); setProfileVisibility(true); }}
                                className="select-field max-w-md"
                            >
                                <option value="public">Public</option>
                                <option value="friends">Friends Only</option>
                                <option value="private">Private</option>
                            </select>
                        </section>
                    </div>
                );

            case "danger":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-xl font-bold text-danger mb-1">Danger Zone</h2>
                            <p className="text-sm text-text-muted">Irreversible actions</p>
                        </div>
                        <div className="border border-danger/30 rounded-2xl p-6 bg-danger/5 space-y-4">
                            <p className="text-sm text-text-secondary">Permanently delete your entire GameHub profile and association with synced accounts?</p>
                            <button className="btn-danger" onClick={() => setDangerModalOpen(true)}>Delete Account</button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="page-container">
            {loading && <LoadingScreen />}
            <Header />
            <main className="flex-1">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar */}
                        <nav className="lg:w-64 flex-shrink-0">
                            <div className="flex lg:flex-col gap-1.5 p-1.5 bg-midnight-700/50 backdrop-blur-xl rounded-2xl border border-white/5 overflow-x-auto lg:overflow-visible">
                                {menuItems.map(item => {
                                    const Icon = item.icon;
                                    const active = selected === item.key;
                                    return (
                                        <button
                                            key={item.key}
                                            onClick={() => setSelected(item.key)}
                                            className={`
                                                flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap flex-1 lg:flex-none
                                                ${active
                                                    ? item.key === 'danger' ? 'bg-danger/20 text-danger shadow-lg shadow-danger/10' : 'bg-accent/10 text-accent shadow-lg shadow-accent/5'
                                                    : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                                                }
                                            `}
                                        >
                                            <Icon size={14} className={active ? '' : 'opacity-50'} />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </nav>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="card-surface p-6 sm:p-10 min-h-[500px] flex flex-col">
                                <div className="flex-1">
                                    {renderContent()}
                                </div>

                                {selected !== 'connections' && (
                                    <div className="flex gap-4 mt-12 pt-8 border-t border-white/5">
                                        <button onClick={saveAllChanges} className="btn-primary px-8">Save Changes</button>
                                        <button onClick={discardChanges} className="btn-secondary px-8">Discard</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            {dangerModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-midnight-800 border border-danger/30 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">

                        <h3 className="text-xl font-bold text-danger mb-2">
                            Delete Account
                        </h3>

                        <p className="text-sm text-text-muted mb-6">
                            This action is permanent and cannot be undone.
                            All your data, games, and connections will be deleted.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={handleSoftDelete}
                                disabled={loading}
                                className="btn-danger flex-1 disabled:opacity-50"
                            >
                                {loading ? "Deleting..." : "Yes, Delete"}
                            </button>

                            <button
                                onClick={() => setDangerModalOpen(false)}
                                className="btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}

export default SettingsPage;
