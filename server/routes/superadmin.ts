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

  try {
    await auth.setCustomUserClaims(uid, { role });
    return res.status(200).json({ message: `✅ Role '${role}' assigned to user ${uid}` });
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
    const role = user.customClaims?.role;

    if (role === "superadmin") {
      return res.status(403).json({ error: "❌ Cannot revoke role of another superadmin" });
    }

    await auth.setCustomUserClaims(uid, {}); // Clears role
    return res.status(200).json({ message: `✅ Role revoked for user ${uid}` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "❌ Failed to revoke role", detail: message });
  }
});


// ✅ GET /superadmin/users — all users (up to 1000)
router.get("/users", verifySuperAdmin, async (_req: RequestWithUser, res: Response) => {
  try {
    const listUsersResult = await auth.listUsers(1000);
    const users = listUsersResult.users.map((userRecord) => ({
      uid: userRecord.uid,
      email: userRecord.email || "",
      displayName: userRecord.displayName || "",
      role: userRecord.customClaims?.role || "user",
    }));

    return res.status(200).json({ users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "❌ Failed to fetch users", detail: message });
  }
});

// ✅ NEW: GET /superadmin/user-by-email?q=email@example.com
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
    };

    return res.status(200).json(user);
  } catch (err: any) {
    return res.status(404).json({ error: "User not found", detail: err.message });
  }
});

export default router;
