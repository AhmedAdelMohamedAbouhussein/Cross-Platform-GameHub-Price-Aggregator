import { useState, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import axios from "axios";

import styles from "./OTPPage.module.css";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen.jsx";
import AuthContext from "../../contexts/AuthContext.jsx";

function OTPPage() 
{
    const [searchParams] = useSearchParams();
    const userId = searchParams.get("userId");
    const email = decodeURIComponent(searchParams.get("email"));
    const purpose = searchParams.get("purpose")

    const [otp, setOtp] = useState("");          
    const [feedback, setFeedback] = useState(""); 
    const [loading, setLoading] = useState(false);
    const { fetchUser } = useContext(AuthContext); // 👈 get from context 

    const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
    const navigate = useNavigate();

    // Dynamic page title
    const getTitle = () => 
    {
        switch (purpose) {
            case "email_verification":
                return "Email Verification";
            case "password_reset":
                return "Password Reset Verification";
            case "restore_account":
                return "Restore Account Verification";
            case "permanently_delete_account":
                return "Delete Account Verification";
            default:
                return "OTP Verification";
        }
    };


    // Send a new OTP
    const handleSendOtp = async () => 
    {
        if (!userId || !email || !purpose) 
        {
            setFeedback("Invalid verification link: missing user information");
            return;
        }

        setLoading(true);
        setFeedback("");
        try 
        {
            const res = await axios.post(`${BACKEND_URL}/api/mail/sendotp`, { userId, email, purpose });
            
            setFeedback(res.data.message || "OTP sent successfully!");

            if(res.data.message === "user already verified")
            {
                navigate('/login', { replace: true });
            }

        } 
        catch (err) 
        {
            setFeedback(err.response?.data?.message || err.message || "Error sending OTP");
        } 
        finally 
        {
            setLoading(false);
        }
    };

    // Submit OTP for verification
    const handleSubmitOtp = async () => 
    {
        if (!userId || !purpose) {
            setFeedback("Invalid verification link: missing user information");
            return;
        }

        if (!otp) {
            return setFeedback("Please enter the OTP");
        }

        if (!/^\d{6}$/.test(otp)) {
            return setFeedback("OTP must be exactly 6 digits");
        }

        setLoading(true);
        setFeedback("");
        try 
        {
            let res;
            if(purpose === "email_verification")
            {
                res = await axios.post(`${BACKEND_URL}/api/mail/verifyotp`, 
                    { userId: userId, otp: otp, purpose: purpose },
                    { withCredentials: true } // 🔑 so cookies/sessions work
                );
            }
            else
            {
                res = await axios.post(`${BACKEND_URL}/api/mail/verifyotp`, { userId: userId, otp: otp, purpose: purpose });
            }
            
            setFeedback(res.data.message || "OTP verified successfully!");
            
            if (purpose === "password_reset") 
            {
                navigate(`/resetpassword?userId=${res.data.userId}&token=${encodeURIComponent(res.data.resetToken)}`, { replace: true });
            }
            else if (purpose === "email_verification") 
            {
                await fetchUser(); // ⏳ wait until it finishes
                navigate("/", { replace: true });
            } 
            else if (purpose === "restore_account") 
            {
                navigate("/login", { replace: true });
            }
            else if (purpose === "permanently_delete_account") 
            {
                navigate("/", { replace: true });
            }
        } 
        catch (err) 
        {
            setFeedback(err.response?.data?.message || err.message || "Invalid OTP");
        } 
        finally 
        {
            setLoading(false);
        }
    };

    if (loading) 
    {
        return <LoadingScreen />;
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.container}>
                <h1>{getTitle()}</h1>

                <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className={styles.input} maxLength={6}/>

                <div className={styles.buttonContainer}>
                    <button onClick={handleSubmitOtp} className={styles.button} disabled={loading}>Submit OTP</button>
                    <button onClick={handleSendOtp} className={styles.button} disabled={loading}>Send New OTP</button>
                </div>

                {feedback && <p className={styles.feedback} style={{color: feedback.type==="error" ? "red" : "green"}}>{feedback.message}</p>}
            </div>
        </div>
    );
}

export default OTPPage;