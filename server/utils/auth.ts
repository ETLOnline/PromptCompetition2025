import { Request, Response, NextFunction } from "express"
import { admin } from "../config/firebase-admin.js"  

export interface RequestWithUser extends Request {
  user?: {
    uid: string
    email?: string
    role?: string
    [key: string]: any
  }
}

export async function verifySuperAdmin(
  req: RequestWithUser,
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
