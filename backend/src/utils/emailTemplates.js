/**
 * Generates a premium HTML email template for OTP delivery
 * @param {string} userName - The name of the user
 * @param {string} otp - The 6-digit OTP code
 * @param {string} purpose - The purpose of the OTP
 * @returns {string} - The full HTML string
 */
export const generateOtpEmail = (userName, otp, purpose) => {
    const purposeMap = {
        email_verification: {
            title: "Verify Your Email",
            action: "confirm your email address",
            color: "#10B981" // Blue
        },
        password_reset: {
            title: "Password Reset Request",
            action: "reset your account password",
            color: "#10B981" // Purple
        },
        restore_account: {
            title: "Account Restoration",
            action: "restore your deleted account",
            color: "#10B981" // Green
        },
        permanently_delete_account: {
            title: "Action Required: Account Deletion",
            action: "permanently delete your account",
            color: "#EF4444" // Red
        }
    };

    const config = purposeMap[purpose] || {
        title: "Security Verification",
        action: "verify your identity",
        color: "#10B981"
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0F14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E6EDF3;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
            <td align="center" style="padding: 40px 0 20px 0;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #161B22; border-radius: 16px; border: 1px solid #30363D; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px 40px;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 800; -webkit-background-clip: text; color: transparent;">GameHub</h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 20px 40px 40px 40px; text-align: center;">
                            <h2 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 600; color: #F0F6FC;">${config.title}</h2>
                            <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #8B949E;">
                                Hi ${userName || 'Gamer'},<br>
                                You requested to ${config.action}. Use the verification code below to proceed:
                            </p>

                            <!-- OTP Box -->
                            <div style="background-color: #0D1117; border: 2px solid ${config.color}; border-radius: 12px; padding: 24px; margin-bottom: 30px; display: inline-block;">
                                <span style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 800; letter-spacing: 12px; color: ${config.color}; text-shadow: 0 0 10px ${config.color}44;">${otp}</span>
                            </div>

                            <p style="margin: 0; font-size: 14px; color: #8B949E;">
                                This code will expire in <strong style="color: #F0F6FC;">10 minutes</strong>.
                                <br>
                                If you did not request this code, please ignore this email or contact support.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #0D1117; border-top: 1px solid #30363D; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #484F58;">
                                &copy; ${new Date().getFullYear()} GameHub. All rights reserved.
                                <br>
                                <br>
                                This is an automated security message. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};
