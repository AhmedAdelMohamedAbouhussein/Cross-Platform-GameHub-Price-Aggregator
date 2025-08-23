import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import axios from "axios";

import styles from "./OTPPage.module.css";
import LoadingScreen from "../LoadingScreen/LoadingScreen";

function OTPPage() 
{
    const [searchParams] = useSearchParams();
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    const [otp, setOtp] = useState("");          
    const [feedback, setFeedback] = useState(""); 
    const [loading, setLoading] = useState(false);

    const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
    const navigate = useNavigate();

    // Send a new OTP
    const handleSendOtp = async () => 
    {
        if (!userId || !email) {
            setFeedback("Invalid verification link: missing user information");
            return;
        }

        setLoading(true);
        setFeedback("");
        try 
        {
            const res = await axios.post(`${BACKEND_URL}/api/mail/sendotp`, { userId, email });
            setFeedback(res.data.message || "OTP sent successfully!");

            if(res.data.message === "user already verified")
            {
                setTimeout(() => {
                    navigate('/login', { replace: true });
                }, 1500);
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
        if (!userId) {
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
            const res = await axios.post(`${BACKEND_URL}/api/mail/verifyotp`, { userId: userId, otp: otp });
            setFeedback(res.data.message || "OTP verified successfully!");

            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 1500);
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
        <div className={styles.container}>
            <h1>Email Verification</h1>

            <input 
                type="text" 
                placeholder="Enter OTP" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                className={styles.input}
                maxLength={6} // prevent typing more than 6 digits
            />

            <div className={styles.buttonContainer}>
                <button onClick={handleSendOtp} className={styles.button} disabled={loading}>Send New OTP</button>
                <button onClick={handleSubmitOtp} className={styles.button} disabled={loading}>Submit OTP</button>
            </div>

            {feedback && <p className={styles.feedback}>{feedback}</p>}
        </div>
    );
}

export default OTPPage;