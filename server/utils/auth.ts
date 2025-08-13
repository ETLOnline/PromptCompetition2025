import { Request, Response, NextFunction } from "express"
import { admin } from "../config/firebase-admin.js"  

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: "judge" | "admin" | "superadmin";
  };
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const role = decodedToken.role as "judge" | "admin" | "superadmin" | undefined;

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role,
    };

    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

export function authorizeRoles(allowedRoles: ("judge" | "admin" | "superadmin")[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: No user info" });
    }
    if (!allowedRoles.includes(req.user.role!)) {
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
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    const role = (decodedToken as any).role
    if (role !== "superadmin") {
      return res
        .status(403)
        .json({ error: "Forbidden: Superadmin access required." })
    }

    req.user = decodedToken
    next()
  } catch (err: any) {
    return res
      .status(401)
      .json({ error: "Invalid token", detail: err.message })
  }
}
