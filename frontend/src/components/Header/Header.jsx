import styles from "./Header.module.css"; 
import { Link } from 'react-router-dom';
import { useContext, useState } from "react";
import axios from 'axios';

import AuthContext from "../../contexts/AuthContext";  // <-- your auth provider
import { FaCaretDown, FaCaretUp, FaCog, FaSignOutAlt } from "react-icons/fa";

function Header() {

    const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
    const API_BASE = import.meta.env.MODE === "development" ? "" : BACKEND_URL;

    const { user , setUser } = useContext(AuthContext); // <-- access logged-in user
    const [isAccountOpen, setIsAccountOpen] = useState(false);

    const toggleAccount = () => {
        setIsAccountOpen(!isAccountOpen);
    };

    const handleLogout = async () => 
    {
        try
        {
            const response = await axios.post(`${API_BASE}/api/auth/logout`, {},
                { withCredentials: true } // 🔑 so cookies/sessions work
            );

            console.log(response.data.message);
            setUser(null);
        }
        catch(error)
        {
            console.error(error.response?.data?.message || "Logout failed");
        }
    }

    return (
        <header className={styles.stickyHeader}>
            <div className={styles.headerContent}>
                <h1>My GameHub</h1>
                <nav>
                    <ul className={styles.navLinks}>
                        <li><Link className={styles.navLinksli} to="/">Home</Link></li>
                        <li><Link className={styles.navLinksli} to="/about">About</Link></li>
                        <li><Link className={styles.navLinksli} to="/contact">Contact</Link></li>

                        {/* 🔑 Conditional rendering */}
                        {user ? (
                            <li className={styles.profileBox}>
                                <div className={styles.profileToggle}>
                                    <img 
                                        src={user.profilePicture && user.profilePicture.trim() !== "" 
                                            ? user.profilePicture 
                                            : "https://digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png"} 
                                        alt="Profile" 
                                        className={styles.profilePic} 
                                    />
                                    <div className={styles.profileInfo}>
                                        <span className={styles.profileName}>{user.name}</span>
                                        {/*<span className={styles.profileEmail}>{user.email}</span>*/}
                                        <div><span className={styles.profileEmail}>PublicID: {user.publicID}</span></div>
                                        
                                    </div>
                                    <div className={styles.accountArrow} onClick={toggleAccount}>
                                        {isAccountOpen ? <FaCaretUp /> : <FaCaretDown />}
                                    </div>
                                </div>

                                {isAccountOpen && (
                                    <ul className={styles.accountDropdown}>
                                        <li className={styles.listitems}>
                                            <FaCog className={styles.icon}/>
                                            <Link className={styles.navLinksli} to="/settings">Settings</Link>
                                        </li>
                                        <li className={styles.listitems} onClick={handleLogout}>
                                            <FaSignOutAlt className={styles.icon}/>
                                            <span className={styles.navLinksli}>Logout</span>
                                        </li>
                                    </ul>
                                )}
                            </li>
                        ) : (
                            <li><Link className={styles.navLinksli} to="/login">Login</Link></li>
                        )}
                    </ul>
                </nav>
            </div>
        </header>
    );
}

export default Header;
