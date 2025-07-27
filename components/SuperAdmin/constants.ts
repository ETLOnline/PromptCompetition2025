// =============================
// components/SuperAdmin/constants.ts
// =============================

import { Crown, Shield, Scale, Users } from "lucide-react"

export const ROLE_CONFIG = {
  superadmin: { label: "Super Admin", pluralLabel: "Super Admins", icon: Crown, color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20" },
  admin:      { label: "Admin",       pluralLabel: "Admins",       icon: Shield, color: "text-blue-400",   bgColor: "bg-blue-500/10",   borderColor: "border-blue-500/20" },
  judge:      { label: "Judge",       pluralLabel: "Judges",       icon: Scale,  color: "text-green-400",  bgColor: "bg-green-500/10",  borderColor: "border-green-500/20" },
  user:       { label: "User",        pluralLabel: "Users",        icon: Users,  color: "text-gray-400",   bgColor: "bg-gray-500/10",   borderColor: "border-gray-500/20" }
}