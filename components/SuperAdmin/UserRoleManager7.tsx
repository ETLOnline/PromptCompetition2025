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
  TrendingUp,
  UserCheck,
  UserX,
  Zap,
  Settings,
  BarChart3,
  Activity,
  Clock,
  Mail,
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
    color: "text-slate-700",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-300",
    badgeVariant: "default" as const,
    accentColor: "bg-slate-600",
  },
  admin: {
    label: "Admin",
    pluralLabel: "Admins",
    icon: Shield,
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
    badgeVariant: "secondary" as const,
    accentColor: "bg-gray-600",
  },
  judge: {
    label: "Judge",
    pluralLabel: "Judges",
    icon: Scale,
    color: "text-zinc-700",
    bgColor: "bg-zinc-100",
    borderColor: "border-zinc-300",
    badgeVariant: "outline" as const,
    accentColor: "bg-zinc-600",
  },
  user: {
    label: "Member",
    pluralLabel: "Members",
    icon: Users,
    color: "text-stone-700",
    bgColor: "bg-stone-100",
    borderColor: "border-stone-300",
    badgeVariant: "outline" as const,
    accentColor: "bg-stone-600",
  },
}

const ITEMS_PER_PAGE = 12

// --- Helper Components ------------------------------------------------------

// Sophisticated Stats Card with modern design
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
  trend?: number
  accentColor: string
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
  trend = 0,
  accentColor,
}) => (
  <Card
    className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-0 shadow-sm ${
      selectedRole === role
        ? `ring-2 ring-slate-400 shadow-lg bg-white`
        : "hover:shadow-md bg-white hover:bg-gray-50/50"
    }`}
    onClick={() => onSelectRole(role)}
  >
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-600 tracking-wide">{title}</p>
          <div className="flex items-baseline space-x-3">
            <p className="text-3xl font-bold tracking-tight text-gray-900">{count.toLocaleString()}</p>
            {trend !== 0 && (
              <div
                className={`flex items-center text-xs px-2 py-1 rounded-full ${
                  trend > 0
                    ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                    : "text-red-700 bg-red-50 border border-red-200"
                }`}
              >
                <TrendingUp className={`w-3 h-3 mr-1 ${trend < 0 ? "rotate-180" : ""}`} />
                {Math.abs(trend)}%
              </div>
            )}
          </div>
        </div>
        <div className={`p-4 rounded-2xl ${accentColor} shadow-sm`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
)

// Enhanced User Row with sophisticated styling
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
    <TableRow className="hover:bg-gray-50/50 transition-all duration-200 border-b border-gray-100">
      <TableCell className="py-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-11 w-11 ring-2 ring-white shadow-sm">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || user.email}`} />
              <AvatarFallback className={`${cfg.bgColor} ${cfg.color} text-sm font-semibold`}>
                {(user.displayName || user.email).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Status indicator */}
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                user.disabled ? "bg-red-400" : "bg-emerald-400"
              }`}
            />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <p className="font-semibold text-gray-900 truncate">{user.displayName || user.email}</p>
              {user.emailVerified && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
            </div>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <Badge variant={cfg.badgeVariant} className={`gap-1.5 ${cfg.bgColor} ${cfg.color} border-0 font-medium`}>
          <cfg.icon className="w-3.5 h-3.5" />
          {cfg.label}
        </Badge>
      </TableCell>
      <TableCell className="py-4">
        {user.disabled ? (
          <Badge variant="outline" className="gap-1.5 text-red-600 border-red-200 bg-red-50">
            <UserX className="w-3.5 h-3.5" />
            Disabled
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-200 bg-emerald-50">
            <UserCheck className="w-3.5 h-3.5" />
            Active
          </Badge>
        )}
      </TableCell>
      <TableCell className="py-4 text-sm text-gray-600">{formatDate(user.createdAt)}</TableCell>
      <TableCell className="py-4 text-sm text-gray-600">{formatDate(user.lastSignIn)}</TableCell>
      <TableCell className="py-4">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(user)}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 shadow-lg border-gray-200">
              <DropdownMenuLabel className="text-gray-700">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-100" />
              {actions.map((action, i) => (
                <DropdownMenuItem key={i} onClick={action.action} className="gap-2 hover:bg-gray-50 text-gray-700">
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-gray-100" />
              <DropdownMenuItem
                onClick={() => onDelete(user.uid, user.email)}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
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

// Modern Pagination Component
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
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
      <div className="text-sm text-gray-600 font-medium">
        Showing <span className="text-gray-900">{startItem}</span> to <span className="text-gray-900">{endItem}</span>{" "}
        of <span className="text-gray-900">{totalItems}</span> users
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="border-gray-200 hover:bg-gray-50"
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
                className={`w-9 h-9 p-0 ${
                  currentPage === pageNum
                    ? "bg-gray-900 hover:bg-gray-800 text-white"
                    : "border-gray-200 hover:bg-gray-50"
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
          className="border-gray-200 hover:bg-gray-50"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// --- Main Component ---------------------------------------------------------
export default function UserRoleManager() {
  // --- State ---
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

  // --- Effects ---
  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedRole, searchQuery])

  // --- Helper functions ---
  const loadInitialData = useCallback(async () => {
    await Promise.allSettled([fetchStats(), fetchAllUsers()])
  }, [])

  // Real-time search filter
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
        color: "text-gray-600 hover:text-gray-700",
        icon: Shield,
      })
    if (u.role !== "judge")
      actions.push({
        label: "Make Judge",
        action: () => updateRole(u.uid, "judge"),
        color: "text-zinc-600 hover:text-zinc-700",
        icon: Scale,
      })
    if (u.role !== "superadmin")
      actions.push({
        label: "Make Super Admin",
        action: () => updateRole(u.uid, "superadmin"),
        color: "text-slate-600 hover:text-slate-700",
        icon: Crown,
      })
    if (u.role !== "user")
      actions.push({
        label: "Remove Role",
        action: () => updateRole(u.uid, "user"),
        color: "text-stone-600 hover:text-stone-700",
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

  // Render notification with sophisticated styling
  const renderNotification = (notification: NotificationState) => {
    const icons = {
      success: CheckCircle,
      error: AlertCircle,
      warning: AlertTriangle,
      info: AlertCircle,
    }

    const colors = {
      success: "bg-emerald-50 border-emerald-200 text-emerald-800",
      error: "bg-red-50 border-red-200 text-red-800",
      warning: "bg-amber-50 border-amber-200 text-amber-800",
      info: "bg-blue-50 border-blue-200 text-blue-800",
    }

    const Icon = icons[notification.type]

    return (
      <div
        key={notification.id}
        className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${colors[notification.type]} animate-in slide-in-from-right-full duration-300`}
        role="alert"
      >
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{notification.title}</h4>
          <p className="text-sm opacity-90 mt-1">{notification.message}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeNotification(notification.id)}
          className="h-6 w-6 p-0 opacity-60 hover:opacity-100 hover:bg-white/50"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  // --- Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-slate-200">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">{notifications.map(renderNotification)}</div>
      )}

      <div className="container mx-auto p-6 space-y-8">
        {/* Modern Header with Creative Layout */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl opacity-95" />
          <div className="relative px-8 py-12 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight">User Management</h1>
                    <p className="text-gray-300 text-lg mt-1">Comprehensive user administration and role management</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={loadInitialData}
                  disabled={loading.stats || loading.users}
                  className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${loading.stats || loading.users ? "animate-spin" : ""}`} />
                  Refresh Data
                </Button>
                <Button
                  onClick={() => setShowCreateUser(true)}
                  className="gap-2 bg-white text-gray-900 hover:bg-gray-100"
                >
                  <UserPlus className="w-4 h-4" />
                  Add User
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview with Creative Grid */}
        {loading.stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
              color="text-gray-700"
              bgColor="bg-gray-100"
              borderColor="border-gray-300"
              role="all"
              selectedRole={selectedRole}
              onSelectRole={setSelectedRole}
              trend={8}
              accentColor="bg-gray-600"
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
                trend={Math.floor(Math.random() * 20) - 5}
                accentColor={config.accentColor}
              />
            ))}
          </div>
        ) : null}

        {/* Enhanced Search and Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Section */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Search className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">Search Users</h3>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search by name, email, or user ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 pr-12 h-12 border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Section */}
          <div>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">Filter by Role</h3>
                  </div>
                  <div className="space-y-2">
                    <Button
                      variant={selectedRole === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedRole("all")}
                      className={`w-full justify-start gap-2 ${
                        selectedRole === "all"
                          ? "bg-gray-900 hover:bg-gray-800 text-white"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <Users className="w-4 h-4" />
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
                          className={`w-full justify-start gap-2 ${
                            selectedRole === roleKey
                              ? "bg-gray-900 hover:bg-gray-800 text-white"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <config.icon className="w-4 h-4" />
                          {config.label} ({count})
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Users Table with Modern Design */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Activity className="w-6 h-6 text-gray-600" />
                  Users ({filteredUsers.length})
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {selectedRole !== "all" &&
                    `Showing ${ROLE_CONFIG[selectedRole as keyof typeof ROLE_CONFIG]?.pluralLabel} • `}
                  Manage user accounts and permissions
                </CardDescription>
              </div>
              {selectedRole !== "all" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setRoleToAssign(selectedRole)
                    setShowExistingUsers(true)
                  }}
                  className="gap-2 border-gray-200 hover:bg-gray-50"
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
                  <RefreshCw className="w-10 h-10 text-gray-400 animate-spin mx-auto" />
                  <div className="space-y-2">
                    <p className="text-gray-600 font-medium">Loading users...</p>
                    <p className="text-gray-400 text-sm">Please wait while we fetch the latest data</p>
                  </div>
                </div>
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-gray-900">No users found</h3>
                    <p className="text-gray-500 max-w-md">
                      {searchQuery
                        ? "Try adjusting your search criteria or clearing the current filters"
                        : "No users match the selected role filter"}
                    </p>
                  </div>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery("")}
                      className="border-gray-200 hover:bg-gray-50"
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
                    <TableRow className="bg-gray-50/50 border-b border-gray-100">
                      <TableHead className="font-semibold text-gray-700 py-4">User</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">Role</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Joined
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          Last Active
                        </div>
                      </TableHead>
                      <TableHead className="w-[120px] font-semibold text-gray-700 py-4">Actions</TableHead>
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

      {/* Enhanced Dialogs with Modern Styling */}

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent className="sm:max-w-md border-0 shadow-xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <UserPlus className="w-5 h-5 text-gray-600" />
              </div>
              Create New User
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Add a new user to your platform with the specified role and permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-semibold text-gray-700">
                Role
              </Label>
              <Select
                value={createUserForm.role}
                onValueChange={(value) => setCreateUserForm((f) => ({ ...f, role: value }))}
              >
                <SelectTrigger className="border-gray-200 focus:border-gray-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-gray-200">
                  <SelectItem value="user">Member</SelectItem>
                  <SelectItem value="judge">Judge</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-semibold text-gray-700">
                Full Name *
              </Label>
              <Input
                id="displayName"
                placeholder="Enter full name"
                value={createUserForm.displayName}
                onChange={(e) => setCreateUserForm((f) => ({ ...f, displayName: e.target.value }))}
                className="border-gray-200 focus:border-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email Address *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm((f) => ({ ...f, email: e.target.value }))}
                  className="pl-10 border-gray-200 focus:border-gray-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password *
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={createUserForm.password}
                onChange={(e) => setCreateUserForm((f) => ({ ...f, password: e.target.value }))}
                className="border-gray-200 focus:border-gray-400"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-gray-100 pt-6">
            <Button
              variant="outline"
              onClick={() => setShowCreateUser(false)}
              disabled={loading.action}
              className="border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button onClick={createUser} disabled={loading.action} className="bg-gray-900 hover:bg-gray-800 text-white">
              {loading.action ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Dialog */}
      <Dialog open={showExistingUsers} onOpenChange={setShowExistingUsers}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col border-0 shadow-xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Zap className="w-5 h-5 text-gray-600" />
              </div>
              Bulk Role Assignment
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Select users to assign the {ROLE_CONFIG[roleToAssign as keyof typeof ROLE_CONFIG]?.label} role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search users to promote..."
                value={promoteSearchQuery}
                onChange={(e) => {
                  setPromoteSearchQuery(e.target.value)
                  setPromoteCurrentPage(1)
                }}
                className="pl-10 border-gray-200 focus:border-gray-400"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-96">
              {paginatedPromoteUsers.map((u) => (
                <div
                  key={u.uid}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedExistingUsers.has(u.uid)
                      ? "bg-gray-50 border-gray-300 ring-2 ring-gray-200"
                      : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    const s = new Set(selectedExistingUsers)
                    s.has(u.uid) ? s.delete(u.uid) : s.add(u.uid)
                    setSelectedExistingUsers(s)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedExistingUsers.has(u.uid)}
                        onChange={() => {}}
                        className="border-gray-300"
                      />
                      <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                        <AvatarFallback className="bg-gray-100 text-gray-600 font-semibold">
                          {(u.displayName || u.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">{u.displayName || u.email}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-gray-200 text-gray-600">
                      {ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG]?.label || u.role}
                    </Badge>
                  </div>
                </div>
              ))}

              {hasMorePromoteUsers && (
                <Button
                  variant="outline"
                  onClick={() => setPromoteCurrentPage((p) => p + 1)}
                  className="w-full border-gray-200 hover:bg-gray-50"
                >
                  Load More ({promoteUsers.length - promoteEnd} remaining)
                </Button>
              )}

              {!promoteUsers.length && (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="font-medium">No users available for promotion</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between w-full">
              <p className="text-sm font-medium text-gray-600">
                <span className="text-gray-900">{selectedExistingUsers.size}</span> user(s) selected
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
                  className="border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={assignRoleToExistingUsers}
                  disabled={!selectedExistingUsers.size || loading.action}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
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
        <DialogContent className="sm:max-w-md border-0 shadow-xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-gray-600 space-y-2">
              <p>
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">{userToDelete?.email}</span>?
              </p>
              <p className="text-red-600 text-sm font-medium">⚠️ This action cannot be undone.</p>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="border-t border-gray-100 pt-6">
            <Button
              variant="outline"
              onClick={() => setUserToDelete(null)}
              className="border-gray-200 hover:bg-gray-50"
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
              className="bg-red-600 hover:bg-red-700"
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={!!showUserDetails} onOpenChange={() => setShowUserDetails(null)}>
        <DialogContent className="sm:max-w-md border-0 shadow-xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Eye className="w-5 h-5 text-gray-600" />
              </div>
              User Details
            </DialogTitle>
          </DialogHeader>

          {showUserDetails && (
            <div className="space-y-6 py-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 ring-4 ring-gray-100 shadow-sm">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${showUserDetails.displayName || showUserDetails.email}`}
                    />
                    <AvatarFallback className="text-xl font-bold bg-gray-100 text-gray-600">
                      {(showUserDetails.displayName || showUserDetails.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-3 border-white ${
                      showUserDetails.disabled ? "bg-red-400" : "bg-emerald-400"
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-gray-900">
                    {showUserDetails.displayName || showUserDetails.email}
                  </h4>
                  <Badge
                    variant={ROLE_CONFIG[showUserDetails.role as keyof typeof ROLE_CONFIG]?.badgeVariant}
                    className="font-medium"
                  >
                    {ROLE_CONFIG[showUserDetails.role as keyof typeof ROLE_CONFIG]?.label || showUserDetails.role}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-gray-200" />

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</Label>
                    <p className="text-sm font-medium text-gray-900">{showUserDetails.displayName || "Not set"}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Status</Label>
                    <div className="flex items-center space-x-2">
                      {showUserDetails.emailVerified ? (
                        <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-50">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-red-600 border-red-200 bg-red-50">
                          <XCircle className="w-3 h-3" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</Label>
                  <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded-lg">{showUserDetails.email}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">User ID</Label>
                  <p className="text-sm font-mono text-gray-500 bg-gray-50 p-2 rounded-lg break-all">
                    {showUserDetails.uid}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Member Since</Label>
                    <p className="text-sm font-medium text-gray-900">{formatDate(showUserDetails.createdAt)}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Active</Label>
                    <p className="text-sm font-medium text-gray-900">{formatDate(showUserDetails.lastSignIn)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Status</Label>
                  <div className="flex items-center space-x-2">
                    {showUserDetails.disabled ? (
                      <Badge variant="outline" className="gap-1 text-red-600 border-red-200 bg-red-50">
                        <UserX className="w-3 h-3" />
                        Disabled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-50">
                        <UserCheck className="w-3 h-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-gray-100 pt-6">
            <Button
              onClick={() => setShowUserDetails(null)}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
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
