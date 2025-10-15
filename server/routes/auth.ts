import { authenticateToken, AuthenticatedRequest } from "../utils/auth.js"
import { db,auth } from "../config/firebase-admin.js";
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

router.post("/google-signup", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const decodedUser = req.user;
    if (!decodedUser) return res.status(401).json({ error: "Unauthorized" });

    // Fetch full user info from Firebase Auth (to get displayName)
    const userRecord = await auth.getUser(decodedUser.uid);

    const userRef = db.collection("users").doc(decodedUser.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({
        fullName: userRecord.displayName || "",
        email: decodedUser.email || userRecord.email || "",
        institution: "",
        createdAt: new Date().toISOString(),
      });
    }

    const role = decodedUser.role || "user";

    const redirectUrl =
      role === "admin" || role === "superadmin"
        ? "/admin/select-competition"
        : role === "judge"
        ? "/judge"
        : "/participant";

    res.status(200).json({ role, redirectUrl });
  } catch (error) {
    console.error("Error in Google signup:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

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
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p>Hello,</p>
                    <p>We received a request to reset your password for your <strong>PEC-System</strong> account, 
                    the platform for Prompt Engineering Competitions.</p>
                    <p>Please click the button below to set a new password:</p>
                    <p style="text-align: center;">
                        <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #0f172a; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Reset Your Password
                        </a>
                    </p>
                    <p>If you did not request this, you can safely ignore this email and your password will remain unchanged.</p>
                    <hr style="margin: 24px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 12px; color: #666;">
                        This email was sent by <strong>PEC-System</strong>, the platform for hosting and participating in Prompt Engineering Competitions.
                    </p>
                </div>
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

        // Get user from Firebase Auth to check emailVerified
        const authUser = await admin.auth().getUser(user.uid)
        // console.log("authUser emailVerified:", authUser.emailVerified)

        if (!authUser.emailVerified) {
            return res.status(403).json({ 
                error: "Email not verified"
            })
        }

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
