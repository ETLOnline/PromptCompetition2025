// utils/user‑mapper.ts
import type { UserMetadata, UserRecord } from "firebase-admin/auth"

export interface UserDTO {
  uid: string
  email: string
  displayName: string
  role: string
  createdAt?: string
  lastSignIn?: string
  emailVerified: boolean
  disabled: boolean
}

export function mapUserRecordToDTO(u: UserRecord): UserDTO {
  return {
    uid: u.uid,
    email: u.email || "",
    displayName: u.displayName || "",
    role: (u.customClaims?.role as string) || "user",
    createdAt: u.metadata.creationTime ?? undefined,
    lastSignIn: u.metadata.lastSignInTime ?? undefined,
    emailVerified: u.emailVerified,
    disabled: u.disabled,
  }
}
