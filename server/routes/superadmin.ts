import express, { Response, NextFunction } from "express";
import { admin, auth } from "../config/firebase-admin.js";
import { Request } from "express";

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

// 🧠 Middleware: Verify superadmin token
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

// ✅ POST /superadmin/assign-role
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
    // Check if user exists
    const userRecord = await auth.getUser(uid);
    
    // Prevent superadmin from demoting themselves
    if (req.user?.uid === uid && role !== "superadmin") {
      return res.status(403).json({ error: "Cannot change your own superadmin role" });
    }

    await auth.setCustomUserClaims(uid, { role });
    
    return res.status(200).json({ 
      message: `✅ Role '${role}' assigned to user ${userRecord.email || uid}`,
      user: {
        uid: userRecord.uid,
        email: userRecord.email || "",
        displayName: userRecord.displayName || "",
        role: role
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "❌ Failed to assign role", detail: message });
  }
});

// ✅ POST /superadmin/revoke-role
router.post("/revoke-role", verifySuperAdmin, async (req: RequestWithUser, res: Response) => {
  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: "uid is required" });
  }

  try {
    const user = await auth.getUser(uid);
    const currentRole = user.customClaims?.role;

    // Prevent superadmin from revoking their own role
    if (req.user?.uid === uid) {
      return res.status(403).json({ error: "❌ Cannot revoke your own role" });
    }

    // Prevent revoking other superadmin roles
    if (currentRole === "superadmin") {
      return res.status(403).json({ error: "❌ Cannot revoke role of another superadmin" });
    }

    await auth.setCustomUserClaims(uid, { role: "user" }); // Set to user instead of clearing
    return res.status(200).json({ 
      message: `✅ Role revoked for user ${user.email || uid}`,
      user: {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        role: "user"
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "❌ Failed to revoke role", detail: message });
  }
});

// ✅ DELETE /superadmin/delete-user
router.delete("/delete-user", verifySuperAdmin, async (req: RequestWithUser, res: Response) => {
  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: "uid is required" });
  }

  try {
    const user = await auth.getUser(uid);
    const currentRole = user.customClaims?.role;

    // Prevent superadmin from deleting themselves
    if (req.user?.uid === uid) {
      return res.status(403).json({ error: "❌ Cannot delete your own account" });
    }

    // Prevent deleting other superadmins
    if (currentRole === "superadmin") {
      return res.status(403).json({ error: "❌ Cannot delete another superadmin" });
    }

    await auth.deleteUser(uid);
    return res.status(200).json({ 
      message: `✅ User ${user.email || uid} has been deleted successfully`
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "❌ Failed to delete user", detail: message });
  }
});

// ✅ POST /superadmin/create-judge
router.post("/create-judge", verifySuperAdmin, async (req: RequestWithUser, res: Response) => {
  const { email, password, displayName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long" });
  }

  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
      emailVerified: false
    });

    // Assign judge role
    await auth.setCustomUserClaims(userRecord.uid, { role: "judge" });

    return res.status(201).json({
      message: `✅ Judge account created successfully for ${email}`,
      user: {
        uid: userRecord.uid,
        email: userRecord.email || "",
        displayName: userRecord.displayName || "",
        role: "judge"
      }
    });
  } catch (err: any) {
    let errorMessage = "Failed to create judge account";
    
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

// ✅ GET /superadmin/users — all users with pagination and filtering
router.get("/users", verifySuperAdmin, async (req: RequestWithUser, res: Response) => {
  try {
    const { role, limit = "50" } = req.query;
    const maxResults = parseInt(limit as string, 10);

    const listUsersResult = await auth.listUsers(Math.min(maxResults, 1000));
    let users = listUsersResult.users.map((userRecord) => ({
      uid: userRecord.uid,
      email: userRecord.email || "",
      displayName: userRecord.displayName || "",
      role: userRecord.customClaims?.role || "user",
      createdAt: userRecord.metadata.creationTime,
      lastSignIn: userRecord.metadata.lastSignInTime,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled
    }));

    // Filter by role if specified
    if (role && role !== "all") {
      users = users.filter(user => user.role === role);
    }

    // Sort by role priority and creation date
    const rolePriority = { superadmin: 0, admin: 1, judge: 2, user: 3 };
    users.sort((a, b) => {
      const aPriority = rolePriority[a.role as keyof typeof rolePriority] ?? 4;
      const bPriority = rolePriority[b.role as keyof typeof rolePriority] ?? 4;
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return res.status(200).json({ 
      users,
      total: users.length,
      hasNextPage: listUsersResult.pageToken ? true : false
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "❌ Failed to fetch users", detail: message });
  }
});

// ✅ GET /superadmin/user-by-email?q=email@example.com
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

// ✅ GET /superadmin/stats
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