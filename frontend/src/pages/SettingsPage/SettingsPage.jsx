import { useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import apiClient from "../../utils/apiClient.js";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";

import AuthContext from "../../contexts/AuthContext.jsx";
import { FaUser, FaLock, FaExclamationTriangle, FaLink, FaSteam, FaXbox, FaGamepad, FaTrashAlt, FaPlus } from "react-icons/fa";
import { SiEpicgames, SiPlaystation } from 'react-icons/si';

function SettingsPage() {
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState("profile");

    // Connections states
    // Connections states

    // Danger zone states
    const [isSendingOtp, setIsSendingOtp] = useState(false);

    // Initiates OTP flow for account deletion actions
    const handleInitiateDelete = async (purpose) => {
        setIsSendingOtp(true);
        try {
            if (purpose === "deactivate_account") {
                const res = await apiClient.patch("/users/delete/soft");
                const userId = res.data.userId;
                navigate(`/verify?userId=${userId}&email=${encodeURIComponent(user.email)}&purpose=${purpose}`);
            }
            else if (purpose === "permanently_delete_account") {
                const res = await apiClient.delete("/users/delete/hard");
                const userId = res.data.userId;
                navigate(`/verify?userId=${userId}&email=${encodeURIComponent(user.email)}&purpose=${purpose}`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send verification code. Please try again.");
        } finally {
            setIsSendingOtp(false);
        }
    };



    const handleChangePassword = async () => {
        try {
            setLoading(true);
            const email = user.email;
            const response = await apiClient.post(`/users/getuseridbyemail`, { email });
            const userId = response.data.userId;
            await apiClient.post(`/mail/sendotp`, { userId, email, purpose: "password_reset" });
            toast.success("Password reset code sent to your email");
            navigate(`/verify?userId=${userId}&email=${encodeURIComponent(email)}&purpose=password_reset`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
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


    const menuItems = [
        { key: "profile", label: "Profile", icon: FaUser },
        { key: "account", label: "Account", icon: FaLock },
        { key: "connections", label: "Connections", icon: FaLink },
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
                            <div className="flex items-center justify-between max-w-md bg-midnight-800/50 p-4 rounded-2xl border border-white/5">
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-1">Public Profile Customization</h3>
                                    <p className="text-[10px] text-text-muted">Manage your profile picture, bio, and favorite games.</p>
                                </div>
                                <button
                                    onClick={() => navigate('/manage-profile')}
                                    className="btn-primary text-xs px-4"
                                >
                                    Manage
                                </button>
                            </div>
                        </section>
                    </div>
                );

            case "account":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary mb-1">Account Settings</h2>
                            <p className="text-sm text-text-muted">Manage your security credentials</p>
                        </div>
                        <section className="space-y-3">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Password</h3>
                            <button
                                onClick={handleChangePassword}
                                className="btn-secondary text-sm"
                            >
                                Change Password
                            </button>
                            <p className="text-[10px] text-text-muted italic mt-2">This will send a verification code to your registered email address.</p>
                        </section>
                    </div>
                );

            case "connections":
                const platforms = [
                    { id: "Steam", name: "Steam", icon: FaSteam, color: "text-[#1b2838]", route: "/library/sync/steam" },
                    { id: "PSN", name: "PlayStation", icon: SiPlaystation, color: "text-[#003087]", route: "/library/sync/psn" },
                    { id: "Xbox", name: "Xbox Live", icon: FaXbox, color: "text-[#107c10]", route: "/library/sync/xbox" },
                    { id: "Epic", name: "Epic Games", icon: SiEpicgames, color: "text-white", route: "/library/sync/epic" },
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
                                                onClick={() => navigate(platform.route)}
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


                    </div>
                );

            case "danger":
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-xl font-bold text-danger mb-1">Danger Zone</h2>
                            <p className="text-sm text-text-muted">These actions affect your account permanently. Both require email verification.</p>
                        </div>

                        {/* Deactivate Account Card */}
                        <div className="border border-amber-500/30 rounded-2xl p-6 bg-amber-500/5 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-lg">🌙</span>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-amber-400 text-sm">Deactivate Account</h3>
                                    <p className="text-xs text-text-muted leading-relaxed">
                                        Your profile will be hidden and you will be logged out. You can restore your account within <span className="text-amber-400 font-bold">30 days</span> by logging back in. After 30 days it is permanently deleted.
                                    </p>
                                </div>
                            </div>
                            <button
                                className="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
                                onClick={() => handleInitiateDelete("deactivate_account")}
                                disabled={isSendingOtp}
                            >
                                {isSendingOtp ? "Sending Code..." : "Deactivate Account"}
                            </button>
                        </div>

                        {/* Permanently Delete Card */}
                        <div className="border border-danger/30 rounded-2xl p-6 bg-danger/5 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-lg">💀</span>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-danger text-sm">Permanently Delete Account</h3>
                                    <p className="text-xs text-text-muted leading-relaxed">
                                        All your data, games, friends, and connections will be <span className="text-danger font-bold">immediately and irreversibly destroyed</span>. This cannot be undone.
                                    </p>
                                </div>
                            </div>
                            <button
                                className="w-full py-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-[11px] font-black uppercase tracking-widest hover:bg-danger hover:text-white transition-all active:scale-95 disabled:opacity-50"
                                onClick={() => handleInitiateDelete("permanently_delete_account")}
                                disabled={isSendingOtp}
                            >
                                {isSendingOtp ? "Sending Code..." : "Permanently Delete Account"}
                            </button>
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
