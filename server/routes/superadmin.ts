import express, { Response, NextFunction } from "express";
import { clerkClient, db } from "../config/firebase-admin.js";
import { Request } from "express";
import { verifyToken } from "@clerk/backend";
import { transporter } from "../config/email.js";
import { getUserRole } from "../utils/userService.js";

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
    // Verify Clerk token
    const sessionClaims = await verifyToken(idToken, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    const uid = sessionClaims.sub;
    
    // Get user role from Firestore
    const userRole = await getUserRole(uid);

    if (userRole !== "superadmin") {
      return res.status(403).json({ error: "Forbidden: Superadmin access required." });
    }

    req.user = {
      uid,
      email: sessionClaims.email as string,
      role: userRole,
    };
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
  const validRoles = ["admin", "judge", "superadmin", "participant"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role specified" });
  }

  try {
    // Fetch target user from Clerk
    const user = await clerkClient.users.getUser(uid);
    
    // Get user role from Firestore
    const userDoc = await db.collection("users").doc(uid).get();
    const targetRole = userDoc.exists ? userDoc.data()?.role : null;

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

    // Update role in Firestore
    await db.collection("users").doc(uid).update({
      role: role
    });
  
    return res.status(200).json({
      message: `Role '${role}' assigned to user ${user.emailAddresses[0]?.emailAddress || uid}`,
      user: {
        uid: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        displayName: user.fullName || "",
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
      // Fetch target user from Clerk
      const user = await clerkClient.users.getUser(uid);
      
      // Get user role from Firestore
      const userDoc = await db.collection("users").doc(uid).get();
      const targetRole = userDoc.exists ? userDoc.data()?.role : null;

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

      // Demote to "participant" (default role) in Firestore
      await db.collection("users").doc(uid).update({
        role: "participant"
      });

      return res.status(200).json({
        message: `Role revoked for user ${user.emailAddresses[0]?.emailAddress || uid}`,
        user: {
          uid: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          displayName: user.fullName || "",
          role: "participant",
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
      // Fetch target user from Clerk
      const user = await clerkClient.users.getUser(uid);
      
      // Get user role from Firestore
      const userDoc = await db.collection("users").doc(uid).get();
      const targetRole = userDoc.exists ? userDoc.data()?.role : null;

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

      // Delete user from Clerk
      await clerkClient.users.deleteUser(uid);
      
      // Also delete user document from Firestore
      try {
        await db.collection("users").doc(uid).delete();
      } catch (deleteError) {
        console.warn("Could not delete user document from Firestore:", deleteError);
      }
      
      return res.status(200).json({
        message: `User ${user.emailAddresses[0]?.emailAddress || uid} has been deleted successfully`,
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
  const { email, displayName, role } = req.body;

  const allowedRoles = ["superadmin", "admin", "judge"];

  // Basic presence check
  if (!email || !displayName || !role) {
    return res.status(400).json({ error: "Required: email, displayName, role" });
  }

  // Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Role validation
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${allowedRoles.join(", ")}` });
  }

  try {
    // 1) Create user in Clerk with an invitation
    // Clerk will send invitation email automatically
    const user = await clerkClient.users.createUser({
      emailAddress: [email],
      firstName: displayName.split(" ")[0] || displayName,
      lastName: displayName.split(" ").slice(1).join(" ") || "",
      skipPasswordRequirement: true, // User will set password via invitation
    });

    // 2) Create Firestore profile with role
    await db.collection("users").doc(user.id).set({
      fullName: displayName,
      email,
      institution: "",
      gender: "",
      city: "",
      province: "",
      majors: "",
      category: "Uni Students",
      linkedin: "",
      bio: "",
      consent: false,
      role,
      createdAt: new Date().toISOString(),
    });

    // 3) Create and send invitation via Clerk
    let inviteSent = false;
    try {
      await clerkClient.invitations.createInvitation({
        emailAddress: email,
        redirectUrl: `${process.env.APP_ORIGIN}/auth/login`,
      });
      inviteSent = true;
    } catch (inviteErr: any) {
      console.error("❌ Failed to send Clerk invitation:", inviteErr);
      // You can optionally send a custom email here
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_SENDER,
          to: email,
          subject: "Your account is ready",
          html: `
            <p>Hi ${displayName},</p>
            <p>An administrator has created a <strong>${role}</strong> account for you on our platform.</p>
            <p><strong>Email:</strong> ${email}</p>
            <p>Please visit <a href="${process.env.APP_ORIGIN}/auth/login">the login page</a> to set up your account.</p>
            <p>If you did not expect this invitation, you can safely ignore this email.</p>
          `,
        });
        inviteSent = true;
      } catch (emailErr: any) {
        console.error("❌ Failed to send custom email:", emailErr);
      }
    }

    return res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created${inviteSent ? ' and invitation sent' : ''} to ${email}`,
      user: {
        uid: user.id,
        email: email,
        displayName: displayName,
        role,
        inviteSent,
      },
    });
  } catch (err: any) {
    // Handle Clerk-specific errors
    if (err.errors && err.errors[0]?.code === "form_identifier_exists") {
      return res.status(409).json({ error: "Email already exists" });
    }
    return res.status(400).json({ 
      error: "Failed to create user account", 
      detail: err.message || String(err)
    });
  }
});



// GET /superadmin/users — include Firestore profile, auto-paginate
router.get("/users", verifySuperAdmin, async (req, res) => {
  try {
    const { role, limit = "50" } = req.query
    const maxResults = Math.min(parseInt(limit as string, 10) || 50, 500)

    // Fetch users from Clerk with pagination
    const clerkUsers = await clerkClient.users.getUserList({
      limit: maxResults,
      // offset can be used for pagination if needed
    });

    // Map Clerk users to our format
    let users: any[] = clerkUsers.data.map(u => ({
      uid: u.id,
      email: u.emailAddresses[0]?.emailAddress || "",
      displayName: u.fullName || u.firstName || "",
      role: "participant", // Default role, will be updated from Firestore query below
      createdAt: new Date(u.createdAt).toISOString(),
      lastSignIn: u.lastSignInAt ? new Date(u.lastSignInAt).toISOString() : null,
      emailVerified: u.emailAddresses[0]?.verification?.status === "verified",
    }))

    // Merge Firestore profile for these users FIRST to get correct roles
    const docs = await Promise.all(users.map(u =>
      db.collection("users").doc(u.uid).get()
    ))
    const profileByUid = new Map(docs.filter(d => d.exists).map(d => [d.id, d.data()]))

    // Debug logging for specific user
    const debugUid = "user_35qqi64sDONinj64dvTbC2qQ4Wo"
    if (users.some(u => u.uid === debugUid)) {
      const debugDoc = docs.find(d => d.id === debugUid)
      console.log(`Debug - User ${debugUid} exists in Firestore:`, debugDoc?.exists)
      if (debugDoc?.exists) {
        const debugData = debugDoc.data()
        console.log(`Debug - User ${debugUid} role from Firestore:`, debugData?.role)
        console.log(`Debug - User ${debugUid} full profile:`, debugData)
      }
    }

    users = users.map(u => {
      const p = profileByUid.get(u.uid) || {}
      const finalRole = p.role || "participant"
      
      // Debug logging for specific user
      if (u.uid === debugUid) {
        console.log(`Debug - Final role assigned to ${debugUid}:`, finalRole)
        console.log(`Debug - Profile data for ${debugUid}:`, p)
      }
      
      return {
        ...u,
        displayName: u.displayName || (p.fullName ?? ""),
        role: finalRole, // Use Firestore role or default to participant
        participations: p.participations ?? {},
      }
    })

    // Filter by role if provided AFTER merging Firestore data
    if (role && role !== "all") {
      users = users.filter(u => u.role === role)
    }

    // Sort by role priority and creation date
    const rolePriority = { superadmin: 0, admin: 1, judge: 2, participant: 3 }
    users.sort((a, b) => {
      const ap = rolePriority[a.role as keyof typeof rolePriority] ?? 4
      const bp = rolePriority[b.role as keyof typeof rolePriority] ?? 4
      if (ap !== bp) return ap - bp
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })

    res.json({
      users: users.slice(0, maxResults),
      total: clerkUsers.totalCount,
      hasNextPage: clerkUsers.totalCount > maxResults,
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
    // Search for user by email in Clerk
    const clerkUsers = await clerkClient.users.getUserList({
      emailAddress: [email],
    });

    if (clerkUsers.data.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const clerkUser = clerkUsers.data[0];
    
    // Fetch user role from Firestore
    const userDoc = await db.collection("users").doc(clerkUser.id).get();
    const userProfile = userDoc.exists ? userDoc.data() : {};
    
    const user = {
      uid: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      displayName: clerkUser.fullName || clerkUser.firstName || userProfile.fullName || "",
      role: userProfile.role || "participant", // Use Firestore role or default to participant
      createdAt: new Date(clerkUser.createdAt).toISOString(),
      lastSignIn: clerkUser.lastSignInAt ? new Date(clerkUser.lastSignInAt).toISOString() : null,
      emailVerified: clerkUser.emailAddresses[0]?.verification?.status === "verified",
      disabled: clerkUser.locked || false
    };

    return res.status(200).json(user);
  } catch (err: any) {
    return res.status(404).json({ error: "User not found", detail: err.message });
  }
});

// GET /superadmin/stats
router.get("/stats", verifySuperAdmin, async (req: RequestWithUser, res: Response) => {
  try {
    // Fetch all users from Clerk (may need pagination for large datasets)
    const clerkUsers = await clerkClient.users.getUserList({
      limit: 500, // Adjust as needed
    });

    // Map Clerk users and get their Firestore roles
    const users = clerkUsers.data.map((user) => ({
      uid: user.id,
      role: "participant", // Default role, will be updated from Firestore query below
      disabled: user.locked || false
    }));

    // Fetch Firestore roles for all users
    const docs = await Promise.all(users.map(u =>
      db.collection("users").doc(u.uid).get()
    ));
    const profileByUid = new Map(docs.filter(d => d.exists).map(d => [d.id, d.data()]));

    // Update users with correct roles from Firestore
    const usersWithRoles = users.map(u => {
      const p = profileByUid.get(u.uid) || {};
      return {
        ...u,
        role: p.role || "participant", // Use Firestore role or default to participant
      };
    });

    const stats = {
      total: clerkUsers.totalCount,
      superadmins: usersWithRoles.filter(u => u.role === "superadmin").length,
      admins: usersWithRoles.filter(u => u.role === "admin").length,
      judges: usersWithRoles.filter(u => u.role === "judge").length,
      participants: usersWithRoles.filter(u => u.role === "participant").length,
      disabled: usersWithRoles.filter(u => u.disabled).length,
      active: usersWithRoles.filter(u => !u.disabled).length
    };

    return res.status(200).json(stats);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "❌ Failed to fetch stats", detail: message });
  }
});

export default router;