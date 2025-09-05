import { useState } from "react";
import styles from "./SettingsPage.module.css";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

function SettingsPage() 
{
    // Local state (replace later with API calls)
    const [username, setUsername] = useState("PlayerOne");
    const [bio, setBio] = useState("Gamer, coder, coffee lover ☕🎮");
    const [socialLinks, setSocialLinks] = useState({
        steam: "",
        epic: "",
        xbox: "",
        playstation: ""
    });
    const [visibility, setVisibility] = useState("friends");
    const [profilePic, setProfilePic] = useState(null);

    // Handlers
    const handleProfilePicChange = (e) => 
    {
        const file = e.target.files[0];
        if (file) 
        {
            setProfilePic(URL.createObjectURL(file));
        }
    };

    const handleSocialChange = (platform, value) => 
    {
        setSocialLinks({ ...socialLinks, [platform]: value });
    };

    return (
    <div className={styles.pageContainer}>
    <Header/>
    <div className={styles.spacer} >
        <div className={styles.settingsContainer}>
            
            <h2 className={styles.title}>Account Settings</h2>

            {/* Profile Picture */}
            <section className={styles.section}>
                <h3>Profile Picture</h3>
                <div className={styles.profilePicWrapper}>
                    <img
                        src={
                            profilePic ||
                            "https://digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png"
                        }
                        alt="Profile"
                        className={styles.profilePic}
                    />
                    <input type="file" onChange={handleProfilePicChange} />
                </div>
            </section>

            {/* Username */}
            <section className={styles.section}>
                <h3>Display Name</h3>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={styles.input}
                />
            </section>

            {/* Bio */}
            <section className={styles.section}>
                <h3>Bio</h3>
                <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className={styles.textarea}
                />
            </section>

            {/* Social Links */}
            <section className={styles.section}>
                <h3>Social Links</h3>
                <input
                    type="text"
                    placeholder="Steam ID"
                    value={socialLinks.steam}
                    onChange={(e) => handleSocialChange("steam", e.target.value)}
                    className={styles.input}
                />
                <input
                    type="text"
                    placeholder="Epic Games"
                    value={socialLinks.epic}
                    onChange={(e) => handleSocialChange("epic", e.target.value)}
                    className={styles.input}
                />
                <input
                    type="text"
                    placeholder="Xbox Gamertag"
                    value={socialLinks.xbox}
                    onChange={(e) => handleSocialChange("xbox", e.target.value)}
                    className={styles.input}
                />
                <input
                    type="text"
                    placeholder="PlayStation ID"
                    value={socialLinks.playstation}
                    onChange={(e) => handleSocialChange("playstation", e.target.value)}
                    className={styles.input}
                />
            </section>

            {/* Privacy */}
            <section className={styles.section}>
                <h3>Privacy Settings</h3>
                <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className={styles.select}
                >
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private</option>
                </select>
            </section>

            {/* Change Email */}
            <section className={styles.section}>
                <h3>Change Email</h3>
                <input type="email" placeholder="New Email" className={styles.input} />
                <button className={styles.button}>Send Verification Link</button>
            </section>

            {/* Change Password */}
            <section className={styles.section}>
                <h3>Change Password</h3>
                <input type="password" placeholder="Current Password" className={styles.input} />
                <input type="password" placeholder="New Password" className={styles.input} />
                <input type="password" placeholder="Confirm New Password" className={styles.input} />
                <button className={styles.button}>Update Password</button>
            </section>

            {/* Delete Account */}
            <section className={`${styles.section} ${styles.dangerZone}`}>
                <h3>Delete Account</h3>
                <p>This action is irreversible. Proceed with caution.</p>
                <button className={styles.deleteButton}>Delete Account</button>
            </section>
        </div>
    </div>
    <Footer/>
    </div>
    );
}

export default SettingsPage;
