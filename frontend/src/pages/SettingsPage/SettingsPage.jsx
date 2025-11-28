import { useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SettingsPage.module.css";
import Cropper from "react-easy-crop";
import axios from "axios";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";
import getCroppedImg from "../../utils/cropImage";

import AuthContext from "../../contexts/AuthContext.jsx";

function SettingsPage() 
{
    const { user } = useContext(AuthContext); 
    const BackendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL;
    const navigate = useNavigate(); //navigate(0);

    const [loading, setLoading] = useState(false);  
    const [selected, setSelected] = useState("profile");

    // Profile states
    const [profilePic, setProfilePic] = useState(null); // final cropped profile picture URL
    const [username, setUsername] = useState(user.name);
    const [bio, setBio] = useState(user.bio ? user.bio : "");
    const [visibility, setVisibility] = useState(user.profileVisibility);

    // Profile Picture states
    const [profilePicPreview, setProfilePicPreview] = useState(null); // preview before cropping
    const [croppingMode, setCroppingMode] = useState(false);

    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedArea, setCroppedArea] = useState(null);

    const [croppedBlob, setCroppedBlob] = useState(null);


    //flags
    const [imagechange, setImagechange] = useState(null);
    const [namechange, setNamechange] = useState(null);
    const [biochange, setBiochange] = useState(null);
    const [profileVisibilitychange, setProfileVisibility] = useState(null);

    const saveAllChanges = async() =>
    {
        setLoading(true);

        try 
        {
            if(imagechange && croppedBlob)
            {
                const formData = new FormData();
                formData.append("profileImage", croppedBlob, "profile.jpg");

                await axios.post(
                    `${BackendUrl}/setting/profileImage`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                        withCredentials: true,
                    }
                );
            }

            // Update other fields
            const payload = {};
            if (biochange && bio) payload.bio = bio;
            if (namechange && username) payload.username = username;
            if (profileVisibilitychange  && profileVisibilitychange) payload.visibility = visibility;
            
            if (Object.keys(payload).length > 0) 
            {
                await axios.post(`${BackendUrl}/setting/updateProfile`, payload, {
                    withCredentials: true,
                });
            }
        
            // Reset flags
            setImagechange(false);
            setNamechange(false);
            setBiochange(false);
            setProfileVisibility(false);
            navigate(0);
        
        } 
        catch (error) 
        {
            console.error("Save failed:", error);
            alert("Failed to save changes. Try again.");
        } 
        finally 
        {
            setLoading(false);
        }
    }

    const discardChanges = () => {
    // Reset fields to initial user data
    setProfilePic(user.profilePicture || null);
    setUsername(user.name || "PlayerOne");
    setBio(user.bio || "");
    setVisibility(user.visibility || "friends");

    // Reset profile picture cropping
    setProfilePicPreview(null);
    setCroppingMode(false);
    setCroppedBlob(null);

    // Reset all change flags
    setImagechange(false);
    setBiochange(false);
    setProfileVisibility(false);
    setNamechange(false)

    navigate(0);
};

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicPreview(URL.createObjectURL(file));
            setCroppingMode(true); // force user to crop
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

            setImagechange(true)
            // Show final cropped picture
            setProfilePic(URL.createObjectURL(croppedBlob));
            setCroppingMode(false);
            setProfilePicPreview(null);
        } catch (error) {
            console.error("Upload failed:", error);
        }
        finally {
            setLoading(false);   // ← HIDE LOADING
        }
    };

    const handleCropCancel = () => {
        setCroppingMode(false);
        setProfilePicPreview(null);
    };

    const renderContent = () => {
        switch (selected) {
            case "profile":
                return (
                    <div>
                        <h2 className={styles.title}>Profile Settings</h2>

                        {/* Profile Picture */}
                        <section className={styles.section}>
                            <h3>Profile Picture</h3>
                            <div className={styles.profilePicWrapper}>
                                {!croppingMode ? (
                                    <>
                                        <img
                                            src={
                                                profilePic || user.profilePicture ||
                                                "https://digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png"
                                            }
                                            alt="Profile"
                                            className={styles.profilePic}
                                        />
                                        <input
                                            type="file"
                                            id="profilePicUpload"
                                            accept="image/*"
                                            onChange={handleProfilePicChange}
                                            className={styles.hiddenFileInput}
                                        />
                                        <label
                                            htmlFor="profilePicUpload"
                                            className={styles.uploadButton}
                                        >
                                            Upload Image
                                        </label>
                                    </>
                                ) : (
                                    <div>
                                        <div className={styles.cropContainer}>
                                            <div className={styles.cropArea}>
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
                                        </div>

                                        {/* Controls */}
                                        <div className={styles.controls}>
                                            <input
                                                type="range"
                                                min={1}
                                                max={3}
                                                step={0.1}
                                                value={zoom}
                                                onChange={(e) => setZoom(Number(e.target.value))}
                                                className={styles.zoomSlider}
                                            />
                                            <div className={styles.cropButtons}>
                                                <button
                                                    onClick={handleCropDone}
                                                    className={styles.button}
                                                >
                                                    Done
                                                </button>
                                                <button
                                                    onClick={handleCropCancel}
                                                    className={styles.deleteButton}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Username */}
                        <section className={styles.section}>
                            <h3>Display Name</h3>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => 
                                    {
                                        setUsername(e.target.value)
                                        setNamechange(true)
                                    }
                                }
                                className={styles.input}
                            />
                        </section>

                        {/* Bio */}
                        <section className={styles.section}>
                            <h3>Bio</h3>
                            <textarea
                                value={user.bio}
                                onChange={(e) => 
                                    {
                                        setBio(e.target.value); 
                                        setBiochange(true);
                                    }
                                }
                                className={styles.textarea}
                            />
                        </section>

                        {/* Social Links */}
                        <section className={styles.section}>
                            <h3>Social Links</h3>
                        </section>
                    </div>
                );

            case "account":
                return (
                    <div>
                        <h2 className={styles.title}>Account Settings</h2>
                        <section className={styles.section}>
                            <h3>Change Email</h3>
                            <input
                                type="email"
                                placeholder="New Email"
                                className={styles.input}
                            />
                            <button className={styles.button}>
                                Send Verification Link
                            </button>
                        </section>

                        <section className={styles.section}>
                            <h3>Change Password</h3>
                            <input
                                type="password"
                                placeholder="Current Password"
                                className={styles.input}
                            />
                            <input
                                type="password"
                                placeholder="New Password"
                                className={styles.input}
                            />
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                className={styles.input}
                            />
                            <button className={styles.button}>Update Password</button>
                        </section>
                    </div>
                );

            case "privacy":
                return (
                    <div>
                        <h2 className={styles.title}>Privacy Settings</h2>
                        <section className={styles.section}>
                            <h3>Profile Visibility</h3>
                            <select
                                value={visibility}
                                onChange={(e) => 
                                    {
                                        setVisibility(e.target.value)
                                        setProfileVisibility(true);
                                    }
                                }
                                className={styles.select}
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
                    <div>
                        <h2 className={styles.title}>Danger Zone</h2>
                        <section className={`${styles.section} ${styles.dangerZone}`}>
                            <p>This action is irreversible. Proceed with caution.</p>
                            <button className={styles.deleteButton}>Delete Account</button>
                        </section>
                    </div>
                );

            default:
                return <h2>Select an option from the sidebar</h2>;
        }
    };

    return (
        <div className={styles.pageContainer}>
            {loading && <LoadingScreen />}   {/* ← LOADING OVERLAY */}
            <Header />
            <div className={styles.spacer}>
                <div className={styles.settingsWrapper}>
                    {/* Sidebar */}
                    <aside className={styles.sidebar}>
                        <ul>
                            <li
                                onClick={() => setSelected("profile")}
                                className={selected === "profile" ? styles.active : ""}
                            >
                                Profile
                            </li>
                            <li
                                onClick={() => setSelected("account")}
                                className={selected === "account" ? styles.active : ""}
                            >
                                Account
                            </li>
                            <li
                                onClick={() => setSelected("privacy")}
                                className={selected === "privacy" ? styles.active : ""}
                            >
                                Privacy
                            </li>
                            <li
                                onClick={() => setSelected("danger")}
                                className={selected === "danger" ? styles.active : ""}
                            >
                                Danger Zone
                            </li>
                        </ul>
                    </aside>

                    {/* Main Content */}
                    <main className={styles.settingsContainer}>
                        {renderContent()}
                        <div className={styles.saveStickyWrapper}>
                            <button onClick={saveAllChanges} className={styles.saveButton}>
                                Save All Changes
                            </button>
                            <button onClick={discardChanges} className={styles.discardButton}>
                                Discard Changes
                            </button>
                        </div>
                    </main>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default SettingsPage;
