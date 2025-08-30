import { useState, useContext } from "react";
import axios from "axios";
import Styles from "./AddFriendPage.module.css";
import AuthContext from "../../contexts/AuthContext";

function AddFriendPage() {
    const [showInput, setShowInput] = useState(false);
    const [friendId, setFriendId] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const { user, setUser } = useContext(AuthContext);
    const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;

    const handleSendRequest = async () => {
        if (!friendId.trim()) return;
        setLoading(true);
        setMessage("");

        try {
            const res = await axios.post(`${BACKEND_URL}/friends/add/${friendId}`, { userId: user._id });

            // Update context locally
            setUser(prev => {
                const updated = { ...prev };
                if (!updated.friends.User) updated.friends.User = [];
                updated.friends.User.push({ user: friendId, status: "pending", requestedByMe: true });
                return updated;
            });

            setMessage("Request sent!");
            setFriendId("");
            setShowInput(false);
        } catch (err) {
            console.error(err);
            setMessage("Failed to send request.");
        }

        setLoading(false);
    };

    return (
        <div className={Styles.addFriendModule}>
            {!showInput ? (
                <button 
                    className={Styles.addFriendBtn} 
                    onClick={() => setShowInput(true)}
                    disabled={loading}
                >
                    Add Friend
                </button>
            ) : (
                <div className={Styles.inputContainer}>
                    <input 
                        type="text" 
                        placeholder="Enter username or ID" 
                        value={friendId} 
                        onChange={e => setFriendId(e.target.value)} 
                        disabled={loading}
                        className={Styles.friendInput}
                    />
                    <button onClick={handleSendRequest} disabled={loading} className={Styles.sendBtn}>
                        {loading ? "Sending..." : "Send"}
                    </button>
                    <button 
                        onClick={() => { setShowInput(false); setMessage(""); }} 
                        disabled={loading} 
                        className={Styles.cancelBtn}
                    >
                        Cancel
                    </button>
                </div>
            )}
            {message && <div className={Styles.message}>{message}</div>}
        </div>
    );
}

export default AddFriendPage;
