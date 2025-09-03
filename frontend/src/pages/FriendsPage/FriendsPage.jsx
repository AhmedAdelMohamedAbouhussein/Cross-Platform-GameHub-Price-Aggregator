import { useContext} from "react";
import Styles from "./FriendsPage.module.css";
import { useNavigate } from 'react-router-dom';

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import AuthContext from "../../contexts/AuthContext";

import { FaGamepad, FaSteam, FaXbox } from "react-icons/fa";
import { SiEpicgames, SiGogdotcom, SiNintendo, SiPlaystation } from "react-icons/si";

function FriendsPage() 
{
    const { user } = useContext(AuthContext); // assumes setUser updates context

    const navigate = useNavigate();

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
                                <button className={Styles.addFriendBtn} onClick={() => navigate('/managefriends')}> Manage Friends </button>
                            )}
                        </div>
                        <ul className={Styles.friendList}>
                            {user?.friends?.[platform.key]
                                ?.filter(friend => friend.status === "accepted").length > 0 ? (
                                    user.friends[platform.key].filter(friend => friend.status === "accepted").map((friend, idx) => (
                                        <li key={idx} className={Styles.friendBar}>
                                        <div className={Styles.friendImage}>
                                            {friend.avatar && (<img src={friend.avatar} alt={friend.displayName || "Friend avatar"} className={Styles.avatar}/>)}</div>
                                            <div className={Styles.friendInfo}>
                                                <div className={Styles.friendName}> {friend.displayName || "Unknown"} </div>
                                                {friend.externalId && ( <div className={Styles.friendId}> {platform.key} ID: {friend.externalId} </div>)}
                                                {friend.profileUrl && ( <a href={friend.profileUrl} target="_blank" rel="noreferrer" className={Styles.friendLink} > View Profile </a>)}
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
