"use client"

import type React from "react"
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
  UserCheck,
  UserX,
  Zap,
  BarChart3,
  Building2,
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
    color: "text-purple-800",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-300",
    badgeVariant: "default" as const,
    accentColor: "bg-purple-600",
    hoverColor: "hover:bg-purple-50",
    ringColor: "ring-purple-500",
    shadowColor: "shadow-purple-300",
    solidBg: "bg-purple-500",
  },
  admin: {
    label: "Admin",
    pluralLabel: "Admins",
    icon: Shield,
    color: "text-emerald-800",
    bgColor: "bg-emerald-100",
    borderColor: "border-emerald-300",
    badgeVariant: "secondary" as const,
    accentColor: "bg-emerald-600",
    hoverColor: "hover:bg-emerald-50",
    ringColor: "ring-emerald-500",
    shadowColor: "shadow-emerald-300",
    solidBg: "bg-emerald-500",
  },
  judge: {
    label: "Judge",
    pluralLabel: "Judges",
    icon: Scale,
    color: "text-amber-800",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-300",
    badgeVariant: "outline" as const,
    accentColor: "bg-amber-600",
    hoverColor: "hover:bg-amber-50",
    ringColor: "ring-amber-500",
    shadowColor: "shadow-amber-300",
    solidBg: "bg-amber-500",
  },
  user: {
    label: "Member",
    pluralLabel: "Members",
    icon: Users,
    color: "text-rose-800",
    bgColor: "bg-rose-100",
    borderColor: "border-rose-300",
    badgeVariant: "outline" as const,
    accentColor: "bg-rose-600",
    hoverColor: "hover:bg-rose-50",
    ringColor: "ring-rose-500",
    shadowColor: "shadow-rose-300",
    solidBg: "bg-rose-500",
  },
}

const ITEMS_PER_PAGE = 12

// --- Helper Components ------------------------------------------------------

