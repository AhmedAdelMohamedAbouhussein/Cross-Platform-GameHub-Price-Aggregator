import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/apiClient.js";

import Styles from "./ManageFriendsPage.module.css";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import AuthContext from "../../contexts/AuthContext";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";

function ManageFriendsPage() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState("add");
    const [recieverid, setrecieverid] = useState("");
    const [feedback, setFeedback] = useState("");

    // -----------------------------
    // FETCH FRIENDS (same style as your page)
    // -----------------------------
    const {
        data: friends,
        isLoading,
        isError
    } = useQuery({
        queryKey: ["friends", user?.publicID],
        queryFn: () => fetchFriends(),
        enabled: !!user?.publicID,
        staleTime: 1000 * 60 * 5
    });

    const fetchFriends = async () => {
        const res = await apiClient.post(`/users/friendlist`, {
            publicID: user.publicID,
        });

        const allFriends = { ...res.data.friends };

        const userFriends = await Promise.all(
            (allFriends.User || []).map(async (friend) => {
                const response = await apiClient.get(
                    `/users/${encodeURIComponent(friend.user)}`
                );
                return { ...friend, ...response.data.user };
            })
        );

        allFriends.User = userFriends;
        return allFriends;
    };

    const allFriends = friends
        ? Object.values(friends).flat().filter(f => f.source === "User")
        : [];

    // -----------------------------
    // MUTATIONS
    // -----------------------------
    const invalidateFriends = () => {
        queryClient.invalidateQueries({ queryKey: ["friends"] });
    };

    const sendRequestMutation = useMutation({
        mutationFn: (id) =>
            apiClient.post(`/friends/add/${encodeURIComponent(id)}`, {
                publicID: user.publicID,
            }),
        onSuccess: (res) => {
            setFeedback(res.data.message || "Request sent!");
            invalidateFriends();
        },
        onError: (err) => {
            setFeedback(err.response?.data?.message || "Something went wrong.");
        }
    });

    const acceptMutation = useMutation({
        mutationFn: (id) =>
            apiClient.post(`/friends/accept/${encodeURIComponent(id)}`, {
                publicID: user.publicID,
            }),
        onSuccess: (res) => {
            setFeedback(res.data.message || "Request accepted!");
            invalidateFriends();
        }
    });

    const rejectMutation = useMutation({
        mutationFn: (id) =>
            apiClient.post(`/friends/reject/${encodeURIComponent(id)}`, {
                publicID: user.publicID,
            }),
        onSuccess: (res) => {
            setFeedback(res.data.message || "Request rejected!");
            invalidateFriends();
        }
    });

    const removeMutation = useMutation({
        mutationFn: (id) =>
            apiClient.post(`/friends/remove/${encodeURIComponent(id)}`, {
                publicID: user.publicID,
            }),
        onSuccess: (res) => {
            setFeedback(res.data.message || "Friend removed!");
            invalidateFriends();
        }
    });

    // -----------------------------
    // LOADING STATE (same pattern as OwnedGamesDetails)
    // -----------------------------
    if (isLoading) return <LoadingScreen />;

    if (isError) {
        return (
            <div className={Styles.container}>
                <Header />
                <p className={Styles.error}>Failed to load friends.</p>
                <Footer />
            </div>
        );
    }

    // -----------------------------
    // ACTIONS
    // -----------------------------
    const sendRequest = (id) => sendRequestMutation.mutate(id);
    const acceptPendingRequest = (id) => acceptMutation.mutate(id);
    const rejectPendingRequest = (id) => rejectMutation.mutate(id);
    const removeRequest = (id) => removeMutation.mutate(id);

    const renderFriendItem = (friend, actionButtons) => (
        <li key={friend.user} className={Styles.friendBar}>
            <div className={Styles.friendImage}>
                <img
                    src={
                        friend.avatar ||
                        friend.profilePicture ||
                        "https://digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png"
                    }
                    alt={friend.displayName || "Friend avatar"}
                    className={Styles.avatar}
                />
            </div>

            <div className={Styles.friendInfo}>
                <div className={Styles.friendName}>
                    {friend.displayName || friend.name || "Unknown"}
                </div>
                <div className={Styles.friendId}>
                    UserID: {friend.publicID}
                </div>

                <Link
                    to={`/friends/viewprofile/${friend.publicID}`}
                    className={Styles.friendLink}
                >
                    View Profile
                </Link>
            </div>

            <div className={Styles.buttonContainer}>
                {actionButtons}
            </div>
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
                            placeholder="Enter friend's Public ID"
                            className={Styles.input}
                            onChange={(e) => setrecieverid(e.target.value)}
                        />

                        <button
                            className={Styles.btnPrimary}
                            onClick={() => sendRequest(recieverid)}
                        >
                            Send Request
                        </button>

                        {feedback && (
                            <p className={Styles.feedback}>{feedback}</p>
                        )}
                    </div>
                );

            case "sent":
                return (
                    <div className={Styles.section}>
                        <h2>Pending Sent</h2>

                        <ul className={Styles.friendList}>
                            {allFriends
                                .filter(f => f.status === "pending" && f.requestedByMe)
                                .length ? (
                                    allFriends
                                        .filter(f => f.status === "pending" && f.requestedByMe)
                                        .map(friend =>
                                            renderFriendItem(
                                                friend,
                                                <button
                                                    className={Styles.btnDanger}
                                                    onClick={() =>
                                                        rejectPendingRequest(friend.user)
                                                    }
                                                >
                                                    Cancel
                                                </button>
                                            )
                                        )
                                ) : (
                                    <li>No pending requests sent</li>
                                )}
                        </ul>

                        {feedback && (
                            <p className={Styles.feedback}>{feedback}</p>
                        )}
                    </div>
                );

            case "received":
                return (
                    <div className={Styles.section}>
                        <h2>Pending Received</h2>

                        <ul className={Styles.friendList}>
                            {allFriends
                                .filter(f => f.status === "pending" && !f.requestedByMe)
                                .length ? (
                                    allFriends
                                        .filter(f => f.status === "pending" && !f.requestedByMe)
                                        .map(friend =>
                                            renderFriendItem(
                                                friend,
                                                <>
                                                    <button
                                                        className={Styles.btnPrimary}
                                                        onClick={() =>
                                                            acceptPendingRequest(friend.user)
                                                        }
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        className={Styles.btnDanger}
                                                        onClick={() =>
                                                            rejectPendingRequest(friend.user)
                                                        }
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )
                                        )
                                ) : (
                                    <li>No pending requests received</li>
                                )}
                        </ul>

                        {feedback && (
                            <p className={Styles.feedback}>{feedback}</p>
                        )}
                    </div>
                );

            case "remove":
                return (
                    <div className={Styles.section}>
                        <h2>Remove Friend</h2>

                        <ul className={Styles.friendList}>
                            {allFriends
                                .filter(f => f.status === "accepted")
                                .length ? (
                                    allFriends
                                        .filter(f => f.status === "accepted")
                                        .map(friend =>
                                            renderFriendItem(
                                                friend,
                                                <button
                                                    className={Styles.btnDanger}
                                                    onClick={() =>
                                                        removeRequest(friend.user)
                                                    }
                                                >
                                                    Remove
                                                </button>
                                            )
                                        )
                                ) : (
                                    <li>No friends to remove</li>
                                )}
                        </ul>

                        {feedback && (
                            <p className={Styles.feedback}>{feedback}</p>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className={Styles.container}>
            <Header />

            <div className={Styles.page}>
                <h1 className={Styles.title}>Manage Friends</h1>

                <div className={Styles.tabs}>
                    <button
                        className={`${Styles.tab} ${activeTab === "add" ? Styles.active : ""}`}
                        onClick={() => setActiveTab("add")}
                    >
                        Add Friend
                    </button>

                    <button
                        className={`${Styles.tab} ${activeTab === "sent" ? Styles.active : ""}`}
                        onClick={() => setActiveTab("sent")}
                    >
                        Pending Sent
                    </button>

                    <button
                        className={`${Styles.tab} ${activeTab === "received" ? Styles.active : ""}`}
                        onClick={() => setActiveTab("received")}
                    >
                        Pending Received
                    </button>

                    <button
                        className={`${Styles.tab} ${activeTab === "remove" ? Styles.active : ""}`}
                        onClick={() => setActiveTab("remove")}
                    >
                        Remove Friend
                    </button>
                </div>

                <div className={Styles.content}>
                    {renderContent()}
                </div>

                <button
                    className={Styles.btnBack}
                    onClick={() => navigate("/friends")}
                >
                    ← Back to Friends
                </button>
            </div>

            <Footer />
        </div>
    );
}

export default ManageFriendsPage;