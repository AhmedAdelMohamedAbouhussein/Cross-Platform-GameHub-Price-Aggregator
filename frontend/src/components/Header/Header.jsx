import styles from "./Header.module.css"; 
import { Link } from 'react-router-dom';
import { useContext } from "react";
import axios from 'axios';

import AuthContext from "../../contexts/AuthContext";  // <-- your auth provider

function Header() {

    const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
    const API_BASE =import.meta.env.MODE === "development"? ""  : BACKEND_URL;

    const { user , setUser } = useContext(AuthContext); // <-- access logged-in user

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
                            <>
                                <li className={styles.profileBox}>
                                    <img src={user.profilePicture && user.profilePicture.trim() !== "" ? user.profilePicture : "https://digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png"} alt="Profile" className={styles.profilePic} />
                                    <div className={styles.profileInfo}>
                                        <span className={styles.profileName}>{user.name}</span>
                                        <span className={styles.profileEmail}>{user.email}</span>
                                    </div>
                                    <div className={styles.navLinksli} onClick={handleLogout}>Logout</div>
                                </li>
                                
                            </>
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
