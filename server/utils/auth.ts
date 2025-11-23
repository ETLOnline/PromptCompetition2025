import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@clerk/backend";
import { getUserRole } from "./userService.js";

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
    // Verify Clerk token
    const sessionClaims = await verifyToken(idToken, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    const uid = sessionClaims.sub;
    const email = sessionClaims.email as string;

    // Fetch role using our unified userService
    const role = await getUserRole(uid);

    req.user = {
      uid,
      email,
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
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided." });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const sessionClaims = await verifyToken(idToken, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    const uid = sessionClaims.sub;
    
    // Use the unified getUserRole function from userService
    const role = await getUserRole(uid);
    
    if (role !== "superadmin") {
      return res
        .status(403)
        .json({ error: "Forbidden: Superadmin access required." });
    }

    req.user = {
      uid,
      email: sessionClaims.email as string,
      role: "superadmin"
    };
    
    next();
  } catch (err: any) {
    return res
      .status(401)
      .json({ error: "Invalid token", detail: err.message });
  }
}