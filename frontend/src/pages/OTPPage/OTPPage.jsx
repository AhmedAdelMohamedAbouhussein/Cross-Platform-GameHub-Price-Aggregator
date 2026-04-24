import { useState, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import apiClient from "../../utils/apiClient.js";

import LoadingScreen from "../../components/LoadingScreen/LoadingScreen.jsx";
import AuthContext from "../../contexts/AuthContext.jsx";

function OTPPage() {
    const [searchParams] = useSearchParams();
    const userId = searchParams.get("userId");
    const email = decodeURIComponent(searchParams.get("email"));
    const purpose = searchParams.get("purpose");

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const { fetchUser, setUser } = useContext(AuthContext);

    const navigate = useNavigate();

    const getTitle = () => {
        switch (purpose) {
            case "email_verification":
                return "Email Verification";
            case "password_reset":
                return "Password Reset";
            case "restore_account":
                return "Restore Account";
            case "permanently_delete_account":
                return "Delete Account";
            case "deactivate_account":
                return "Deactivate Account";
            default:
                return "OTP Verification";
        }
    };

    const getSubtitle = () => {
        switch (purpose) {
            case "email_verification":
                return "Enter the 6-digit code sent to your email to verify your account";
            case "password_reset":
                return "Enter the 6-digit code to reset your password";
            case "restore_account":
                return "Enter the code to restore your deleted account";
            case "permanently_delete_account":
                return "Enter the code to permanently delete your account";
            case "deactivate_account":
                return "Enter the code to deactivate your account. You can restore it within 30 days by logging back in.";
            default:
                return "Enter the verification code";
        }
    };

    const handleSendOtp = async () => {
        if (!userId || !email || !purpose) {
            toast.error("Invalid verification link: missing user information");
            return;
        }

        setLoading(true);
        try {
            const res = await apiClient.post(`/mail/sendotp`, { userId, email, purpose });
            toast.success(res.data.message || "OTP sent successfully!");

            if (res.data.message === "user already verified") {
                navigate('/login', { replace: true });
            }
        }
        catch (err) {
            toast.error(err.response?.data?.message || err.message || "Error sending OTP");
        }
        finally {
            setLoading(false);
        }
    };

    const handleSubmitOtp = async () => {
        if (!userId || !purpose) {
            toast.error("Invalid verification link: missing user information");
            return;
        }

        if (!otp) {
            toast.error("Please enter the OTP");
            return;
        }

        if (!/^\d{6}$/.test(otp)) {
            toast.error("OTP must be exactly 6 digits");
            return;
        }

        setLoading(true);
        try {
            let res;
            if (purpose === "email_verification") {
                res = await apiClient.post(`/mail/verifyotp`,
                    { userId, otp, purpose },
                    { withCredentials: true }
                );
            }
            else {
                res = await apiClient.post(`/mail/verifyotp`, { userId, otp, purpose });
            }

            toast.success(res.data.message || "OTP verified successfully!");

            if (purpose === "password_reset") {
                navigate(`/resetpassword?userId=${res.data.userId}&token=${encodeURIComponent(res.data.resetToken)}`, { replace: true });
            }
            else if (purpose === "email_verification") {
                await fetchUser();
                navigate("/", { replace: true });
            }
            else if (purpose === "restore_account") {
                navigate("/login", { replace: true });
            }
            else if (purpose === "permanently_delete_account") {
                setUser(null);
                localStorage.removeItem("user");
                navigate("/", { replace: true });
            }
            else if (purpose === "deactivate_account") {
                setUser(null);
                localStorage.removeItem("user");
                navigate("/", { replace: true });
            }
        }
        catch (err) {
            toast.error(err.response?.data?.message || err.message || "Invalid OTP");
        }
        finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="page-container">
            <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
                <div className="w-full max-w-md animate-slide-up">
                    <div className="card-surface p-6 sm:p-8 space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🔐</span>
                            </div>
                            <h1 className="text-2xl font-bold text-text-primary">{getTitle()}</h1>
                            <p className="text-sm text-text-muted mt-2">{getSubtitle()}</p>
                            {email && (
                                <p className="text-xs text-text-secondary mt-1">
                                    Sent to <span className="text-accent">{email}</span>
                                </p>
                            )}
                        </div>

                        <input
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="input-field text-center text-xl tracking-[0.5em] font-mono"
                            maxLength={6}
                        />

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleSubmitOtp}
                                className="btn-primary flex-1 py-3"
                                disabled={loading}
                            >
                                Verify OTP
                            </button>
                            <button
                                onClick={handleSendOtp}
                                className="btn-secondary flex-1 py-3"
                                disabled={loading}
                            >
                                Resend Code
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default OTPPage;