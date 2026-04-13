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
import { FaUser, FaShieldAlt, FaLock, FaExclamationTriangle } from "react-icons/fa";

function SettingsPage() {
    const { user } = useContext(AuthContext);
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

    // flags
    const [imagechange, setImagechange] = useState(null);
    const [namechange, setNamechange] = useState(null);
    const [biochange, setBiochange] = useState(null);
    const [profileVisibilitychange, setProfileVisibility] = useState(null);

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
            if (biochange && bio) payload.bio = bio;
            if (namechange && username) payload.username = username;
            if (profileVisibilitychange && profileVisibilitychange) payload.visibility = visibility;

            if (Object.keys(payload).length > 0) {
                await apiClient.post(`/setting/updateProfile`, payload);
            }

            setImagechange(false);
            setNamechange(false);
            setBiochange(false);
            setProfileVisibility(false);
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
        setProfilePic(user.profilePicture || null);
        setUsername(user.name || "PlayerOne");
        setBio(user.bio || "");
        setVisibility(user.visibility || "friends");
        setProfilePicPreview(null);
        setCroppingMode(false);
        setCroppedBlob(null);
        setImagechange(false);
        setBiochange(false);
        setProfileVisibility(false);
        setNamechange(false);
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

    const handleCropCancel = () => {
        setCroppingMode(false);
        setProfilePicPreview(null);
    };

    const menuItems = [
        { key: "profile", label: "Profile", icon: FaUser },
        { key: "account", label: "Account", icon: FaLock },
        { key: "privacy", label: "Privacy", icon: FaShieldAlt },
        { key: "danger", label: "Danger Zone", icon: FaExclamationTriangle },
    ];

    const renderContent = () => {
        switch (selected) {
            case "profile":
                return (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary mb-1">Profile Settings</h2>
                            <p className="text-sm text-text-muted">Customize how others see you</p>
                        </div>

                        {/* Profile Picture */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Profile Picture</h3>
                            <div className="flex flex-col items-center gap-4">
                                {!croppingMode ? (
                                    <>
                                        <img
                                            src={
                                                profilePic || user.profilePicture ||
                                                "https://digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png"
                                            }
                                            alt="Profile"
                                            className="w-24 h-24 rounded-full object-cover ring-4 ring-accent/20"
                                        />
                                        <div>
                                            <input
                                                type="file"
                                                id="profilePicUpload"
                                                accept="image/*"
                                                onChange={handleProfilePicChange}
                                                className="hidden"
                                            />
                                            <label htmlFor="profilePicUpload" className="btn-secondary cursor-pointer text-sm">
                                                Upload Image
                                            </label>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full space-y-4">
                                        <div className="relative w-full aspect-square max-w-sm mx-auto rounded-xl overflow-hidden bg-midnight-900">
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
                                            <input
                                                type="range"
                                                min={1}
                                                max={3}
                                                step={0.1}
                                                value={zoom}
                                                onChange={(e) => setZoom(Number(e.target.value))}
                                                className="w-full max-w-xs accent-accent"
                                            />
                                            <div className="flex gap-3">
                                                <button onClick={handleCropDone} className="btn-primary text-sm">Done</button>
                                                <button onClick={handleCropCancel} className="btn-danger text-sm">Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Username */}
                        <section className="space-y-2">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Display Name</h3>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    setNamechange(true);
                                }}
                                className="input-field max-w-md"
                            />
                        </section>

                        {/* Bio */}
                        <section className="space-y-2">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Bio</h3>
                            <textarea
                                value={bio}
                                onChange={(e) => {
                                    setBio(e.target.value);
                                    setBiochange(true);
                                }}
                                className="input-field max-w-md min-h-[100px] resize-y"
                                placeholder="Tell us about yourself..."
                            />
                        </section>

                        {/* Social Links */}
                        <section className="space-y-2">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Social Links</h3>
                            <p className="text-xs text-text-muted">Coming soon...</p>
                        </section>
                    </div>
                );

            case "account":
                return (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary mb-1">Account Settings</h2>
                            <p className="text-sm text-text-muted">Manage your email and password</p>
                        </div>

                        <section className="space-y-3">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Change Email</h3>
                            <input type="email" placeholder="New Email" className="input-field max-w-md" />
                            <button className="btn-primary text-sm">Send Verification Link</button>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Change Password</h3>
                            <input type="password" placeholder="Current Password" className="input-field max-w-md" />
                            <input type="password" placeholder="New Password" className="input-field max-w-md" />
                            <input type="password" placeholder="Confirm New Password" className="input-field max-w-md" />
                            <button className="btn-primary text-sm">Update Password</button>
                        </section>
                    </div>
                );

            case "privacy":
                return (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary mb-1">Privacy Settings</h2>
                            <p className="text-sm text-text-muted">Control who can see your profile</p>
                        </div>

                        <section className="space-y-3">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Profile Visibility</h3>
                            <select
                                value={visibility}
                                onChange={(e) => {
                                    setVisibility(e.target.value);
                                    setProfileVisibility(true);
                                }}
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
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-danger mb-1">Danger Zone</h2>
                            <p className="text-sm text-text-muted">Irreversible actions. Proceed with caution.</p>
                        </div>

                        <div className="border border-danger/30 rounded-xl p-6 bg-danger/5 space-y-4">
                            <p className="text-sm text-text-secondary">
                                Once you delete your account, all data will be permanently removed.
                            </p>
                            <button className="btn-danger">Delete Account</button>
                        </div>
                    </div>
                );

            default:
                return <h2 className="text-text-muted">Select an option from the sidebar</h2>;
        }
    };

    return (
        <div className="page-container">
            {loading && <LoadingScreen />}
            <Header />
            <main className="flex-1">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Sidebar / Horizontal tabs on mobile */}
                        <nav className="lg:w-56 flex-shrink-0">
                            <div className="flex lg:flex-col gap-1 p-1 bg-midnight-700 rounded-xl border border-midnight-500/30 overflow-x-auto lg:overflow-visible">
                                {menuItems.map(item => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.key}
                                            onClick={() => setSelected(item.key)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex-1 lg:flex-none ${selected === item.key
                                                    ? item.key === 'danger'
                                                        ? 'bg-danger/10 text-danger'
                                                        : 'bg-accent/10 text-accent'
                                                    : 'text-text-secondary hover:text-text-primary hover:bg-midnight-600'
                                                }`}
                                        >
                                            <Icon size={16} className="flex-shrink-0" />
                                            <span className="hidden sm:inline">{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </nav>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="card-surface p-4 sm:p-6 lg:p-8">
                                {renderContent()}

                                {/* Save bar */}
                                <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-midnight-500/30">
                                    <button onClick={saveAllChanges} className="btn-primary flex-1 sm:flex-none">
                                        Save All Changes
                                    </button>
                                    <button onClick={discardChanges} className="btn-secondary flex-1 sm:flex-none">
                                        Discard Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default SettingsPage;
