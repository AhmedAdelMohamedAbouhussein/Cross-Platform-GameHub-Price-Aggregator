import { useContext, useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import AuthContext from "../../contexts/AuthContext";
import apiClient from "../../utils/apiClient.js";
import {
    FaCaretLeft, FaCaretRight, FaSteam, FaXbox, FaGamepad,
    FaComments, FaUserFriends, FaCog, FaSignOutAlt, FaChevronDown, FaChevronUp, FaTimes
} from "react-icons/fa";
import { SiEpicgames, SiGogdotcom, SiPlaystation } from 'react-icons/si';

function Aside({ isOpen: externalOpen, onClose }) {
    const { user, setUser } = useContext(AuthContext);
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(true);
    const [isAccountOpen, setIsAccountOpen] = useState(false);

    // Use external open state if provided (for mobile drawer), otherwise internal
    const sidebarOpen = externalOpen !== undefined ? externalOpen : isOpen;

    const toggleSidebar = () => {
        if (externalOpen !== undefined && onClose) {
            onClose();
        } else {
            setIsOpen(!isOpen);
        }
    };

    const handleSidebarClick = () => {
        if (!sidebarOpen && externalOpen === undefined) {
            setIsOpen(true);
        }
    };

    const handleLogout = async () => {
        try {
            const response = await apiClient.post(`/auth/logout`, {});
            toast.success(response.data.message || "Logged out successfully");
            setUser(null);
        } catch (error) {
            toast.error(error.response?.data?.message || "Logout failed");
        }
    };

    const menuItems = [
        { icon: FaGamepad, label: "View Owned Games", to: "/library" },
        { icon: FaComments, label: "Chat with Friends", to: "/friends" },
        { icon: FaUserFriends, label: "Friend List", to: "/friends" },
        { divider: true },
        { icon: FaSteam, label: "Link Steam", to: "/library/sync/steam" },
        { icon: SiEpicgames, label: "Link Epic", to: "/library/sync/epic" },
        { icon: SiPlaystation, label: "Link PSN", to: "/library/sync/psn" },
        { icon: FaXbox, label: "Link Xbox", to: "/library/sync/xbox" },
        { icon: FaGamepad, label: "Link Nintendo", to: "/library/sync/nintendo" },
        { icon: SiGogdotcom, label: "Link GOG", to: "/library/sync/gog" },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <>
            {/* Mobile overlay backdrop */}
            {externalOpen !== undefined && sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`
                    ${externalOpen !== undefined
                        ? `fixed top-0 left-0 z-50 h-full ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
                        : 'relative hidden lg:block'
                    }
                    ${sidebarOpen ? 'w-64' : 'w-20'}
                    bg-midnight-700 border-r border-midnight-500/30
                    transition-all duration-300 ease-out flex-shrink-0
                `}
                onClick={handleSidebarClick}
            >
                <div className="flex flex-col h-full p-4">
                    {/* Top section */}
                    <div className="flex items-center justify-between mb-6">
                        {sidebarOpen && (
                            <div className="flex items-center gap-3 min-w-0">
                                <img
                                    src={user.profilePicture && user.profilePicture.trim() !== ""
                                        ? user.profilePicture
                                        : "https://digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png"}
                                    alt="Profile"
                                    className="w-9 h-9 rounded-full object-cover ring-2 ring-accent/30 flex-shrink-0"
                                />
                                <span className="text-sm font-semibold text-text-primary truncate">{user.name}</span>
                            </div>
                        )}
                        <button
                            onClick={toggleSidebar}
                            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-midnight-600 transition-colors flex-shrink-0"
                        >
                            {externalOpen !== undefined
                                ? <FaTimes size={16} />
                                : sidebarOpen ? <FaCaretLeft /> : <FaCaretRight />
                            }
                        </button>
                    </div>

                    {/* Menu items */}
                    <nav className="flex-1 space-y-1 overflow-y-auto">
                        {sidebarOpen && (
                            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-3 px-3">Menu</p>
                        )}
                        {menuItems.map((item, i) => {
                            if (item.divider) {
                                return <div key={i} className="border-t border-midnight-500/30 my-3" />;
                            }
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={i}
                                    to={item.to}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                                        ${isActive(item.to)
                                            ? 'bg-accent/10 text-accent'
                                            : 'text-text-secondary hover:text-text-primary hover:bg-midnight-600'
                                        }
                                        ${!sidebarOpen ? 'justify-center' : ''}
                                    `}
                                    title={!sidebarOpen ? item.label : undefined}
                                >
                                    <Icon className={`flex-shrink-0 ${isActive(item.to) ? 'text-accent' : 'text-accent/60'}`} size={18} />
                                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Account section at bottom */}
                    {sidebarOpen && (
                        <div className="border-t border-midnight-500/30 pt-4 mt-4">
                            <button
                                onClick={() => setIsAccountOpen(!isAccountOpen)}
                                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-midnight-600 transition-colors"
                            >
                                <img
                                    src={user.profilePicture && user.profilePicture.trim() !== ""
                                        ? user.profilePicture
                                        : "https://digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png"}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
                                    <p className="text-xs text-text-muted truncate">{user.email}</p>
                                </div>
                                {isAccountOpen ? <FaChevronUp className="text-text-muted" size={12} /> : <FaChevronDown className="text-text-muted" size={12} />}
                            </button>

                            {isAccountOpen && (
                                <div className="mt-2 py-1 space-y-0.5 animate-slide-down">
                                    <Link
                                        to="/settings"
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-midnight-600 transition-colors"
                                    >
                                        <FaCog className="text-accent" size={14} />
                                        Settings
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-danger hover:bg-danger/5 transition-colors"
                                    >
                                        <FaSignOutAlt className="text-danger" size={14} />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}

export default Aside;
