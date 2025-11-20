import express from "express";
import { AuthenticatedRequest, authenticateToken, authorizeRoles } from "../utils/auth.js";
import { clerkClient } from "../config/firebase-admin.js";

const router = express.Router();

router.get("/profile", authenticateToken, async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
        return res.redirect(302, "/");
    }

    try {
        // Fetch user from Clerk
        const user = await clerkClient.users.getUser(req.user.uid);
        // console.log("user email:",req.user?.uid);

        res.json({
            uid: req.user?.uid,
            email: user.emailAddresses[0]?.emailAddress,
            role: user.publicMetadata?.role || req.user?.role,
            displayName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || null,
            photoURL: user.imageUrl || null,
        });
    } 
    catch (err) 
    {
        res.status(500).json("Failed to fetch user profile.");
    }
});


// Only admins & superadmins can view this
router.get(
    "/admins",
    authenticateToken,
    authorizeRoles(["admin", "superadmin"]),
    (req: AuthenticatedRequest, res) => {
        res.json({
            uid: req.user?.uid,
            email: req.user?.email,
            role: req.user?.role,
        });
    }
);

// Only superadmins can use this
router.get(
    "/superpower",
    authenticateToken,
    authorizeRoles(["superadmin"]),
    (req: AuthenticatedRequest, res) => {
        res.json({
            uid: req.user?.uid,
            email: req.user?.email,
            role: req.user?.role,
        });
    }
);

// Judge-only route
router.get(
    "/submissions",
    authenticateToken,
    authorizeRoles(["judge"]),
    (req: AuthenticatedRequest, res) => {
        res.json({
            uid: req.user?.uid,
            email: req.user?.email,
            role: req.user?.role,
        });
    }
);


export default router;