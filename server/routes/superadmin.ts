import express, { Response, NextFunction } from "express";
import { admin, auth, db } from "../config/firebase-admin.js";
import { Request } from "express";
// import { sendEmailVerification } from "firebase/auth"
import { transporter } from "../config/email.js";

const router = express.Router();

interface DecodedToken {
  uid: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

interface RequestWithUser extends Request {
  user?: DecodedToken;
}

// Middleware: Verify superadmin token
async function verifySuperAdmin(req: RequestWithUser, res: Response, next: NextFunction) {
  const idToken = req.headers.authorization?.split("Bearer ")[1];

  if (!idToken) {
    return res.status(401).json({ error: "Unauthorized: No token provided." });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userRole = (decodedToken as any).role;

    if (userRole !== "superadmin") {
      return res.status(403).json({ error: "Forbidden: Superadmin access required." });
    }

    req.user = decodedToken;
    next();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(401).json({ error: "Invalid token", detail: message });
  }
}

// POST /superadmin/assign-role
router.post("/assign-role", verifySuperAdmin, async (req: RequestWithUser, res: Response) => {
  const { uid, role } = req.body;
  if (!uid || !role) {
    return res.status(400).json({ error: "uid and role are required" });
  }

  // Validate role
  const validRoles = ["admin", "judge", "superadmin", "user"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role specified" });
  }

  try {
    // Fetch target user
    const userRecord = await auth.getUser(uid);
    const targetRole = userRecord.customClaims?.role;

    // Prevent *any* superadmin from modifying *another* superadmin
    if (targetRole === "superadmin" && req.user?.uid !== uid) {
      return res.status(403).json({
        error: "Forbidden: Cannot change role of another superadmin."
      });
    }

    // Prevent self‑demotion (superadmin→non‑superadmin)
    if (req.user?.uid === uid && role !== "superadmin") {
      return res.status(403).json({
        error: "Forbidden: Cannot change your own superadmin role."
      });
    }

    // Finally, apply the new role
    await auth.setCustomUserClaims(uid, { role });
    await auth.revokeRefreshTokens(uid);
  
    return res.status(200).json({
      message: `Role '${role}' assigned to user ${userRecord.email || uid}`,
      user: {
        uid: userRecord.uid,
        email: userRecord.email || "",
        displayName: userRecord.displayName || "",
        role
      }
    });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    return res.status(500).json({
      error: "❌ Failed to assign role",
      detail
    });
  }
});


// POST /superadmin/revoke-role
router.post(
  "/revoke-role",
  verifySuperAdmin,
  async (req: RequestWithUser, res: Response) => {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ error: "uid is required" });
    }

    try {
      // Fetch target user
      const userRecord = await auth.getUser(uid);
      const targetRole = userRecord.customClaims?.role;

      // 1) No superadmin may touch another superadmin
      if (targetRole === "superadmin" && req.user?.uid !== uid) {
        return res
          .status(403)
          .json({ error: "Forbidden: Cannot revoke role of another superadmin." });
      }

      // 2) Cannot revoke your own superadmin role
      if (req.user?.uid === uid) {
        return res
          .status(403)
          .json({ error: "Forbidden: Cannot revoke your own superadmin role." });
      }

      // Demote to "user"
      await auth.setCustomUserClaims(uid, { role: "user" });
      await auth.revokeRefreshTokens(uid);

      return res.status(200).json({
        message: `Role revoked for user ${userRecord.email || uid}`,
        user: {
          uid: userRecord.uid,
          email: userRecord.email || "",
          displayName: userRecord.displayName || "",
          role: "user",
        },
      });
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : String(err);
      return res
        .status(500)
        .json({ error: "❌ Failed to revoke role", detail });
    }
  }
);

