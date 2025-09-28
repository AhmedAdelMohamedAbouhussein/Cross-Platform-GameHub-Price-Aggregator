import { useContext, useEffect, useState} from "react";
import Styles from "./FriendsPage.module.css";
import { useNavigate, Link  } from 'react-router-dom';
import axios from "axios";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import AuthContext from "../../contexts/AuthContext";

import { FaGamepad, FaSteam, FaXbox } from "react-icons/fa";
import { SiEpicgames, SiGogdotcom, SiNintendo, SiPlaystation } from "react-icons/si";

function FriendsPage() 
{
    const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
    const API_BASE = import.meta.env.MODE === "development" ? "" : BACKEND_URL;

    const { user } = useContext(AuthContext); // assumes setUser updates context
    const [friends, setFriends] = useState(null); // <-- store fetched friends

    const navigate = useNavigate();

     // Fetch friend list on mount
useEffect(() => {
    const fetchFriends = async () => {
        try {
            const res = await axios.post(`${API_BASE}/api/users/friendlist`, {
                userId: user._id,
            });

            // Copy the friends object so we don't mutate the original
            let allFriends = { ...res.data.friends };

            // Only update the "User" array with populated user objects
            const userFriends = await Promise.all(
                (allFriends.User || []).map(async (friend) => {
                    const response = await axios.get(`${API_BASE}/api/users/${friend.user}`);
                    return { ...friend, ...response.data.user }; 
                    // merges original friend info with populated user
                })
            );

            allFriends.User = userFriends;

            setFriends(allFriends);
            console.log("Fetched friends:", allFriends);
        } catch (err) {
            console.error("Failed to fetch friends:", err);
        }
    };

    if (user?._id) fetchFriends();
}, [user, API_BASE]);



    const platforms = [
        { key: "User", label: "App Friends", icon: FaGamepad, color: "#FFD700" },
        { key: "Steam", label: "Steam Friends", icon: FaSteam, color: "#091cb2ff" },
        { key: "Xbox", label: "Xbox Friends", icon: FaXbox, color: "#107C10" },
        { key: "Epic", label: "Epic Games Friends", icon: SiEpicgames, color: "#444" },
        { key: "PS", label: "PlayStation Friends", icon: SiPlaystation, color: "#003087" },
        { key: "Nintendo", label: "Nintendo Friends", icon: SiNintendo, color: "#E60012" },
        { key: "GOG", label: "GOG Friends", icon: SiGogdotcom, color: "#6c43a1" },
    ];

return (
    <div className={Styles.container}>
        <Header />
        {platforms.map((platform) => {
            const Icon = platform.icon;
            return (
                <div key={platform.key} className={Styles.page}>
                    <div className={Styles.top}>
                        <div className={Styles.iconCircle} style={{ backgroundColor: platform.color }}>
                            <Icon size={36} />
                        </div>
                        <div className={Styles.info}>
                            <h1 className={Styles.title}>{platform.label}</h1>
                        </div>
                        {platform.key === "User" && (
                            <button
                                className={Styles.addFriendBtn}
                                onClick={() => navigate("/managefriends")}
                            >
                                Manage Friends
                            </button>
                        )}
                    </div>

                    <ul className={Styles.friendList}>
                        {friends?.[platform.key]?.filter(f => f.status === "accepted").length > 0 ? (
                            friends[platform.key]
                                .filter(friend => friend.status === "accepted")
                                .map((friend, idx) => (
                                    <li key={idx} className={Styles.friendBar}>
                                        <div className={Styles.friendImage}>
                                            
                                                <img
                                                    src={friend.avatar || friend.profilePicture || "https://digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png"}
                                                    alt={friend.displayName || friend.name || "Friend avatar"}
                                                    className={Styles.avatar}
                                                />
                                            
                                        </div>

                                        <div className={Styles.friendInfo}>
                                            {/* --- Handle User vs External --- */}
                                            <div className={Styles.friendName}>
                                                {platform.key === "User"
                                                    ? friend.name || friend.email || "Unknown"
                                                    : friend.displayName || "Unknown"}
                                            </div>

                                            {platform.key === "User" ? (
                                                <>
                                                    <div className={Styles.friendId}> UserID: {friend._id} </div>
                                                    {/* Internal link for User friends */}
                                                    <Link to={`/friends/viewprofile/${friend._id}`} className={Styles.friendLink}> View Profile </Link>
                                                </>

                                            ) : (
                                                <>
                                                    {friend.externalId && (
                                                        <div className={Styles.friendId}>
                                                            {platform.key} ID: {friend.externalId}
                                                        </div>
                                                    )}
                                                    {friend.profileUrl && (
                                                        <a
                                                            href={friend.profileUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className={Styles.friendLink}
                                                        >
                                                            View Profile
                                                        </a>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </li>
                                ))
                        ) : (
                            <li className={Styles.noFriends}>No accepted friends found</li>
                        )}
                    </ul>
                </div>
            );
        })}
        <Footer />
    </div>
);

}

export default FriendsPage;
