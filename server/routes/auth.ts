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

router.post('/send-verification-email', async (req, res) => {
  // IMPORTANT: For security, ensure this endpoint is protected.
  // E.g., if the user is already registered and logged in,
  // verify their Firebase ID Token here to ensure they are who they say they are.
  // For a registration flow, you might create the user first, then send this.
  const { email, uid } = req.body; // Expecting user's email and UID from the frontend

  if (!email || !uid) {
    return res.status(400).json({ message: 'Email and UID are required.' });
  }

  try {
    const userRecord = await admin.auth().getUser(uid);

    // Optional: Add more checks (e.g., ensure email matches UID's email if already created)
    if (userRecord.email !== email) {
      return res.status(403).json({ message: 'Provided email does not match user record.' });
    }

    if (userRecord.emailVerified) {
      return res.status(200).json({ message: 'Email already verified.' });
    }

    // Configure actionCodeSettings for your custom handler and domain
    // The `url` here is where the user will land AFTER clicking the verification link.
    // Make sure this is a public page/route on your domain.
    const actionCodeSettings: admin.auth.ActionCodeSettings = {
      url: 'https://appec-qa.etlonline.org/auth/login', // Your post-verification landing page
      handleCodeInApp: true, // Set to true if you want to handle the code in your app
      // You can also specify an Android or iOS package name if you have native apps
    };

    // Generate the email verification link using Firebase Admin SDK
    const link = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);

    // --- Send the custom email using Nodemailer ---
    // const mailOptions = {
    //   from: process.env.EMAIL_SENDER_ADDRESS || 'noreply@appec-qa.etlonline.org', // Must be a verified sender in your SMTP service
    //   to: email,
    //   subject: 'Verify Your Email Address for Prompt Engineering Competitions',
    //   html: `
    //     <p>Hello,</p>
    //     <p>Thank you for registering with appec-qa.etlonline.org!</p>
    //     <p>To complete your registration, please verify your email address by clicking the link below:</p>
    //     <p><a href="${link}">Verify My Email</a></p>
    //     <p>If you did not create an account, please ignore this email.</p>
    //     <p>Thanks,<br>The appec-qa.etlonline.org Team</p>
    //   `,
    // };

    const mailOptions = {
  from: process.env.EMAIL_SENDER_ADDRESS || 'noreply@appec-qa.etlonline.org',
  to: email,
  subject: 'Confirm Your Registration – ETLOnline Prompt Engineering Competitions',
  html: `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f7; padding: 40px 0; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background: linear-gradient(to right, #1e293b, #334155); padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Prompt Engineering Competitions</h1>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #111827;">Hello,</p>

          <p style="font-size: 15px; color: #374151; line-height: 1.6;">
            Thank you for registering for the <strong>Prompt Engineering Competitions</strong> hosted on 
            <a href="https://appec-qa.etlonline.org" style="color: #2563eb; text-decoration: none;">appec-qa.etlonline.org</a>.
          </p>

          <p style="font-size: 15px; color: #374151; line-height: 1.6;">
            To complete your registration and access your competition dashboard, please verify your email address by clicking the button below:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">
              Verify My Email
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
            If you did not register for this competition, please disregard this message.
          </p>

          <p style="font-size: 15px; color: #374151; margin-top: 32px;">
            Regards,<br>
            <strong>ETLOnline Team</strong><br>
            <a href="https://appec-qa.etlonline.org" style="color: #2563eb; text-decoration: none;">appec-qa.etlonline.org</a>
          </p>
        </div>
      </div>
      <div style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
        © ${new Date().getFullYear()} Prompt Engineering Competitions. All rights reserved.
      </div>
    </div>
  `,
};

    await transporter.sendMail(mailOptions);

    console.log(`Verification email sent successfully to ${email}`);
    res.status(200).json({ message: 'Verification email sent successfully!' });

  } catch (error: any) {
    console.error('Error sending custom email verification:', error);
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(500).json({ message: 'Failed to send verification email.', error: error.message });
  }
});


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
                error: "Email not verified",
                message: "Please verify your email before logging in."
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
