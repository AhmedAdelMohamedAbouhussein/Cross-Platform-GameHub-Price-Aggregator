import { Link, useLocation } from 'react-router-dom';
import { useContext, useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import apiClient from "../../utils/apiClient.js";
import AuthContext from "../../contexts/AuthContext";
import { FaCog, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";

function Header() {
    const { user, setUser } = useContext(AuthContext);
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const dropdownRef = useRef(null);
    const location = useLocation();
    const prevPathRef = useRef(location.pathname);

    const navLinks = [
        { to: "/", label: "Home" },
        { to: "/games", label: "Browse" },
    ];

    const isActive = (path) => location.pathname === path;

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsAccountOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (prevPathRef.current !== location.pathname) {
            setIsMobileMenuOpen(false);
        }
        prevPathRef.current = location.pathname;
    }, [location.pathname]);

    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
        return () => (document.body.style.overflow = "");
    }, [isMobileMenuOpen]);

    const handleLogout = async () => {
        try {
            const response = await apiClient.post(`/auth/logout`, {});
            toast.success(response.data.message || "Logged out successfully");
            setUser(null);
            setIsMobileMenuOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Logout failed");
        }
    };

    return (
        <>
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-midnight-700/95 backdrop-blur-md border-b border-midnight-500/30 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">

                        {/* Logo */}
                        <Link to="/" className="text-xl font-bold text-transparent bg-gradient-to-r from-accent to-accent-glow bg-clip-text">
                            My GameHub
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-2">
                            {navLinks.map(link => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`px-4 py-2 rounded-lg text-sm transition ${isActive(link.to)
                                            ? "bg-accent/10 text-accent"
                                            : "text-text-secondary hover:text-white hover:bg-midnight-600"
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Mobile Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden text-white p-2"
                        >
                            <FaBars size={22} />
                        </button>
                    </div>
                </div>
            </header>

            {/* ================= MOBILE BACKDROP ================= */}
            <div
                className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300
                ${isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
                bg-black/40 backdrop-blur-sm`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* ================= MOBILE DRAWER ================= */}
            <div
                className={`
                    fixed top-0 left-0 z-50 h-full w-72 md:hidden

                    bg-midnight-800/70 backdrop-blur-2xl
                    border-r border-white/10
                    shadow-2xl shadow-black/50

                    text-white

                    transform transition-all duration-500
                    ease-[cubic-bezier(0.22,1,0.36,1)]

                    ${isMobileMenuOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"}
                `}
            >
                {/* TOP BAR */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <span className="text-white font-semibold text-lg">
                        Menu
                    </span>

                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-white/70 hover:text-white transition"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* NAV LINKS */}
                <nav className="flex flex-col p-5 gap-2">

                    {navLinks.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`px-4 py-3 rounded-xl text-sm font-medium transition-all
                                ${isActive(link.to)
                                    ? "bg-white/10 text-white"
                                    : "text-white/70 hover:text-white hover:bg-white/5"
                                }
                            `}
                        >
                            {link.label}
                        </Link>
                    ))}

                    <div className="border-t border-white/10 my-3" />

                    {/* AUTH SECTION */}
                    {user ? (
                        <>
                            <Link
                                to="/library"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5"
                            >
                                My Library
                            </Link>

                            <Link
                                to="/friends"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5"
                            >
                                Friends
                            </Link>

                            <Link
                                to="/settings"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-2"
                            >
                                <FaCog className="text-accent" />
                                Settings
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                            >
                                <FaSignOutAlt />
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="btn-primary text-center mt-2"
                        >
                            Sign In
                        </Link>
                    )}
                </nav>
            </div>
        </>
    );
}

export default Header;