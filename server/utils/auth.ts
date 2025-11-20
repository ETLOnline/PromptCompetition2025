import { Request, Response, NextFunction } from "express"
import { clerkClient } from "../config/firebase-admin.js"
import { verifyToken } from "@clerk/backend"

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: "judge" | "admin" | "superadmin" | "participant";
  };
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    // Verify Clerk token using @clerk/backend verifyToken function
    const sessionClaims = await verifyToken(idToken, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    // Extract role from publicMetadata (set during profile setup)
    const metadata = sessionClaims.publicMetadata as any;
    const role = metadata?.role as "judge" | "admin" | "superadmin" | "participant" | undefined;

    req.user = {
      uid: sessionClaims.sub, // Clerk uses 'sub' for user ID
      email: sessionClaims.email as string,
      role,
    };

    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

export function authorizeRoles(allowedRoles: ("judge" | "admin" | "superadmin" | "participant")[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: No user info" });
    }
    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }
    next();
  };
}

export async function verifySuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const idToken = req.headers.authorization?.split("Bearer ")[1]
  if (!idToken)
    return res.status(401).json({ error: "Unauthorized: No token provided." })

  try {
    // Verify Clerk token using @clerk/backend verifyToken function
    const sessionClaims = await verifyToken(idToken, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    })
    const metadata = sessionClaims.publicMetadata as any;
    const role = metadata?.role
    
    if (role !== "superadmin") {
      return res
        .status(403)
        .json({ error: "Forbidden: Superadmin access required." })
    }

    req.user = {
      uid: sessionClaims.sub,
      email: sessionClaims.email as string,
      role: role as "superadmin"
    }
    next()
  } catch (err: any) {
    return res
      .status(401)
      .json({ error: "Invalid token", detail: err.message })
  }
}
