import express from "express";
import { AuthenticatedRequest, authenticateToken, authorizeRoles } from "../utils/auth.js";

const router = express.Router();

router.get("/profile", authenticateToken, (req: AuthenticatedRequest, res) => {
    if (!req.user) {
        return res.redirect(302, "/");
    }

    res.json({
        uid: req.user?.uid,
        email: req.user?.email,
        role: req.user?.role || "participant",
    });
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