// Vibrant stats card with solid colors
interface StatsCardProps {
  title: string
  count: number
  icon: React.ComponentType<any>
  color: string
  bgColor: string
  borderColor: string
  role: string
  selectedRole: string
  onSelectRole: (role: string) => void
  shadowColor: string
  solidBg: string
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  count,
  icon: Icon,
  color,
  bgColor,
  borderColor,
  role,
  selectedRole,
  onSelectRole,
  shadowColor,
  solidBg,
}) => {
  const config = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG]

  return (
    <Card
      className={`cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 border-2 ${
        selectedRole === role
          ? `ring-4 ${config?.ringColor || "ring-teal-500"} shadow-2xl ${shadowColor} ${bgColor} border-transparent`
          : `hover:border-gray-400 ${config?.hoverColor || "hover:bg-gray-50"} hover:shadow-xl ${shadowColor}`
      }`}
      onClick={() => onSelectRole(role)}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">{title}</p>
            <p className="text-4xl font-black text-gray-900">{count.toLocaleString()}</p>
          </div>
          <div className={`p-4 rounded-2xl ${solidBg} shadow-xl`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced user row component
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
    <TableRow className="hover:bg-orange-50 transition-all duration-300 group border-b-2 border-orange-100">
      <TableCell>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-3 ring-white shadow-xl group-hover:ring-orange-200 transition-all duration-300">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || user.email}`} />
              <AvatarFallback className={`text-sm font-black ${cfg.bgColor} ${cfg.color} border-2 ${cfg.borderColor}`}>
                {(user.displayName || user.email).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Online status indicator */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-3 border-white shadow-lg"></div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-gray-900 truncate group-hover:text-orange-900 transition-colors">
                {user.displayName || user.email}
              </p>
              {user.emailVerified && (
                <div className="relative">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div className="absolute inset-0 bg-emerald-400 rounded-full blur-sm opacity-30"></div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600 truncate group-hover:text-gray-700 transition-colors font-semibold">
              {user.email}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={cfg.badgeVariant}
          className={`gap-2 ${cfg.bgColor} ${cfg.color} ${cfg.borderColor} border-2 shadow-lg hover:shadow-xl transition-all duration-200 font-black`}
        >
          <cfg.icon className="w-4 h-4" />
          {cfg.label}
        </Badge>
      </TableCell>
      <TableCell>
        {user.disabled ? (
          <Badge className="gap-2 bg-red-100 text-red-800 border-2 border-red-300 shadow-lg font-black">
            <UserX className="w-4 h-4" />
            Disabled
          </Badge>
        ) : (
          <Badge className="gap-2 bg-emerald-100 text-emerald-800 border-2 border-emerald-300 shadow-lg font-black">
            <UserCheck className="w-4 h-4" />
            Active
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-sm font-bold text-gray-700 group-hover:text-gray-800 transition-colors">
        {formatDate(user.createdAt)}
      </TableCell>
      <TableCell className="text-sm font-bold text-gray-700 group-hover:text-gray-800 transition-colors">
        {formatDate(user.lastSignIn)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(user)}
            className="h-9 w-9 p-0 hover:bg-teal-100 hover:text-teal-700 transition-all duration-200 group/btn rounded-xl"
          >
            <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200 group/btn rounded-xl"
              >
                <MoreVertical className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 shadow-2xl border-2 border-gray-300 bg-white">
              <DropdownMenuLabel className="text-gray-800 font-black">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-300" />
              {actions.map((action, i) => (
                <DropdownMenuItem
                  key={i}
                  onClick={action.action}
                  className="gap-3 hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors focus:bg-gray-100 font-bold"
                >
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-gray-300" />
              <DropdownMenuItem
                onClick={() => onDelete(user.uid, user.email)}
                className="gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 transition-colors font-bold"
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

// Enhanced pagination component
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
    <div className="flex items-center justify-between px-6 py-4 border-t-2 border-orange-200 bg-orange-50">
      <div className="text-sm font-black text-gray-700">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="border-2 border-orange-300 hover:bg-orange-100 font-black"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex items-center gap-1">
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
                className={`w-10 h-10 p-0 font-black ${
                  currentPage === pageNum
                    ? "bg-teal-600 hover:bg-teal-700 text-white shadow-xl"
                    : "border-2 border-orange-300 hover:bg-orange-100"
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
          className="border-2 border-orange-300 hover:bg-orange-100 font-black"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// --- Main Component ---------------------------------------------------------
export default function UserRoleManager() {
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
        color: "text-emerald-600 hover:text-emerald-700",
        icon: Shield,
      })
    if (u.role !== "judge")
      actions.push({
        label: "Make Judge",
        action: () => updateRole(u.uid, "judge"),
        color: "text-amber-600 hover:text-amber-700",
        icon: Scale,
      })
    if (u.role !== "superadmin")
      actions.push({
        label: "Make Super Admin",
        action: () => updateRole(u.uid, "superadmin"),
        color: "text-purple-600 hover:text-purple-700",
        icon: Crown,
      })
    if (u.role !== "user")
      actions.push({
        label: "Remove Role",
        action: () => updateRole(u.uid, "user"),
        color: "text-gray-600 hover:text-gray-700",
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
      showNotification("error", "Error", "Failed to load statistics")
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
        showNotification("error", "Error", "Failed to load users")
      }
    } catch (error) {
      showNotification("error", "Error", "Failed to load users")
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
        showNotification("success", "Success", "User role updated successfully")
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification("error", "Error", data.error || "Failed to update role")
      }
    } catch (error) {
      showNotification("error", "Error", "Failed to update role")
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
        showNotification("success", "Success", "User deleted successfully")
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification("error", "Error", data.error || "Failed to delete user")
      }
    } catch (error) {
      showNotification("error", "Error", "Failed to delete user")
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
        showNotification("success", "Success", `${createUserForm.displayName} has been created`)
        setCreateUserForm({ email: "", password: "", displayName: "", role: "user" })
        setShowCreateUser(false)
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification("error", "Error", data.error || "Failed to create user")
      }
    } catch (error) {
      showNotification("error", "Error", "Failed to create user")
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
        showNotification("success", "Success", `Updated ${selectedExistingUsers.size} user(s)`)
        setSelectedExistingUsers(new Set())
        setShowExistingUsers(false)
        setPromoteSearchQuery("")
        setPromoteCurrentPage(1)
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification("error", "Error", "Some updates failed")
      }
    } catch (error) {
      showNotification("error", "Error", "Failed to update roles")
    } finally {
      setLoading((p) => ({ ...p, action: false }))
    }
  }

  // Enhanced notification renderer
  const renderNotification = (notification: NotificationState) => {
    const icons = {
      success: CheckCircle,
      error: AlertCircle,
      warning: AlertTriangle,
      info: AlertCircle,
    }

    const colors = {
      success: "bg-emerald-100 border-emerald-400 text-emerald-800 shadow-2xl shadow-emerald-300",
      error: "bg-red-100 border-red-400 text-red-800 shadow-2xl shadow-red-300",
      warning: "bg-amber-100 border-amber-400 text-amber-800 shadow-2xl shadow-amber-300",
      info: "bg-teal-100 border-teal-400 text-teal-800 shadow-2xl shadow-teal-300",
    }

    const Icon = icons[notification.type]

    return (
      <div
        key={notification.id}
        className={`flex items-start gap-3 p-4 rounded-2xl border-2 ${colors[notification.type]} animate-in slide-in-from-right-full duration-300`}
        role="alert"
      >
        <Icon className="w-6 h-6 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-black text-sm">{notification.title}</h4>
          <p className="text-sm mt-1 opacity-90 font-semibold">{notification.message}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeNotification(notification.id)}
          className="h-6 w-6 p-0 opacity-60 hover:opacity-100 hover:bg-white/30 transition-all duration-200 rounded-lg"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  // --- Render ---
  return (
    <div className="min-h-screen bg-orange-100">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">{notifications.map(renderNotification)}</div>
      )}

      <div className="max-w-7xl mx-auto p-6 space-y-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="p-4 bg-teal-600 rounded-2xl shadow-2xl">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900">Team Management</h1>
                <p className="text-gray-700 mt-1 font-bold">Manage users, roles, and permissions</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={loadInitialData}
              disabled={loading.stats || loading.users}
              className="gap-2 bg-white hover:bg-gray-50 border-2 border-orange-300 hover:border-orange-400 shadow-xl font-black"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading.stats || loading.users ? "animate-spin text-teal-600" : "text-gray-700"}`}
              />
              Refresh
            </Button>

            <Button
              onClick={() => setShowCreateUser(true)}
              className="gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 font-black"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {loading.stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse bg-white shadow-xl">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Users"
              count={stats.total}
              icon={BarChart3}
              color="text-teal-800"
              bgColor="bg-teal-100"
              borderColor="border-teal-300"
              role="all"
              selectedRole={selectedRole}
              onSelectRole={setSelectedRole}
              shadowColor="shadow-teal-300"
              solidBg="bg-teal-600"
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
                role={roleKey}
                selectedRole={selectedRole}
                onSelectRole={setSelectedRole}
                shadowColor={config.shadowColor}
                solidBg={config.solidBg}
              />
            ))}
          </div>
        ) : null}

        {/* Filters and Search */}
        <Card className="bg-white border-2 border-orange-300 shadow-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-black text-gray-700">
                  <Filter className="w-5 h-5" />
                  <span>Filter:</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedRole === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRole("all")}
                    className={
                      selectedRole === "all"
                        ? "bg-teal-600 hover:bg-teal-700 text-white shadow-xl font-black"
                        : "border-2 border-orange-300 hover:bg-orange-100 font-black"
                    }
                  >
                    All ({allUsers.length})
                  </Button>
                  {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => {
                    const count = allUsers.filter((u) => u.role === roleKey).length
                    return (
                      <Button
                        key={roleKey}
                        variant={selectedRole === roleKey ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedRole(roleKey)}
                        className={`gap-1 font-black ${
                          selectedRole === roleKey
                            ? "bg-teal-600 hover:bg-teal-700 text-white shadow-xl"
                            : "border-2 border-orange-300 hover:bg-orange-100"
                        }`}
                      >
                        <config.icon className="w-3 h-3" />
                        {config.label} ({count})
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="relative w-full lg:w-80">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-12 h-12 bg-white border-2 border-orange-300 focus:border-teal-400 shadow-xl font-bold"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-orange-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-white border-2 border-orange-300 shadow-2xl">
          <CardHeader className="pb-4 border-b-2 border-orange-200 bg-orange-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-xl font-black text-gray-900">
                  <Users className="w-6 h-6 text-teal-600" />
                  Users ({filteredUsers.length})
                </CardTitle>
                <CardDescription className="font-bold text-gray-700">
                  {selectedRole !== "all" &&
                    `Showing ${ROLE_CONFIG[selectedRole as keyof typeof ROLE_CONFIG]?.pluralLabel}`}
                </CardDescription>
              </div>

              {selectedRole !== "all" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setRoleToAssign(selectedRole)
                    setShowExistingUsers(true)
                  }}
                  className="gap-2 border-2 border-orange-300 hover:bg-orange-100 font-black"
                >
                  <Zap className="w-4 h-4" />
                  Bulk Actions
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading.users ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-4">
                  <RefreshCw className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
                  <p className="text-gray-700 font-black">Loading users...</p>
                </div>
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-6">
                  <Users className="w-16 h-16 text-gray-400 mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-gray-800">No users found</h3>
                    <p className="text-gray-600 font-bold">
                      {searchQuery ? "Try adjusting your search" : "No users match the selected filters"}
                    </p>
                  </div>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery("")}
                      className="border-2 border-orange-300 hover:bg-orange-100 font-black"
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
                    <TableRow className="bg-orange-50 border-b-2 border-orange-200">
                      <TableHead className="font-black text-gray-800">User</TableHead>
                      <TableHead className="font-black text-gray-800">Role</TableHead>
                      <TableHead className="font-black text-gray-800">Status</TableHead>
                      <TableHead className="font-black text-gray-800">Joined</TableHead>
                      <TableHead className="font-black text-gray-800">Last Active</TableHead>
                      <TableHead className="w-[120px] font-black text-gray-800">Actions</TableHead>
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

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent className="sm:max-w-md bg-white border-2 border-orange-300 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-gray-900">Create New User</DialogTitle>
            <DialogDescription className="font-bold text-gray-700">
              Add a new user to your organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role" className="font-black text-gray-800">
                Role
              </Label>
              <Select
                value={createUserForm.role}
                onValueChange={(value) => setCreateUserForm((f) => ({ ...f, role: value }))}
              >
                <SelectTrigger className="border-2 border-orange-300 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-orange-300">
                  <SelectItem value="user">Member</SelectItem>
                  <SelectItem value="judge">Judge</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="font-black text-gray-800">
                Full Name
              </Label>
              <Input
                id="displayName"
                placeholder="Enter full name"
                value={createUserForm.displayName}
                onChange={(e) => setCreateUserForm((f) => ({ ...f, displayName: e.target.value }))}
                className="border-2 border-orange-300 bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-black text-gray-800">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={createUserForm.email}
                onChange={(e) => setCreateUserForm((f) => ({ ...f, email: e.target.value }))}
                className="border-2 border-orange-300 bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-black text-gray-800">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={createUserForm.password}
                onChange={(e) => setCreateUserForm((f) => ({ ...f, password: e.target.value }))}
                className="border-2 border-orange-300 bg-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateUser(false)}
              disabled={loading.action}
              className="border-2 border-gray-400 hover:bg-gray-100 font-black"
            >
              Cancel
            </Button>
            <Button
              onClick={createUser}
              disabled={loading.action}
              className="bg-teal-600 hover:bg-teal-700 text-white font-black"
            >
              {loading.action ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Dialog */}
      <Dialog open={showExistingUsers} onOpenChange={setShowExistingUsers}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col bg-white border-2 border-orange-300 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-gray-900">Bulk Role Assignment</DialogTitle>
            <DialogDescription className="font-bold text-gray-700">
              Select users to assign the {ROLE_CONFIG[roleToAssign as keyof typeof ROLE_CONFIG]?.label} role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={promoteSearchQuery}
                onChange={(e) => {
                  setPromoteSearchQuery(e.target.value)
                  setPromoteCurrentPage(1)
                }}
                className="pl-10 border-2 border-orange-300 bg-white"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-96">
              {paginatedPromoteUsers.map((u) => (
                <div
                  key={u.uid}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedExistingUsers.has(u.uid)
                      ? "bg-teal-100 border-teal-400"
                      : "bg-white border-gray-300 hover:border-orange-400 hover:bg-orange-50"
                  }`}
                  onClick={() => {
                    const s = new Set(selectedExistingUsers)
                    s.has(u.uid) ? s.delete(u.uid) : s.add(u.uid)
                    setSelectedExistingUsers(s)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={selectedExistingUsers.has(u.uid)} onChange={() => {}} />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs font-black">
                          {(u.displayName || u.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-black text-sm">{u.displayName || u.email}</p>
                        <p className="text-xs text-gray-500 font-semibold">{u.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs font-black border-2">
                      {ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG]?.label || u.role}
                    </Badge>
                  </div>
                </div>
              ))}

              {hasMorePromoteUsers && (
                <Button
                  variant="outline"
                  onClick={() => setPromoteCurrentPage((p) => p + 1)}
                  className="w-full border-2 border-orange-300 hover:bg-orange-100 font-black"
                >
                  Load More ({promoteUsers.length - promoteEnd} remaining)
                </Button>
              )}

              {!promoteUsers.length && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-bold">No users available</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t-2 border-orange-200 pt-4">
            <div className="flex items-center justify-between w-full">
              <p className="text-sm font-black text-gray-700">{selectedExistingUsers.size} user(s) selected</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowExistingUsers(false)
                    setSelectedExistingUsers(new Set())
                    setPromoteSearchQuery("")
                    setPromoteCurrentPage(1)
                  }}
                  disabled={loading.action}
                  className="border-2 border-gray-400 hover:bg-gray-100 font-black"
                >
                  Cancel
                </Button>
                <Button
                  onClick={assignRoleToExistingUsers}
                  disabled={!selectedExistingUsers.size || loading.action}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-black"
                >
                  {loading.action ? "Updating..." : "Update Roles"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent className="sm:max-w-md bg-white border-2 border-red-300 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700 font-black">
              <AlertTriangle className="w-5 h-5" />
              Delete User
            </DialogTitle>
            <DialogDescription className="font-bold text-gray-700">
              Are you sure you want to delete <strong>{userToDelete?.email}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserToDelete(null)}
              className="border-2 border-gray-400 hover:bg-gray-100 font-black"
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
              className="bg-red-600 hover:bg-red-700 font-black"
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={!!showUserDetails} onOpenChange={() => setShowUserDetails(null)}>
        <DialogContent className="sm:max-w-md bg-white border-2 border-orange-300 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-gray-900">User Details</DialogTitle>
          </DialogHeader>

          {showUserDetails && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 ring-4 ring-orange-300">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${showUserDetails.displayName || showUserDetails.email}`}
                  />
                  <AvatarFallback className="text-lg font-black">
                    {(showUserDetails.displayName || showUserDetails.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-gray-900">
                    {showUserDetails.displayName || showUserDetails.email}
                  </h4>
                  <Badge
                    variant={ROLE_CONFIG[showUserDetails.role as keyof typeof ROLE_CONFIG]?.badgeVariant}
                    className="font-black"
                  >
                    {ROLE_CONFIG[showUserDetails.role as keyof typeof ROLE_CONFIG]?.label || showUserDetails.role}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-orange-300" />

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-black text-gray-600 uppercase">Full Name</Label>
                    <p className="text-sm mt-1 font-bold">{showUserDetails.displayName || "Not set"}</p>
                  </div>

                  <div>
                    <Label className="text-xs font-black text-gray-600 uppercase">Email Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {showUserDetails.emailVerified ? (
                        <Badge className="gap-1 bg-emerald-100 text-emerald-800 border-2 border-emerald-400 font-black">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge className="gap-1 bg-red-100 text-red-800 border-2 border-red-400 font-black">
                          <XCircle className="w-3 h-3" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-black text-gray-600 uppercase">Email</Label>
                  <p className="text-sm mt-1 font-mono font-bold">{showUserDetails.email}</p>
                </div>

                <div>
                  <Label className="text-xs font-black text-gray-600 uppercase">User ID</Label>
                  <p className="text-sm mt-1 font-mono text-gray-500 font-semibold">{showUserDetails.uid}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-black text-gray-600 uppercase">Joined</Label>
                    <p className="text-sm mt-1 font-bold">{formatDate(showUserDetails.createdAt)}</p>
                  </div>

                  <div>
                    <Label className="text-xs font-black text-gray-600 uppercase">Last Active</Label>
                    <p className="text-sm mt-1 font-bold">{formatDate(showUserDetails.lastSignIn)}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-black text-gray-600 uppercase">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {showUserDetails.disabled ? (
                      <Badge className="gap-1 bg-red-100 text-red-800 border-2 border-red-400 font-black">
                        <UserX className="w-3 h-3" />
                        Disabled
                      </Badge>
                    ) : (
                      <Badge className="gap-1 bg-emerald-100 text-emerald-800 border-2 border-emerald-400 font-black">
                        <UserCheck className="w-3 h-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setShowUserDetails(null)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black"
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
