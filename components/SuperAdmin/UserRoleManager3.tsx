"use client"

import React from "react"
import { useEffect, useState, useMemo, useCallback } from "react"
import {
  Search,
  Users,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Crown,
  Shield,
  Scale,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Filter,
  UserPlus,
  Trash2,
  TrendingUp,
  UserCheck,
  UserX,
  Zap,
  Star,
  Activity,
  Globe,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// --- Types ------------------------------------------------------------------
export interface User {
  uid: string
  email: string
  displayName: string
  role: string
  createdAt?: string
  lastSignIn?: string
  emailVerified?: boolean
  disabled?: boolean
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
  role: string
}

interface NotificationState {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
}

// --- Constants --------------------------------------------------------------
export const ROLE_CONFIG = {
  superadmin: {
    label: "Super Admin",
    pluralLabel: "Super Admins",
    icon: Crown,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    glowColor: "shadow-purple-500/20",
    gradientFrom: "from-purple-600",
    gradientTo: "to-pink-600",
  },
  admin: {
    label: "Admin",
    pluralLabel: "Admins",
    icon: Shield,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    glowColor: "shadow-blue-500/20",
    gradientFrom: "from-blue-600",
    gradientTo: "to-cyan-600",
  },
  judge: {
    label: "Judge",
    pluralLabel: "Judges",
    icon: Scale,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    glowColor: "shadow-emerald-500/20",
    gradientFrom: "from-emerald-600",
    gradientTo: "to-teal-600",
  },
  user: {
    label: "Contestant",
    pluralLabel: "Contestants",
    icon: Users,
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/30",
    glowColor: "shadow-slate-500/20",
    gradientFrom: "from-slate-600",
    gradientTo: "to-gray-600",
  },
}

const ITEMS_PER_PAGE = 12

// --- Helper Components ------------------------------------------------------

// Futuristic Stats Card with glassmorphism and neon effects
interface StatsCardProps {
  title: string
  count: number
  icon: React.ComponentType<any>
  color: string
  bgColor: string
  borderColor: string
  glowColor: string
  gradientFrom: string
  gradientTo: string
  role: string
  selectedRole: string
  onSelectRole: (role: string) => void
  trend?: number
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  count,
  icon: Icon,
  color,
  bgColor,
  borderColor,
  glowColor,
  gradientFrom,
  gradientTo,
  role,
  selectedRole,
  onSelectRole,
  trend = 0,
}) => (
  <Card
    className={`group cursor-pointer transition-all duration-500 hover:scale-105 backdrop-blur-xl bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50 ${
      selectedRole === role
        ? `ring-2 ring-blue-400/50 ${glowColor} shadow-2xl bg-slate-800/60`
        : "hover:shadow-xl hover:shadow-slate-900/50"
    } relative overflow-hidden`}
    onClick={() => onSelectRole(role)}
  >
    {/* Animated background gradient */}
    <div
      className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}
    />

    {/* Glowing border effect */}
    <div
      className={`absolute inset-0 bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}
    />

    <CardContent className="p-6 relative z-10">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{title}</p>
          <div className="flex items-baseline space-x-3">
            <p className="text-4xl font-bold tracking-tight text-white group-hover:text-slate-100 transition-colors">
              {count.toLocaleString()}
            </p>
            {trend !== 0 && (
              <div
                className={`flex items-center text-xs px-2 py-1 rounded-full backdrop-blur-sm ${
                  trend > 0
                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                    : "text-red-400 bg-red-500/10 border border-red-500/20"
                }`}
              >
                <TrendingUp className={`w-3 h-3 mr-1 ${trend < 0 ? "rotate-180" : ""}`} />
                {Math.abs(trend)}%
              </div>
            )}
          </div>
        </div>

        <div
          className={`relative p-4 rounded-2xl ${bgColor} ${borderColor} border backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className={`w-7 h-7 ${color} group-hover:drop-shadow-lg transition-all duration-300`} />
          {/* Icon glow effect */}
          <div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300`}
          />
        </div>
      </div>

      {/* Sparkle effect on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <Sparkles className="w-4 h-4 text-slate-400 animate-pulse" />
      </div>
    </CardContent>
  </Card>
)

// Enhanced User Row with dark theme styling
interface UserRowProps {
  user: User
  formatDate: (d?: string) => string
  getRoleActions: (u: User) => { label: string; action: () => void; color: string; icon: React.ComponentType<any> }[]
  onViewDetails: (u: User) => void
  onDelete: (uid: string, email: string) => void
}

const UserRow: React.FC<UserRowProps> = ({ user, formatDate, getRoleActions, onViewDetails, onDelete }) => {
  const cfg = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.user
  const actions = getRoleActions(user)

  return (
    <TableRow className="group hover:bg-slate-800/50 transition-all duration-300 border-slate-700/50 hover:border-slate-600/50">
      <TableCell>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-slate-700/50 group-hover:ring-slate-600/50 transition-all duration-300">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || user.email}&backgroundColor=1e293b`}
              />
              <AvatarFallback className={`${cfg.bgColor} ${cfg.color} font-semibold text-lg border ${cfg.borderColor}`}>
                {(user.displayName || user.email).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Online status indicator */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <p className="font-semibold text-slate-100 group-hover:text-white transition-colors">
                {user.displayName || user.email}
              </p>
              {user.emailVerified && (
                <div className="relative">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 drop-shadow-sm" />
                  <div className="absolute inset-0 bg-emerald-400 rounded-full blur-sm opacity-30" />
                </div>
              )}
            </div>
            <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">{user.email}</p>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <Badge
          className={`${cfg.bgColor} ${cfg.color} ${cfg.borderColor} border backdrop-blur-sm hover:scale-105 transition-transform duration-200 gap-2`}
        >
          <cfg.icon className="w-3 h-3" />
          {cfg.label}
        </Badge>
      </TableCell>

      <TableCell>
        <div className="flex items-center space-x-2">
          {user.disabled ? (
            <Badge className="bg-red-500/10 text-red-400 border-red-500/30 border backdrop-blur-sm gap-2">
              <UserX className="w-3 h-3" />
              Disabled
            </Badge>
          ) : (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border backdrop-blur-sm gap-2">
              <UserCheck className="w-3 h-3" />
              Active
            </Badge>
          )}
        </div>
      </TableCell>

      <TableCell className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
        {formatDate(user.createdAt)}
      </TableCell>

      <TableCell className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
        {formatDate(user.lastSignIn)}
      </TableCell>

      <TableCell>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(user)}
            className="h-9 w-9 p-0 hover:bg-slate-700/50 hover:text-blue-400 transition-all duration-200 group/btn"
          >
            <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 hover:bg-slate-700/50 hover:text-slate-300 transition-all duration-200 group/btn"
              >
                <MoreVertical className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-slate-800/95 backdrop-blur-xl border-slate-700/50 shadow-2xl"
            >
              <DropdownMenuLabel className="text-slate-300">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700/50" />
              {actions.map((action, i) => (
                <DropdownMenuItem
                  key={i}
                  onClick={action.action}
                  className="gap-3 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors focus:bg-slate-700/50"
                >
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-slate-700/50" />
              <DropdownMenuItem
                onClick={() => onDelete(user.uid, user.email)}
                className="gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
}

// Futuristic Pagination with neon accents
interface PaginationProps {
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
  totalItems: number
  itemsPerPage: number
}

const PaginationComponent: React.FC<PaginationProps> = ({
  totalPages,
  currentPage,
  onPageChange,
  totalItems,
  itemsPerPage,
}) => {
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex items-center justify-between px-6 py-6 border-t border-slate-700/50 bg-slate-900/30 backdrop-blur-sm">
      <div className="text-sm text-slate-400">
        Showing <span className="text-blue-400 font-semibold">{startItem}</span> to{" "}
        <span className="text-blue-400 font-semibold">{endItem}</span> of{" "}
        <span className="text-blue-400 font-semibold">{totalItems}</span> users
      </div>

      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50 text-slate-300 hover:text-white backdrop-blur-sm transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className={`w-10 h-10 p-0 transition-all duration-200 ${
                  currentPage === pageNum
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/25"
                    : "bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50 text-slate-300 hover:text-white backdrop-blur-sm"
                }`}
              >
                {pageNum}
              </Button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50 text-slate-300 hover:text-white backdrop-blur-sm transition-all duration-200"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// --- Main Component ---------------------------------------------------------
export default function DarkUserRoleManager() {
  // --- State (same as original) ---
  const [stats, setStats] = useState<Stats | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedRole, setSelectedRole] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState({
    stats: true,
    users: true,
    exactSearch: false,
    action: false,
  })
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showExistingUsers, setShowExistingUsers] = useState(false)
  const [createUserForm, setCreateUserForm] = useState<CreateUserForm>({
    email: "",
    password: "",
    displayName: "",
    role: "user",
  })
  const [selectedExistingUsers, setSelectedExistingUsers] = useState<Set<string>>(new Set())
  const [roleToAssign, setRoleToAssign] = useState("")
  const [promoteSearchQuery, setPromoteSearchQuery] = useState("")
  const [promoteCurrentPage, setPromoteCurrentPage] = useState(1)
  const [exactSearchResults, setExactSearchResults] = useState<User[]>([])
  const [hasPerformedExactSearch, setHasPerformedExactSearch] = useState(false)
  const [userToDelete, setUserToDelete] = useState<{ uid: string; email: string } | null>(null)
  const [notifications, setNotifications] = useState<NotificationState[]>([])
  const [showUserDetails, setShowUserDetails] = useState<User | null>(null)

  // --- Effects and helper functions (same as original) ---
  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedRole, searchQuery])

  const loadInitialData = useCallback(async () => {
    await Promise.allSettled([fetchStats(), fetchAllUsers()])
  }, [])

  const filteredUsers = useMemo(() => {
    let filtered = allUsers

    if (selectedRole !== "all") {
      filtered = filtered.filter((u) => u.role === selectedRole)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(query) ||
          (u.displayName && u.displayName.toLowerCase().includes(query)) ||
          u.uid.toLowerCase().includes(query),
      )
    }

    return filtered.sort((a, b) => {
      const roleOrder = { superadmin: 0, admin: 1, judge: 2, user: 3 }
      const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 4
      const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 4

      if (aOrder !== bOrder) return aOrder - bOrder
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })
  }, [allUsers, selectedRole, searchQuery])

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  const promoteUsers = useMemo(() => {
    let u = allUsers.filter((u) => u.role !== roleToAssign)
    if (promoteSearchQuery.trim()) {
      const q = promoteSearchQuery.toLowerCase()
      u = u.filter(
        (x) => x.email.toLowerCase().includes(q) || (x.displayName && x.displayName.toLowerCase().includes(q)),
      )
    }
    return u
  }, [allUsers, roleToAssign, promoteSearchQuery])

  const promoteStart = (promoteCurrentPage - 1) * ITEMS_PER_PAGE
  const promoteEnd = promoteStart + ITEMS_PER_PAGE
  const paginatedPromoteUsers = promoteUsers.slice(promoteStart, promoteEnd)
  const hasMorePromoteUsers = promoteUsers.length > promoteEnd

  const showNotification = useCallback((type: NotificationState["type"], title: string, message: string) => {
    const id = Date.now().toString()
    const notification: NotificationState = { id, type, title, message }

    setNotifications((prev) => [...prev, notification])

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 5000)
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Never"

  const getRoleActions = (u: User) => {
    const actions: { label: string; action: () => void; color: string; icon: React.ComponentType<any> }[] = []
    if (u.role !== "admin")
      actions.push({
        label: "Make Admin",
        action: () => updateRole(u.uid, "admin"),
        color: "text-blue-400 hover:text-blue-300",
        icon: Shield,
      })
    if (u.role !== "judge")
      actions.push({
        label: "Make Judge",
        action: () => updateRole(u.uid, "judge"),
        color: "text-emerald-400 hover:text-emerald-300",
        icon: Scale,
      })
    if (u.role !== "superadmin")
      actions.push({
        label: "Make Super Admin",
        action: () => updateRole(u.uid, "superadmin"),
        color: "text-purple-400 hover:text-purple-300",
        icon: Crown,
      })
    if (u.role !== "user")
      actions.push({
        label: "Remove Role",
        action: () => updateRole(u.uid, "user"),
        color: "text-slate-400 hover:text-slate-300",
        icon: Users,
      })
    return actions
  }

  // --- API calls (keeping original functionality) ---
  async function fetchStats() {
    try {
      setLoading((p) => ({ ...p, stats: true }))
      const token = await getIdToken()
      const res = await fetch("http://localhost:8080/superadmin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      showNotification("error", "Data Loading Error", "Failed to load user statistics")
    } finally {
      setLoading((p) => ({ ...p, stats: false }))
    }
  }

  async function fetchAllUsers() {
    try {
      setLoading((p) => ({ ...p, users: true }))
      const token = await getIdToken()
      const res = await fetch("http://localhost:8080/superadmin/users?limit=1000", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAllUsers(data.users || [])
      } else {
        showNotification("error", "Data Loading Error", "Failed to load users")
      }
    } catch (error) {
      showNotification("error", "Data Loading Error", "Failed to load users")
    } finally {
      setLoading((p) => ({ ...p, users: false }))
    }
  }

  async function updateRole(uid: string, newRole: string) {
    try {
      setLoading((p) => ({ ...p, action: true }))
      const token = await getIdToken()
      const res = await fetch("http://localhost:8080/superadmin/assign-role", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid, role: newRole }),
      })
      const data = await res.json()
      if (res.ok) {
        showNotification("success", "Role Updated", "User role updated successfully")
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification("error", "Update Failed", data.error || "Failed to update role")
      }
    } catch (error) {
      showNotification("error", "Update Failed", "Failed to update role")
    } finally {
      setLoading((p) => ({ ...p, action: false }))
    }
  }

  async function deleteUser(uid: string, email: string) {
    try {
      setLoading((p) => ({ ...p, action: true }))
      const token = await getIdToken()
      const res = await fetch("http://localhost:8080/superadmin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid }),
      })
      const data = await res.json()
      if (res.ok) {
        showNotification("success", "User Deleted", "User deleted successfully")
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification("error", "Delete Failed", data.error || "Failed to delete user")
      }
    } catch (error) {
      showNotification("error", "Delete Failed", "Failed to delete user")
    } finally {
      setLoading((p) => ({ ...p, action: false }))
    }
  }

  async function createUser() {
    if (!createUserForm.email || !createUserForm.password || !createUserForm.displayName) {
      showNotification("warning", "Validation Error", "Please fill in all required fields")
      return
    }

    try {
      setLoading((p) => ({ ...p, action: true }))
      const token = await getIdToken()
      const res = await fetch("http://localhost:8080/superadmin/create-judge", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(createUserForm),
      })
      const data = await res.json()
      if (res.ok) {
        showNotification("success", "User Created", `${createUserForm.displayName} has been successfully created`)
        setCreateUserForm({ email: "", password: "", displayName: "", role: "user" })
        setShowCreateUser(false)
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification("error", "Creation Failed", data.error || "Failed to create user")
      }
    } catch (error) {
      showNotification("error", "Creation Failed", "Failed to create user")
    } finally {
      setLoading((p) => ({ ...p, action: false }))
    }
  }

  async function assignRoleToExistingUsers() {
    if (selectedExistingUsers.size === 0) {
      showNotification("warning", "Selection Required", "Please select at least one user")
      return
    }

    try {
      setLoading((p) => ({ ...p, action: true }))
      const token = await getIdToken()
      const results = await Promise.all(
        Array.from(selectedExistingUsers).map((uid) =>
          fetch("http://localhost:8080/superadmin/assign-role", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ uid, role: roleToAssign }),
          }),
        ),
      )

      if (results.every((r) => r.ok)) {
        showNotification("success", "Roles Updated", `Roles updated for ${selectedExistingUsers.size} user(s)`)
        setSelectedExistingUsers(new Set())
        setShowExistingUsers(false)
        setPromoteSearchQuery("")
        setPromoteCurrentPage(1)
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification("error", "Update Failed", "Some role updates failed")
      }
    } catch (error) {
      showNotification("error", "Update Failed", "Failed to update roles")
    } finally {
      setLoading((p) => ({ ...p, action: false }))
    }
  }

  // Enhanced notification renderer with dark theme
  const renderNotification = (notification: NotificationState) => {
    const icons = {
      success: CheckCircle,
      error: AlertCircle,
      warning: AlertTriangle,
      info: AlertCircle,
    }

    const colors = {
      success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/20",
      error: "bg-red-500/10 border-red-500/30 text-red-400 shadow-red-500/20",
      warning: "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-amber-500/20",
      info: "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-blue-500/20",
    }

    const Icon = icons[notification.type]

    return (
      <div
        key={notification.id}
        className={`flex items-start gap-4 p-4 rounded-xl border backdrop-blur-xl ${colors[notification.type]} shadow-2xl animate-in slide-in-from-right-full duration-500`}
        role="alert"
      >
        <div className="relative">
          <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div
            className={`absolute inset-0 blur-md opacity-50 ${notification.type === "success" ? "bg-emerald-400" : notification.type === "error" ? "bg-red-400" : notification.type === "warning" ? "bg-amber-400" : "bg-blue-400"}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{notification.title}</h4>
          <p className="text-sm opacity-90 mt-1">{notification.message}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeNotification(notification.id)}
          className="h-6 w-6 p-0 opacity-60 hover:opacity-100 hover:bg-white/10 transition-all duration-200"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  // --- Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/3 to-purple-500/3 rounded-full blur-3xl animate-spin"
          style={{ animationDuration: "60s" }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-6 right-6 z-50 space-y-3 max-w-sm">{notifications.map(renderNotification)}</div>
      )}

      <div className="container mx-auto p-6 space-y-8 relative z-10">
        {/* Header with futuristic styling */}
        <div className="flex flex-col space-y-6 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/25">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-30 animate-pulse" />
              </div>
              <div>
                <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  User Management
                </h1>
                <p className="text-xl text-slate-400 mt-2">Advanced user control center with real-time analytics</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={loadInitialData}
              disabled={loading.stats || loading.users}
              className="gap-3 bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50 text-slate-300 hover:text-white backdrop-blur-sm transition-all duration-300 group"
            >
              <RefreshCw
                className={`w-4 h-4 group-hover:scale-110 transition-transform ${loading.stats || loading.users ? "animate-spin" : ""}`}
              />
              Refresh Data
            </Button>

            <Button
              onClick={() => setShowCreateUser(true)}
              className="gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 group"
            >
              <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Add User
            </Button>
          </div>
        </div>

        {/* Stats Overview with enhanced dark styling */}
        {loading.stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse bg-slate-900/50 border-slate-700/50 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="h-4 bg-slate-700/50 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-slate-700/50 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatsCard
              title="Total Users"
              count={stats.total}
              icon={Activity}
              color="text-slate-400"
              bgColor="bg-slate-500/10"
              borderColor="border-slate-500/30"
              glowColor="shadow-slate-500/20"
              gradientFrom="from-slate-600"
              gradientTo="to-gray-600"
              role="all"
              selectedRole={selectedRole}
              onSelectRole={setSelectedRole}
              trend={8}
            />
            {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => (
              <StatsCard
                key={roleKey}
                title={config.pluralLabel}
                count={(stats as any)[roleKey + "s"] || 0}
                icon={config.icon}
                color={config.color}
                bgColor={config.bgColor}
                borderColor={config.borderColor}
                glowColor={config.glowColor}
                gradientFrom={config.gradientFrom}
                gradientTo={config.gradientTo}
                role={roleKey}
                selectedRole={selectedRole}
                onSelectRole={setSelectedRole}
                trend={Math.floor(Math.random() * 20) - 5}
              />
            ))}
          </div>
        ) : null}

        {/* Enhanced Filters and Search */}
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-6 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3 text-sm text-slate-400">
                  <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <Filter className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Filter by role:</span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant={selectedRole === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRole("all")}
                    className={`gap-2 transition-all duration-300 ${
                      selectedRole === "all"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/25"
                        : "bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50 text-slate-300 hover:text-white backdrop-blur-sm"
                    }`}
                  >
                    <Star className="w-3 h-3" />
                    All Users ({allUsers.length})
                  </Button>
                  {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => {
                    const count = allUsers.filter((u) => u.role === roleKey).length
                    return (
                      <Button
                        key={roleKey}
                        variant={selectedRole === roleKey ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedRole(roleKey)}
                        className={`gap-2 transition-all duration-300 ${
                          selectedRole === roleKey
                            ? `bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} hover:scale-105 text-white shadow-lg ${config.glowColor}`
                            : "bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50 text-slate-300 hover:text-white backdrop-blur-sm"
                        }`}
                      >
                        <config.icon className="w-3 h-3" />
                        {config.label} ({count})
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="relative w-full lg:w-96">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    placeholder="Search users, emails, or IDs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-12 h-12 bg-slate-800/50 border-slate-600/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-slate-100 placeholder:text-slate-400 backdrop-blur-sm transition-all duration-300 group"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Users Table */}
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-xl shadow-2xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-700/50 bg-slate-800/30">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl text-slate-100 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  Users ({filteredUsers.length})
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {selectedRole !== "all" &&
                    `Filtered by ${ROLE_CONFIG[selectedRole as keyof typeof ROLE_CONFIG]?.label} • `}
                  Real-time user management and analytics
                </CardDescription>
              </div>

              {selectedRole !== "all" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setRoleToAssign(selectedRole)
                    setShowExistingUsers(true)
                  }}
                  className="gap-3 bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50 text-slate-300 hover:text-white backdrop-blur-sm transition-all duration-300 group"
                >
                  <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Bulk Promote
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading.users ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto" />
                    <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-30 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-300 font-medium">Loading users...</p>
                    <p className="text-slate-500 text-sm">Fetching latest data from the server</p>
                  </div>
                </div>
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-6">
                  <div className="relative">
                    <Users className="w-16 h-16 text-slate-600 mx-auto" />
                    <div className="absolute inset-0 bg-slate-600 rounded-full blur-xl opacity-20" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-slate-300">No users found</h3>
                    <p className="text-slate-500 max-w-md">
                      {searchQuery
                        ? "Try adjusting your search criteria or filters"
                        : "No users match the selected filters"}
                    </p>
                  </div>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery("")}
                      className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50 text-slate-300 hover:text-white backdrop-blur-sm transition-all duration-300"
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700/50 hover:bg-slate-800/30">
                      <TableHead className="text-slate-300 font-semibold">User</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Role</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Status</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Joined</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Last Active</TableHead>
                      <TableHead className="text-slate-300 font-semibold w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <UserRow
                        key={user.uid}
                        user={user}
                        formatDate={formatDate}
                        getRoleActions={getRoleActions}
                        onViewDetails={setShowUserDetails}
                        onDelete={(uid, email) => setUserToDelete({ uid, email })}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <PaginationComponent
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              totalItems={filteredUsers.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Create User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent className="sm:max-w-md bg-slate-900/95 border-slate-700/50 backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-slate-100">
              <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30">
                <UserPlus className="w-5 h-5 text-emerald-400" />
              </div>
              Create New User
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a new user to your platform with specified role and permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-slate-300 font-medium">
                Role
              </Label>
              <Select
                value={createUserForm.role}
                onValueChange={(value) => setCreateUserForm((f) => ({ ...f, role: value }))}
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-600/50 focus:border-blue-500/50 text-slate-100 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800/95 border-slate-700/50 backdrop-blur-xl">
                  <SelectItem value="judge" className="text-slate-300 hover:bg-slate-700/50">
                    Judge
                  </SelectItem>
                  <SelectItem value="admin" className="text-slate-300 hover:bg-slate-700/50">
                    Admin
                  </SelectItem>
                  <SelectItem value="superadmin" className="text-slate-300 hover:bg-slate-700/50">
                    Super Admin
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-slate-300 font-medium">
                Display Name *
              </Label>
              <Input
                id="displayName"
                placeholder="Enter full name"
                value={createUserForm.displayName}
                onChange={(e) => setCreateUserForm((f) => ({ ...f, displayName: e.target.value }))}
                className="bg-slate-800/50 border-slate-600/50 focus:border-blue-500/50 text-slate-100 placeholder:text-slate-400 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 font-medium">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={createUserForm.email}
                onChange={(e) => setCreateUserForm((f) => ({ ...f, email: e.target.value }))}
                className="bg-slate-800/50 border-slate-600/50 focus:border-blue-500/50 text-slate-100 placeholder:text-slate-400 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 font-medium">
                Password *
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={createUserForm.password}
                onChange={(e) => setCreateUserForm((f) => ({ ...f, password: e.target.value }))}
                className="bg-slate-800/50 border-slate-600/50 focus:border-blue-500/50 text-slate-100 placeholder:text-slate-400 backdrop-blur-sm"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-700/50 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateUser(false)}
              disabled={loading.action}
              className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50 text-slate-300 hover:text-white backdrop-blur-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={createUser}
              disabled={loading.action}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25"
            >
              {loading.action ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Bulk Promote Dialog */}
      <Dialog open={showExistingUsers} onOpenChange={setShowExistingUsers}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col bg-slate-900/95 border-slate-700/50 backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-slate-100">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              Promote Users to {ROLE_CONFIG[roleToAssign as keyof typeof ROLE_CONFIG]?.label}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Select users to promote to the {ROLE_CONFIG[roleToAssign as keyof typeof ROLE_CONFIG]?.label} role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search users to promote..."
                value={promoteSearchQuery}
                onChange={(e) => {
                  setPromoteSearchQuery(e.target.value)
                  setPromoteCurrentPage(1)
                }}
                className="pl-12 bg-slate-800/50 border-slate-600/50 focus:border-blue-500/50 text-slate-100 placeholder:text-slate-400 backdrop-blur-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-96 pr-2">
              {paginatedPromoteUsers.map((u) => (
                <div
                  key={u.uid}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                    selectedExistingUsers.has(u.uid)
                      ? "bg-blue-500/10 border-blue-500/30 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10"
                      : "bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/50 backdrop-blur-sm"
                  }`}
                  onClick={() => {
                    const s = new Set(selectedExistingUsers)
                    s.has(u.uid) ? s.delete(u.uid) : s.add(u.uid)
                    setSelectedExistingUsers(s)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        checked={selectedExistingUsers.has(u.uid)}
                        onChange={() => {}}
                        className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <Avatar className="h-10 w-10 ring-2 ring-slate-700/50">
                        <AvatarFallback className="bg-slate-700/50 text-slate-300">
                          {(u.displayName || u.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-200">{u.displayName || u.email}</p>
                        <p className="text-sm text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50">
                      {ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG]?.label || u.role}
                    </Badge>
                  </div>
                </div>
              ))}

              {hasMorePromoteUsers && (
                <Button
                  variant="outline"
                  onClick={() => setPromoteCurrentPage((p) => p + 1)}
                  className="w-full bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50 text-slate-300 hover:text-white backdrop-blur-sm"
                >
                  Load More ({promoteUsers.length - promoteEnd} remaining)
                </Button>
              )}

              {!promoteUsers.length && (
                <div className="text-center py-12 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No users available for promotion</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-slate-700/50 pt-4">
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-slate-400">
                <span className="text-blue-400 font-semibold">{selectedExistingUsers.size}</span> user(s) selected
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowExistingUsers(false)
                    setSelectedExistingUsers(new Set())
                    setPromoteSearchQuery("")
                    setPromoteCurrentPage(1)
                  }}
                  disabled={loading.action}
                  className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50 text-slate-300 hover:text-white backdrop-blur-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={assignRoleToExistingUsers}
                  disabled={!selectedExistingUsers.size || loading.action}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25"
                >
                  {loading.action ? "Promoting..." : "Promote Users"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Delete Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent className="sm:max-w-md bg-slate-900/95 border-slate-700/50 backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-red-400">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-slate-400 space-y-2">
              <p>
                Are you sure you want to delete <strong className="text-slate-200">{userToDelete?.email}</strong>?
              </p>
              <p className="text-red-400 text-sm font-medium">⚠️ This action cannot be undone.</p>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="border-t border-slate-700/50 pt-4">
            <Button
              variant="outline"
              onClick={() => setUserToDelete(null)}
              className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50 text-slate-300 hover:text-white backdrop-blur-sm"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (userToDelete) {
                  await deleteUser(userToDelete.uid, userToDelete.email)
                  setUserToDelete(null)
                }
              }}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/25"
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced User Details Dialog */}
      <Dialog open={!!showUserDetails} onOpenChange={() => setShowUserDetails(null)}>
        <DialogContent className="sm:max-w-md bg-slate-900/95 border-slate-700/50 backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-slate-100">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30">
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
              User Details
            </DialogTitle>
          </DialogHeader>

          {showUserDetails && (
            <div className="space-y-6 py-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 ring-4 ring-slate-700/50">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${showUserDetails.displayName || showUserDetails.email}&backgroundColor=1e293b`}
                    />
                    <AvatarFallback className="text-2xl font-bold bg-slate-700/50 text-slate-300">
                      {(showUserDetails.displayName || showUserDetails.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 p-1 rounded-full bg-slate-900 border-2 border-slate-700">
                    {showUserDetails.disabled ? (
                      <UserX className="w-4 h-4 text-red-400" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-semibold text-slate-100">
                    {showUserDetails.displayName || showUserDetails.email}
                  </h4>
                  <Badge
                    className={`${ROLE_CONFIG[showUserDetails.role as keyof typeof ROLE_CONFIG]?.bgColor} ${ROLE_CONFIG[showUserDetails.role as keyof typeof ROLE_CONFIG]?.color} ${ROLE_CONFIG[showUserDetails.role as keyof typeof ROLE_CONFIG]?.borderColor} border backdrop-blur-sm gap-2`}
                  >
                    {React.createElement(ROLE_CONFIG[showUserDetails.role as keyof typeof ROLE_CONFIG]?.icon || Users, {
                      className: "w-3 h-3",
                    })}
                    {ROLE_CONFIG[showUserDetails.role as keyof typeof ROLE_CONFIG]?.label || showUserDetails.role}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-slate-700/50" />

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Display Name</Label>
                    <p className="text-sm text-slate-200 bg-slate-800/30 p-2 rounded-lg border border-slate-700/50">
                      {showUserDetails.displayName || "Not set"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Email Status</Label>
                    <div className="flex items-center space-x-2">
                      {showUserDetails.emailVerified ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border backdrop-blur-sm gap-2">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-400 border-red-500/30 border backdrop-blur-sm gap-2">
                          <XCircle className="w-3 h-3" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Email Address</Label>
                  <p className="text-sm text-slate-200 font-mono bg-slate-800/30 p-2 rounded-lg border border-slate-700/50">
                    {showUserDetails.email}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">User ID</Label>
                  <p className="text-sm text-slate-400 font-mono bg-slate-800/30 p-2 rounded-lg border border-slate-700/50 break-all">
                    {showUserDetails.uid}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Member Since</Label>
                    <p className="text-sm text-slate-200 bg-slate-800/30 p-2 rounded-lg border border-slate-700/50">
                      {formatDate(showUserDetails.createdAt)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Last Active</Label>
                    <p className="text-sm text-slate-200 bg-slate-800/30 p-2 rounded-lg border border-slate-700/50">
                      {formatDate(showUserDetails.lastSignIn)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Account Status</Label>
                  <div className="flex items-center space-x-2">
                    {showUserDetails.disabled ? (
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/30 border backdrop-blur-sm gap-2">
                        <UserX className="w-3 h-3" />
                        Disabled
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border backdrop-blur-sm gap-2">
                        <UserCheck className="w-3 h-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-slate-700/50 pt-4">
            <Button
              onClick={() => setShowUserDetails(null)}
              className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white shadow-lg"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Firebase helper --------------------------------------------------------
async function getIdToken(): Promise<string> {
  const { getAuth } = await import("firebase/auth")
  const user = getAuth().currentUser
  if (!user) throw new Error("No user signed in")
  return await user.getIdToken()
}
