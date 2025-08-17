import { authenticateToken, AuthenticatedRequest } from "../utils/auth.js"

import express from "express";
import { admin } from "../config/firebase-admin.js";
import { transporter } from "../config/email.js";
// import rateLimit from "express-rate-limit";

const router = express.Router()

interface PasswordResetRequest {
    email: string;
}

// Protected endpoint to get user role + redirect
router.post("/google-signin", authenticateToken, (req: AuthenticatedRequest, res) => {
    const user = req.user
    if (!user) return res.status(401).json({ error: "Unauthorized" })

    const role = user.role
    const redirectUrl = role === "admin" || role === "superadmin" 
        ? "/admin/select-competition"
        : role === "judge"
        ? "/judge"
        : "/participant"

    res.json({ role, redirectUrl })
})



// Rate limiter to prevent abuse
// const resetLimiter = rateLimit({
//     windowMs: 6 * 60 * 60 * 1000, // 6 hours
//     max: 3,
//     standardHeaders: true,
//     legacyHeaders: false,
//     message: {
//         error: "Too many password reset requests. Please try again later.",
//     },
// });


// Password reset endpoint (server generates link)
router.post("/reset-password", async (req, res) => {
    const { email } = req.body as PasswordResetRequest;

    if (!email) {
        return res.status(400).json({ error: "Email is required." });
    }

    try {
        // Generate password reset link using Admin SDK
        const link = await admin.auth().generatePasswordResetLink(email, {
            url: process.env.APP_ORIGIN + "/auth/login",
            handleCodeInApp: true,
        });

        // Send email via nodemailer
        await transporter.sendMail({
        from: `"No Reply" <${process.env.EMAIL_SENDER}>`,
        to: email,
        subject: "Password Reset Request",
        html: `
            <p>Hello,</p>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${link}">Reset Password</a>
            <p>If you did not request this, you can safely ignore this email.</p>
        `,
        });

        return res.json({ message: "Password reset link sent to your email!" });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to send password reset link." });
    }
});

router.post("/login", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const user = req.user
        if (!user) return res.status(401).json({ error: "Unauthorized" })

        // Determine redirect URL based on role
        const role = user.role || "participant"
        const redirectUrl =
        role === "admin" || role === "superadmin"
            ? "/admin/select-competition"
            : role === "judge"
            ? "/judge"
            : "/participant"

        res.json({ role, redirectUrl })
    } catch (err: any) {
        console.error("Login error:", err)
        res.status(500).json({ error: "Failed to login" })
    }
})


export default router