// DELETE /superadmin/delete-user
router.delete(
  "/delete-user",
  verifySuperAdmin,
  async (req: RequestWithUser, res: Response) => {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ error: "uid is required" });
    }

    try {
      // Fetch target user
      const userRecord = await auth.getUser(uid);
      const targetRole = userRecord.customClaims?.role;

      // 1) No superadmin may delete another superadmin
      if (targetRole === "superadmin" && req.user?.uid !== uid) {
        return res
          .status(403)
          .json({ error: "Forbidden: Cannot delete another superadmin." });
      }

      // 2) Cannot delete your own account
      if (req.user?.uid === uid) {
        return res
          .status(403)
          .json({ error: "Forbidden: Cannot delete your own superadmin account." });
      }

      await auth.deleteUser(uid);
      return res.status(200).json({
        message: `User ${userRecord.email || uid} has been deleted successfully`,
      });
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : String(err);
      return res
        .status(500)
        .json({ error: "❌ Failed to delete user", detail });
    }
  }
);

// POST /superadmin/create-user
router.post("/create-user", verifySuperAdmin, async (req: RequestWithUser, res: Response) => {
  const { email, password, displayName, role } = req.body;

  const allowedRoles = ["superadmin", "admin", "judge"];

  // Basic presence check
  if (!email || !password || !displayName || !role) {
    return res.status(400).json({ error: "All fields are required: email, password, displayName, role" });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Password validation
  const validatePassword = (pw: string): string | null => {
    if (pw.length <= 10) return "Password must be longer than 10 characters.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw)) return "Password must include at least one special character.";
    if (!/\d/.test(pw)) return "Password must include at least one number.";
    if (!/[A-Z]/.test(pw)) return "Password must include at least one capital letter.";
    return null;
  };

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  // Role validation
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${allowedRoles.join(", ")}` });
  }

  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
      emailVerified: true
    });

    // Assign custom role claim
    await auth.setCustomUserClaims(userRecord.uid, { role });
    const institution = ""; // An empty string is valid, though may not be useful
    // console.log(`Creating user in Firestore: ${userRecord.uid}`);
    await db.collection("users").doc(userRecord.uid).set({
      displayName,                  // Must be a defined string
      email,                     // Must be a defined string
      institution,               // Empty string is fine if intentional
      createdAt: new Date().toISOString(), // ISO string timestamp
      isVerified: true,          // Boolean flag
    });
    
    // 4) Generate reset link
    let resetLink: string | null = null;
    try {
      const origin = process.env.APP_ORIGIN || "http://localhost:3000";
      if (!origin) console.warn("⚠️ APP_ORIGIN is not set. Using firebase default link.");
      const actionCodeSettings = origin ? {
        url: `${origin}/auth/login/admin`,
        handleCodeInApp: true,
      } : undefined;

      resetLink = await auth.generatePasswordResetLink(email, actionCodeSettings as any);
    } catch (e: any) {
      console.error("Reset link generation failed:", e?.code, e?.message);
      // If this fails, you'll still return 201 below, with resetLink null
    }

try {
  await transporter.sendMail({
    from: "enlightechy@gmail.com",
    to: email,
    subject: "Your account is ready - set your password",
    html: `
      <p>Hi ${displayName},</p>
      <p>An administrator created an account for you.</p>
      <p><strong>Username:</strong> ${email}</p>
      <p>Please set your password using this secure link:</p>
      <p><a href="${resetLink}">Set Password</a></p>
    `,
  });
} catch (emailErr: any) {
  console.error("❌ Failed to send verification email:", emailErr);
}

    // await sendEmailVerification(user);

    return res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully for ${email}`,
      user: {
        uid: userRecord.uid,
        email: userRecord.email || "",
        displayName: userRecord.displayName || "",
        role
      }
    });
  } catch (err: any) {
    let errorMessage = "Failed to create user account";

    if (err.code === "auth/email-already-exists") {
      errorMessage = "Email already exists";
    } else if (err.code === "auth/invalid-email") {
      errorMessage = "Invalid email format";
    } else if (err.code === "auth/weak-password") {
      errorMessage = "Password is too weak";
    }

    return res.status(400).json({
      error: `❌ ${errorMessage}`,
      detail: err.message
    });
  }
});


