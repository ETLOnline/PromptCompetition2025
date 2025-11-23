import { Request, Response, NextFunction } from "express";
import { clerkClient } from "../config/firebase-admin.js";
import { verifyToken } from "@clerk/backend";
import { getUserRole } from "../utils/userService.js";

/**
 * Middleware to verify Clerk JWT tokens
 * Uses Firestore users collection for role information instead of publicMetadata
 * 
 * Usage:
 * import { verifyClerkToken } from "./middleware/clerkAuth";
 * app.get("/api/protected", verifyClerkToken, (req, res) => {
 *   console.log(req.userId); // Clerk user ID
 *   console.log(req.userEmail); // User email
 *   console.log(req.userRole); // User role from Firestore
 * });
 */

// Extend Express Request type to include user data
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userRole?: string;
      clerkUser?: any; // Full Clerk user object if needed
    }
  }
}

export async function verifyClerkToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      error: "Unauthorized", 
      message: "No token provided" 
    });
  }

  // Extract token
  const token = authHeader.split("Bearer ")[1];

  try {
    // Verify the token using @clerk/backend verifyToken function
    const sessionClaims = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    // Extract user information from the token claims
    req.userId = sessionClaims.sub; // User ID
    req.userEmail = sessionClaims.email as string;
    
    // Get role from Firestore users collection
    req.userRole = await getUserRole(req.userId);

    // Optionally, fetch full user details if needed
    // const user = await clerkClient.users.getUser(req.userId);
    // req.clerkUser = user;

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ 
      error: "Unauthorized", 
      message: "Invalid or expired token" 
    });
  }
}

/**
 * Middleware to verify Clerk token AND check for specific role
 * 
 * Usage:
 * app.get("/api/admin-only", requireRole("admin"), (req, res) => {
 *   res.json({ message: "Admin access granted" });
 * });
 */
export function requireRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First verify the token
    await verifyClerkToken(req, res, () => {
      // Then check role
      if (!req.userRole || !allowedRoles.includes(req.userRole)) {
        return res.status(403).json({ 
          error: "Forbidden", 
          message: `Requires one of the following roles: ${allowedRoles.join(", ")}` 
        });
      }
      next();
    });
  };
}
