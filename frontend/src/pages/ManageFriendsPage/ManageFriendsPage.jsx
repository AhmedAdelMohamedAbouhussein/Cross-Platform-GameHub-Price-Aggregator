import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "../../utils/apiClient.js";

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

    const invalidateFriends = () => {
        queryClient.invalidateQueries({ queryKey: ["friends"] });
    };

    const sendRequestMutation = useMutation({
        mutationFn: (id) =>
            apiClient.post(`/friends/add/${encodeURIComponent(id)}`, {
                publicID: user.publicID,
            }),
        onSuccess: (res) => {
            toast.success(res.data.message || "Request sent!");
            invalidateFriends();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Something went wrong.");
        }
    });

    const acceptMutation = useMutation({
        mutationFn: (id) =>
            apiClient.post(`/friends/accept/${encodeURIComponent(id)}`, {
                publicID: user.publicID,
            }),
        onSuccess: (res) => {
            toast.success(res.data.message || "Request accepted!");
            invalidateFriends();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to accept request.");
        }
    });

    const rejectMutation = useMutation({
        mutationFn: (id) =>
            apiClient.post(`/friends/reject/${encodeURIComponent(id)}`, {
                publicID: user.publicID,
            }),
        onSuccess: (res) => {
            toast.success(res.data.message || "Request rejected!");
            invalidateFriends();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to reject request.");
        }
    });

    const removeMutation = useMutation({
        mutationFn: (id) =>
            apiClient.post(`/friends/remove/${encodeURIComponent(id)}`, {
                publicID: user.publicID,
            }),
        onSuccess: (res) => {
            toast.success(res.data.message || "Friend removed!");
            invalidateFriends();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to remove friend.");
        }
    });

    if (isLoading) return <LoadingScreen />;

    if (isError) {
        return (
            <div className="page-container">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-danger">Failed to load friends.</p>
                </div>
                <Footer />
            </div>
        );
    }

    const sendRequest = (id) => sendRequestMutation.mutate(id);
    const acceptPendingRequest = (id) => acceptMutation.mutate(id);
    const rejectPendingRequest = (id) => rejectMutation.mutate(id);
    const removeRequest = (id) => removeMutation.mutate(id);

    const renderFriendItem = (friend, actionButtons) => (
        <div key={friend.user} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-4 py-4 rounded-lg bg-midnight-800 border border-midnight-500/20">
            <img
                src={friend.avatar || friend.profilePicture || "https://digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png"}
                alt={friend.displayName || "Friend"}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-midnight-500 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                    {friend.displayName || friend.name || "Unknown"}
                </p>
                <p className="text-xs text-text-muted">ID: {friend.publicID}</p>
                <Link to={`/friends/viewprofile/${friend.publicID}`} className="text-xs text-accent hover:underline">
                    View Profile
                </Link>
            </div>
            <div className="flex gap-2 flex-shrink-0">
                {actionButtons}
            </div>
        </div>
    );

    const tabs = [
        { key: "add", label: "Add Friend" },
        { key: "sent", label: "Sent" },
        { key: "received", label: "Received" },
        { key: "remove", label: "Remove" },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case "add":
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-text-secondary">Enter your friend's Public ID to send a request.</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                placeholder="Enter friend's Public ID"
                                className="input-field flex-1"
                                onChange={(e) => setrecieverid(e.target.value)}
                            />
                            <button
                                className="btn-primary whitespace-nowrap"
                                onClick={() => sendRequest(recieverid)}
                            >
                                Send Request
                            </button>
                        </div>
                    </div>
                );

            case "sent":
                return (
                    <div className="space-y-3">
                        {allFriends.filter(f => f.status === "pending" && f.requestedByMe).length ? (
                            allFriends
                                .filter(f => f.status === "pending" && f.requestedByMe)
                                .map(friend =>
                                    renderFriendItem(
                                        friend,
                                        <button className="btn-danger text-xs" onClick={() => rejectPendingRequest(friend.user)}>
                                            Cancel
                                        </button>
                                    )
                                )
                        ) : (
                            <p className="text-sm text-text-muted text-center py-8">No pending requests sent</p>
                        )}
                    </div>
                );

            case "received":
                return (
                    <div className="space-y-3">
                        {allFriends.filter(f => f.status === "pending" && !f.requestedByMe).length ? (
                            allFriends
                                .filter(f => f.status === "pending" && !f.requestedByMe)
                                .map(friend =>
                                    renderFriendItem(
                                        friend,
                                        <>
                                            <button className="btn-primary text-xs" onClick={() => acceptPendingRequest(friend.user)}>
                                                Accept
                                            </button>
                                            <button className="btn-danger text-xs" onClick={() => rejectPendingRequest(friend.user)}>
                                                Reject
                                            </button>
                                        </>
                                    )
                                )
                        ) : (
                            <p className="text-sm text-text-muted text-center py-8">No pending requests received</p>
                        )}
                    </div>
                );

            case "remove":
                return (
                    <div className="space-y-3">
                        {allFriends.filter(f => f.status === "accepted").length ? (
                            allFriends
                                .filter(f => f.status === "accepted")
                                .map(friend =>
                                    renderFriendItem(
                                        friend,
                                        <button className="btn-danger text-xs" onClick={() => removeRequest(friend.user)}>
                                            Remove
                                        </button>
                                    )
                                )
                        ) : (
                            <p className="text-sm text-text-muted text-center py-8">No friends to remove</p>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="page-container">
            <Header />
            <main className="flex-1">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-text-primary">Manage Friends</h1>
                        <button
                            className="btn-ghost text-sm"
                            onClick={() => navigate("/friends")}
                        >
                            ← Back
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 p-1 bg-midnight-700 rounded-xl border border-midnight-500/30 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                                    activeTab === tab.key
                                        ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-midnight-600'
                                }`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="card-surface p-4 sm:p-6">
                        {renderContent()}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default ManageFriendsPage;