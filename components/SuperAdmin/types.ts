// components/SuperAdmin/types.ts

import { ROLE_CONFIG } from "./constants"

export type Role = keyof typeof ROLE_CONFIG

export interface User {
  uid: string
  email: string
  displayName: string
  role: Role         // ← now one of "superadmin"|"admin"|"judge"|"user"
  createdAt?: string
  lastSignIn?: string
  emailVerified?: boolean
}

export interface Stats {
  total: number
  superadmins: number
  admins: number
  judges: number
  users: number
  disabled: number
  active: number
}

export interface CreateUserForm {
  email: string
  password: string
  displayName: string
  role: Role        // ← same Role type
}
