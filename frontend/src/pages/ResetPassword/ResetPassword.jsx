import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff} from "react-icons/fi";
import axios from "axios";

import styles from './ResetPassword.module.css'
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";

function ResetPassword()
{
    const [searchParams] = useSearchParams();
    const userId = searchParams.get("userId");
    const token = decodeURIComponent(searchParams.get("token"));
    
    const [feedback, setFeedback] = useState(""); 
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
    const navigate = useNavigate();

    function validatePassword(password , confirmPassword) 
    {
        // Password validation: at least 8 chars, 1 uppercase, 1 lowercase, 1 number
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) 
        {
            const error = "Password should be at least 8 characters long and must contain at least 1 uppercase, 1 lowercase, and 1 number";
            return error;
        }
        if(password !== confirmPassword)
        {
            const error = "Passwords do not match";
            return error;
        }
        return null;
    }

    const handlePasswordSubmit = async () =>
    {
        if(!userId || !token )
        {
            setFeedback({ type: "error", message: "Invalid reset link" });
            return;
        }
        try 
        {
            const error = validatePassword(password, confirmPassword);
            if(error !== null)
            {
                setFeedback({type: "error" , message:error});
                return;
            }
            setLoading(true);

            await axios.post(`${BACKEND_URL}/api/auth/resetpassword`,
                {userId: userId, token: token, newPassword: password}
            )
            navigate('/login');
        } 
        catch (error) 
        {
            if(error.response?.data?.message)
            {
                if (error.response.data.message === "Invalid or expired reset token.")
                {
                    setFeedback({type: "error",message: "Token expired. Please request a new reset link."});
                    return setTimeout(() => {
                        navigate('/login', { replace: true });
                    }, 1500);
                }
            }
            console.log(error);
            setFeedback({ type: "error", message: error.response?.data?.message || error.message || "something went wrong"});
        }
        finally
        {
            setLoading(false);
        }
        
    }


    if (loading) 
    {
        return <LoadingScreen />;
    }

    return(
        <div className={styles.pageContainer}>
            <div className={styles.container}>
                <h1>Reset Password</h1>

                <div className={styles.passwordWrapper}>
                    <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={styles.input} minLength={8} maxLength={50}/>
                    <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword((prev) => !prev)}>{showPassword ? <FiEyeOff /> : <FiEye />}</button>
                </div>
                <div className={styles.passwordWrapper}>
                    <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={styles.input} minLength={8} maxLength={50}/>
                    <button type="button" className={styles.passwordToggle} onClick={() => setShowConfirmPassword((prev) => !prev)}>{showConfirmPassword ? <FiEyeOff /> : <FiEye />}</button>
                </div>

                {feedback && <p className={styles.feedback} style={{color: feedback.type==="error" ? "red" : "green"}}>{feedback.message}</p>}
                
                <button type="submit" className={styles.confirmButton} onClick={handlePasswordSubmit}>Submit change </button>
            </div>
        </div>
    )
}
export default ResetPassword