// GET /superadmin/users — include Firestore profile, auto-paginate
router.get("/users", verifySuperAdmin, async (req, res) => {
  try {
    const { role, limit = "50" } = req.query
    const maxResults = Math.min(parseInt(limit as string, 10) || 50, 1000)

    let users: any[] = []
    let pageToken: string | undefined = undefined

    // Keep fetching until we reach the requested limit or run out of users
    do {
      const list = await auth.listUsers(maxResults, pageToken)
      users.push(...list.users.map(u => ({
        uid: u.uid,
        email: u.email || "",
        displayName: u.displayName || "",
        role: (u.customClaims as any)?.role || "user",
        createdAt: u.metadata.creationTime,
        lastSignIn: u.metadata.lastSignInTime,
        emailVerified: u.emailVerified,
      })))

      pageToken = list.pageToken

      // Stop if we already have enough users
      if (users.length >= maxResults) break
    } while (pageToken)

    // Filter by role early if provided
    if (role && role !== "all") {
      users = users.filter(u => u.role === role)
    }

    // Merge Firestore profile for these users
    const docs = await Promise.all(users.map(u =>
      db.collection("users").doc(u.uid).get()
    ))
    const profileByUid = new Map(docs.filter(d => d.exists).map(d => [d.id, d.data()]))

    users = users.map(u => {
      const p = profileByUid.get(u.uid) || {}
      return {
        ...u,
        displayName: u.displayName || (p.fullName ?? ""),
        participations: p.participations ?? {},
      }
    })

    // Sort
    const rolePriority = { superadmin: 0, admin: 1, judge: 2, user: 3 }
    users.sort((a, b) => {
      const ap = rolePriority[a.role as keyof typeof rolePriority] ?? 4
      const bp = rolePriority[b.role as keyof typeof rolePriority] ?? 4
      if (ap !== bp) return ap - bp
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })

    res.json({
      users: users.slice(0, maxResults), // in case we fetched more than needed
      total: users.length,
      hasNextPage: Boolean(pageToken),
      nextPageToken: pageToken || null
    })
  } catch (err: any) {
    res.status(500).json({ error: "❌ Failed to fetch users", detail: err.message || String(err) })
  }
})



// GET /superadmin/user-by-email?q=email@example.com
router.get("/user-by-email", verifySuperAdmin, async (req: RequestWithUser, res: Response) => {
  const email = req.query.q as string;

  if (!email) {
    return res.status(400).json({ error: "Missing email query param 'q'" });
  }

  try {
    const userRecord = await auth.getUserByEmail(email);
    const user = {
      uid: userRecord.uid,
      email: userRecord.email || "",
      displayName: userRecord.displayName || "",
      role: userRecord.customClaims?.role || "user",
      createdAt: userRecord.metadata.creationTime,
      lastSignIn: userRecord.metadata.lastSignInTime,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled
    };

    return res.status(200).json(user);
  } catch (err: any) {
    return res.status(404).json({ error: "User not found", detail: err.message });
  }
});

// GET /superadmin/stats
router.get("/stats", verifySuperAdmin, async (req: RequestWithUser, res: Response) => {
  try {
    const listUsersResult = await auth.listUsers(1000);
    const users = listUsersResult.users.map((userRecord) => ({
      role: userRecord.customClaims?.role || "user",
      disabled: userRecord.disabled
    }));

    const stats = {
      total: users.length,
      superadmins: users.filter(u => u.role === "superadmin").length,
      admins: users.filter(u => u.role === "admin").length,
      judges: users.filter(u => u.role === "judge").length,
      users: users.filter(u => u.role === "user").length,
      disabled: users.filter(u => u.disabled).length,
      active: users.filter(u => !u.disabled).length
    };

    return res.status(200).json(stats);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "❌ Failed to fetch stats", detail: message });
  }
});

export default router;