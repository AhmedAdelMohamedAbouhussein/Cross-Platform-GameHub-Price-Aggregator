import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "sonner";
import apiClient from "../../utils/apiClient.js";

import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const userId = searchParams.get("userId");
    const token = decodeURIComponent(searchParams.get("token"));

    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const navigate = useNavigate();

    function validatePassword(password, confirmPassword) {
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
            return "Password should be at least 8 characters long and must contain at least 1 uppercase, 1 lowercase, and 1 number";
        }
        if (password !== confirmPassword) {
            return "Passwords do not match";
        }
        return null;
    }

    const handlePasswordSubmit = async () => {
        if (!userId || !token) {
            toast.error("Invalid reset link");
            return;
        }
        try {
            const error = validatePassword(password, confirmPassword);
            if (error !== null) {
                toast.error(error);
                return;
            }
            setLoading(true);

            await apiClient.post(`/auth/resetpassword`,
                { userId, token, newPassword: password }
            );
            toast.success("Password reset successfully!");
            navigate('/login');
        }
        catch (error) {
            if (error.response?.data?.message) {
                if (error.response.data.message === "Invalid or expired reset token.") {
                    toast.error("Token expired. Please request a new reset link.");
                    return setTimeout(() => {
                        navigate('/login', { replace: true });
                    }, 1500);
                }
            }
            toast.error(error.response?.data?.message || error.message || "Something went wrong");
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
                                <span className="text-3xl">🔑</span>
                            </div>
                            <h1 className="text-2xl font-bold text-text-primary">Reset Password</h1>
                            <p className="text-sm text-text-muted mt-2">Enter your new password below</p>
                        </div>

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="New Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field pr-12"
                                minLength={8}
                                maxLength={50}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors p-1"
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                            </button>
                        </div>

                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input-field pr-12"
                                minLength={8}
                                maxLength={50}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors p-1"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                            >
                                {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                            </button>
                        </div>

                        <button
                            type="button"
                            className="btn-primary w-full py-3 text-base"
                            onClick={handlePasswordSubmit}
                        >
                            Reset Password
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ResetPassword;