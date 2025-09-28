import { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

import Styles from "./ManageFriendsPage.module.css";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import AuthContext from "../../contexts/AuthContext";

function ManageFriendsPage() {
    const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
    const API_BASE = import.meta.env.MODE === "development" ? "" : BACKEND_URL;

    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("add");
    const [recieverid, setrecieverid] = useState("");
    const [feedback, setFeedback] = useState("");
    const [friends, setFriends] = useState(null);

    useEffect(() => {
        const fetchFriends = async () => {
            if (!user?.publicID) return;
            try {
                const res = await axios.post(`${API_BASE}/api/users/friendlist`, {
                    publicID: user.publicID,
                });

                const allFriends = { ...res.data.friends };

                const userFriends = await Promise.all(
                    (allFriends.User || []).map(async (friend) => {
                        const response = await axios.get(
                            `${API_BASE}/api/users/${encodeURIComponent(friend.user)}`
                        );
                        return { ...friend, ...response.data.user };
                    })
                );

                allFriends.User = userFriends;
                setFriends(allFriends);
            } catch (err) {
                console.error("Failed to fetch friends:", err);
            }
        };

        fetchFriends();
    }, [user]);

    const allFriends = friends ? Object.values(friends).flat().filter(f => f.source === "User") : [];

    const sendRequest = async (id) => {
        try {
            const res = await axios.post(`${BACKEND_URL}/friends/add/${encodeURIComponent(id)}`, {
                publicID: user.publicID,
            });
            setFeedback(res.data.message || "Request sent!");
        } catch (err) {
            setFeedback(err.response?.data?.message || "Something went wrong.");
        }
    };

    const acceptPendingRequest = async (id) => {
        try {
            const res = await axios.post(`${BACKEND_URL}/friends/accept/${encodeURIComponent(id)}`, {
                publicID: user.publicID,
            });
            setFeedback(res.data.message || "Request accepted!");
        } catch (err) {
            setFeedback(err.response?.data?.message || "Something went wrong.");
        }
    };

    const rejectPendingRequest = async (id) => {
        try {
            const res = await axios.post(`${BACKEND_URL}/friends/reject/${encodeURIComponent(id)}`, {
                publicID: user.publicID,
            });
            setFeedback(res.data.message || "Request rejected!");
        } catch (err) {
            setFeedback(err.response?.data?.message || "Something went wrong.");
        }
    };

    const removeRequest = async (id) => {
        try {
            const res = await axios.post(`${BACKEND_URL}/friends/remove/${encodeURIComponent(id)}`, {
                publicID: user.publicID,
            });
            setFeedback(res.data.message || "Friend removed!");
        } catch (err) {
            setFeedback(err.response?.data?.message || "Something went wrong.");
        }
    };

    const renderFriendItem = (friend, actionButtons) => (
        <li key={friend.user} className={Styles.friendBar}>
            <div className={Styles.friendImage}>
                <img
                    src={friend.avatar || friend.profilePicture || "https://digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png"}
                    alt={friend.displayName || "Friend avatar"}
                    className={Styles.avatar}
                />
            </div>
            <div className={Styles.friendInfo}>
                <div className={Styles.friendName}>{friend.displayName || friend.name || "Unknown"}</div>
                <div className={Styles.friendId}>UserID: {friend.publicID}</div>
                <Link to={`/friends/viewprofile/${friend.publicID}`} className={Styles.friendLink}>
                    View Profile
                </Link>
            </div>
            <div className={Styles.buttonContainer}>{actionButtons}</div>
        </li>
    );

    const renderContent = () => {
        switch (activeTab) {
            case "add":
                return (
                    <div className={Styles.section}>
                        <h2>Add Friend</h2>
                        <input
                            type="text"
                            placeholder="Enter UserID"
                            className={Styles.input}
                            onChange={(e) => setrecieverid(e.target.value)}
                        />
                        <button className={Styles.btnPrimary} onClick={() => sendRequest(recieverid)}>
                            Send Request
                        </button>
                        {feedback && <p className={Styles.feedback}>{feedback}</p>}
                    </div>
                );
            case "sent":
                return (
                    <div className={Styles.section}>
                        <h2>Pending Requests (Sent)</h2>
                        <ul className={Styles.friendList}>
                            {allFriends.filter(f => f.status === "pending" && f.requestedByMe).length
                                ? allFriends
                                      .filter(f => f.status === "pending" && f.requestedByMe)
                                      .map(friend =>
                                          renderFriendItem(friend, (
                                              <button className={Styles.btnDanger} onClick={() => rejectPendingRequest(friend.user)}>Cancel</button>
                                          ))
                                      )
                                : <li>No pending requests sent</li>
                            }
                        </ul>
                        {feedback && <p className={Styles.feedback}>{feedback}</p>}
                    </div>
                );
            case "received":
                return (
                    <div className={Styles.section}>
                        <h2>Pending Requests (Received)</h2>
                        <ul className={Styles.friendList}>
                            {allFriends.filter(f => f.status === "pending" && !f.requestedByMe).length
                                ? allFriends
                                      .filter(f => f.status === "pending" && !f.requestedByMe)
                                      .map(friend =>
                                          renderFriendItem(friend, (
                                              <>
                                                  <button className={Styles.btnPrimary} onClick={() => acceptPendingRequest(friend.user)}>Accept</button>
                                                  <button className={Styles.btnDanger} onClick={() => rejectPendingRequest(friend.user)}>Reject</button>
                                              </>
                                          ))
                                      )
                                : <li>No pending requests received</li>
                            }
                        </ul>
                        {feedback && <p className={Styles.feedback}>{feedback}</p>}
                    </div>
                );
            case "remove":
                return (
                    <div className={Styles.section}>
                        <h2>Remove Friend</h2>
                        <ul className={Styles.friendList}>
                            {allFriends.filter(f => f.status === "accepted").length
                                ? allFriends
                                      .filter(f => f.status === "accepted")
                                      .map(friend =>
                                          renderFriendItem(friend, (
                                              <button className={Styles.btnDanger} onClick={() => removeRequest(friend.user)}>Remove</button>
                                          ))
                                      )
                                : <li>No friends to remove</li>
                            }
                        </ul>
                        {feedback && <p className={Styles.feedback}>{feedback}</p>}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={Styles.container}>
            <Header />
            <div className={Styles.page}>
                <h1 className={Styles.title}>Manage Friends</h1>
                <div className={Styles.tabs}>
                    <button className={`${Styles.tab} ${activeTab === "add" ? Styles.active : ""}`} onClick={() => setActiveTab("add")}>Add Friend</button>
                    <button className={`${Styles.tab} ${activeTab === "sent" ? Styles.active : ""}`} onClick={() => setActiveTab("sent")}>Pending Sent</button>
                    <button className={`${Styles.tab} ${activeTab === "received" ? Styles.active : ""}`} onClick={() => setActiveTab("received")}>Pending Received</button>
                    <button className={`${Styles.tab} ${activeTab === "remove" ? Styles.active : ""}`} onClick={() => setActiveTab("remove")}>Remove Friend</button>
                </div>
                <div className={Styles.content}>{renderContent()}</div>
                <button className={Styles.btnBack} onClick={() => navigate("/friends")}>← Back to Friends</button>
            </div>
            <Footer />
        </div>
    );
}

export default ManageFriendsPage;
