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
  UserCheck,
  UserX,
  Zap,
  Star,
  Activity,
  Globe,
  Sparkles,
  Award,
  Target,
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
    color: "text-purple-700",
    bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
    borderColor: "border-purple-200",
    shadowColor: "shadow-purple-100",
    gradientFrom: "from-purple-500",
    gradientTo: "to-pink-500",
    badgeStyle: "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200",
  },
  admin: {
    label: "Admin",
    pluralLabel: "Admins",
    icon: Shield,
    color: "text-blue-700",
    bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
    borderColor: "border-blue-200",
    shadowColor: "shadow-blue-100",
    gradientFrom: "from-blue-500",
    gradientTo: "to-cyan-500",
    badgeStyle: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-200",
  },
  judge: {
    label: "Judge",
    pluralLabel: "Judges",
    icon: Scale,
    color: "text-emerald-700",
    bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50",
    borderColor: "border-emerald-200",
    shadowColor: "shadow-emerald-100",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-teal-500",
    badgeStyle: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200",
  },
  user: {
    label: "Contestant",
    pluralLabel: "Contestants",
    icon: Users,
    color: "text-slate-700",
    bgColor: "bg-gradient-to-br from-slate-50 to-gray-50",
    borderColor: "border-slate-200",
    shadowColor: "shadow-slate-100",
    gradientFrom: "from-slate-500",
    gradientTo: "to-gray-500",
    badgeStyle: "bg-gradient-to-r from-slate-500 to-gray-500 text-white shadow-lg shadow-slate-200",
  },
}

const ITEMS_PER_PAGE = 12

// --- Helper Components ------------------------------------------------------

// Modern Stats Card with creative light theme design
interface StatsCardProps {
  title: string
  count: number
  icon: React.ComponentType<any>
  color: string
  bgColor: string
  borderColor: string
  shadowColor: string
  gradientFrom: string
  gradientTo: string
  role: string
  selectedRole: string
  onSelectRole: (role: string) => void
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  count,
  icon: Icon,
  color,
  bgColor,
  borderColor,
  shadowColor,
  gradientFrom,
  gradientTo,
  role,
  selectedRole,
  onSelectRole,
}) => (
  <Card
    className={`group cursor-pointer transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${bgColor} border-2 ${borderColor} hover:border-opacity-60 ${
      selectedRole === role
        ? `ring-4 ring-blue-200 ${shadowColor} shadow-2xl scale-105 -translate-y-1`
        : `hover:shadow-2xl ${shadowColor}`
    } relative overflow-hidden backdrop-blur-sm`}
    onClick={() => onSelectRole(role)}
  >
    {/* Animated background pattern */}
    <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[length:20px_20px] animate-pulse" />
    </div>

    <CardContent className="p-6 relative z-10">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-600 group-hover:text-gray-700 transition-colors uppercase tracking-wide">
            {title}
          </p>
          <div className="flex items-baseline space-x-3">
            <p className="text-4xl font-black tracking-tight text-gray-900 group-hover:text-gray-800 transition-colors">
              {count.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="relative">
          <div
            className={`p-4 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300 relative overflow-hidden`}
          >
            <Icon className="w-8 h-8 text-white drop-shadow-lg relative z-10" />

            {/* Icon glow effect */}
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-300" />

            {/* Animated ring */}
            <div className="absolute inset-0 rounded-2xl border-2 border-white opacity-0 group-hover:opacity-30 animate-ping" />
          </div>
        </div>
      </div>

      {/* Progress bar animation */}
      <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div
          className={`h-full bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-1000 ease-out`}
          style={{ width: `${Math.min((count / 100) * 100, 100)}%` }}
        />
      </div>
    </CardContent>
  </Card>
)

// Enhanced User Row with creative light theme styling
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
    <TableRow className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border-b border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50">
      <TableCell>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-4 ring-white shadow-lg group-hover:ring-blue-200 group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || user.email}`}
                />
              <AvatarFallback className={`${cfg.bgColor} ${cfg.color} font-bold text-lg border-2 ${cfg.borderColor}`}>
                {(user.displayName || user.email).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Status indicator with pulse animation */}
            
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <p className="font-bold text-gray-900 group-hover:text-blue-900 transition-colors text-lg">
                {user.displayName || user.email}
              </p>
              {user.emailVerified && (
                <div className="relative">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 drop-shadow-sm" />
                  <div className="absolute inset-0 bg-emerald-400 rounded-full blur-sm opacity-30 animate-pulse" />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors font-medium">
              {user.email}
            </p>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <Badge
          className={`${cfg.badgeStyle} hover:scale-105 transition-transform duration-200 gap-2 px-3 py-1.5 font-semibold`}
        >
          <cfg.icon className="w-4 h-4" />
          {cfg.label}
        </Badge>
      </TableCell>

      <TableCell>
        <div className="flex items-center space-x-2">
          {user.disabled ? (
            <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-200 gap-2 px-3 py-1.5 font-semibold">
              <UserX className="w-4 h-4" />
              Disabled
            </Badge>
          ) : (
            <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-200 gap-2 px-3 py-1.5 font-semibold">
              <UserCheck className="w-4 h-4" />
              Active
            </Badge>
          )}
        </div>
      </TableCell>

      <TableCell className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors font-medium">
        {formatDate(user.createdAt)}
      </TableCell>

      <TableCell className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors font-medium">
        {formatDate(user.lastSignIn)}
      </TableCell>

      <TableCell>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(user)}
            className="h-10 w-10 p-0 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:text-blue-700 transition-all duration-200 group/btn rounded-xl shadow-sm hover:shadow-lg"
          >
            <Eye className="w-4 h-4 group-hover/btn:scale-125 transition-transform" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 hover:bg-gradient-to-r hover:from-gray-100 hover:to-slate-100 hover:text-gray-700 transition-all duration-200 group/btn rounded-xl shadow-sm hover:shadow-lg"
              >
                <MoreVertical className="w-4 h-4 group-hover/btn:scale-125 transition-transform" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl p-2"
            >
              <DropdownMenuLabel className="text-gray-700 font-semibold px-3 py-2">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200 my-2" />
              {actions.map((action, i) => (
                <DropdownMenuItem
                  key={i}
                  onClick={action.action}
                  className="gap-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-gray-700 hover:text-blue-700 transition-all duration-200 focus:bg-gradient-to-r focus:from-blue-50 focus:to-purple-50 rounded-xl px-3 py-2.5 font-medium"
                >
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-gray-200 my-2" />
              <DropdownMenuItem
                onClick={() => onDelete(user.uid, user.email)}
                className="gap-3 text-red-600 hover:text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 focus:bg-gradient-to-r focus:from-red-50 focus:to-pink-50 transition-all duration-200 rounded-xl px-3 py-2.5 font-medium"
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

// Creative Pagination with modern light theme design
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
    <div className="flex items-center justify-between px-8 py-6 border-t border-gray-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50 backdrop-blur-sm">
      <div className="text-sm text-gray-600 font-medium">
        Showing <span className="text-blue-600 font-bold">{startItem}</span> to{" "}
        <span className="text-blue-600 font-bold">{endItem}</span> of{" "}
        <span className="text-blue-600 font-bold">{totalItems}</span> users
      </div>

      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="bg-white/80 border-gray-300 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:border-blue-300 text-gray-700 hover:text-blue-700 backdrop-blur-sm transition-all duration-300 shadow-sm hover:shadow-lg rounded-xl px-4 py-2 font-medium"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center space-x-2">
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
                className={`w-12 h-12 p-0 transition-all duration-300 font-bold rounded-xl ${
                  currentPage === pageNum
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-xl shadow-blue-200 scale-110"
                    : "bg-white/80 border-gray-300 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:border-blue-300 text-gray-700 hover:text-blue-700 backdrop-blur-sm shadow-sm hover:shadow-lg hover:scale-105"
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
          className="bg-white/80 border-gray-300 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:border-blue-300 text-gray-700 hover:text-blue-700 backdrop-blur-sm transition-all duration-300 shadow-sm hover:shadow-lg rounded-xl px-4 py-2 font-medium"
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
        color: "text-blue-600 hover:text-blue-700",
        icon: Shield,
      })
    if (u.role !== "judge")
      actions.push({
        label: "Make Judge",
        action: () => updateRole(u.uid, "judge"),
        color: "text-emerald-600 hover:text-emerald-700",
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

  // Enhanced notification renderer with creative light theme
  const renderNotification = (notification: NotificationState) => {
    const icons = {
      success: CheckCircle,
      error: AlertCircle,
      warning: AlertTriangle,
      info: AlertCircle,
    }

    const colors = {
      success: "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 text-emerald-800 shadow-emerald-100",
      error: "bg-gradient-to-r from-red-50 to-pink-50 border-red-200 text-red-800 shadow-red-100",
      warning: "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-800 shadow-amber-100",
      info: "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 text-blue-800 shadow-blue-100",
    }

    const Icon = icons[notification.type]

    return (
      <div
        key={notification.id}
        className={`flex items-start gap-4 p-5 rounded-2xl border-2 backdrop-blur-xl ${colors[notification.type]} shadow-2xl animate-in slide-in-from-right-full duration-500 relative overflow-hidden`}
        role="alert"
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[length:15px_15px] animate-pulse" />
        </div>

        <div className="relative z-10">
          <div className="p-2 rounded-xl bg-white/50 shadow-lg">
            <Icon className="w-5 h-5 flex-shrink-0" />
          </div>
        </div>

        <div className="flex-1 min-w-0 relative z-10">
          <h4 className="font-bold text-sm">{notification.title}</h4>
          <p className="text-sm opacity-90 mt-1 font-medium">{notification.message}</p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeNotification(notification.id)}
          className="h-8 w-8 p-0 opacity-60 hover:opacity-100 hover:bg-white/20 transition-all duration-200 rounded-xl relative z-10"
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Floating decorative element */}
        <div className="absolute top-2 right-12 opacity-30">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
      </div>
    )
  }

  // --- Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Creative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-pink-200/30 to-yellow-200/30 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-to-r from-emerald-200/30 to-teal-200/30 rounded-full blur-xl animate-pulse delay-500" />

        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

        {/* Floating particles */}
        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-blue-400 rounded-full animate-bounce opacity-60" />
        <div className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-300 opacity-60" />
        <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-700 opacity-60" />
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-6 right-6 z-50 space-y-4 max-w-sm">{notifications.map(renderNotification)}</div>
      )}

      <div className="container mx-auto p-8 space-y-10 relative z-10">
        {/* Header with creative styling */}
        <div className="flex flex-col space-y-8 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="space-y-6">
            <div className="flex items-center space-x-6">

              <div>
                <h1 className="text-6xl font-black tracking-tight bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  User Management
                </h1>
                <p className="text-2xl text-gray-600 mt-3 font-semibold">
                  Advanced control center with{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    real-time analytics
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={loadInitialData}
              disabled={loading.stats || loading.users}
              className="gap-3 bg-white/80 border-2 border-gray-300 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:border-blue-300 text-gray-700 hover:text-blue-700 backdrop-blur-sm transition-all duration-300 group shadow-lg hover:shadow-xl rounded-2xl px-6 py-3 font-semibold"
            >
              <RefreshCw
                className={`w-5 h-5 group-hover:scale-110 transition-transform ${loading.stats || loading.users ? "animate-spin" : ""}`}
              />
              Refresh Data
            </Button>

            <Button
              onClick={() => setShowCreateUser(true)}
              className="gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-2xl shadow-emerald-200 hover:shadow-emerald-300 transition-all duration-300 group rounded-2xl px-6 py-3 font-semibold hover:scale-105"
            >
              <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Add User
            </Button>
          </div>
        </div>

        {/* Stats Overview with enhanced creative styling */}
        {loading.stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {[...Array(5)].map((_, i) => (
              <Card
                key={i}
                className="animate-pulse bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-200 rounded-3xl shadow-xl"
              >
                <CardContent className="p-8">
                  <div className="h-4 bg-gray-300 rounded-full w-3/4 mb-4"></div>
                  <div className="h-10 bg-gray-300 rounded-full w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <StatsCard
              title="Total Users"
              count={stats.total}
              icon={Activity}
              color="text-slate-700"
              bgColor="bg-gradient-to-br from-slate-50 to-gray-50"
              borderColor="border-slate-200"
              shadowColor="shadow-slate-100"
              gradientFrom="from-slate-500"
              gradientTo="to-gray-500"
              role="all"
              selectedRole={selectedRole}
              onSelectRole={setSelectedRole}
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
                shadowColor={config.shadowColor}
                gradientFrom={config.gradientFrom}
                gradientTo={config.gradientTo}
                role={roleKey}
                selectedRole={selectedRole}
                onSelectRole={setSelectedRole}
              />
            ))}
          </div>
        ) : null}

        {/* Enhanced Filters and Search */}
        <Card className="bg-white/80 border-2 border-gray-200 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col space-y-8 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-200 shadow-lg">
                    <Filter className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-bold text-lg">Filter by role:</span>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Button
                    variant={selectedRole === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRole("all")}
                    className={`gap-3 transition-all duration-300 font-semibold px-5 py-3 rounded-2xl ${
                      selectedRole === "all"
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-2xl shadow-blue-200 scale-110"
                        : "bg-white/80 border-2 border-gray-300 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:border-blue-300 text-gray-700 hover:text-blue-700 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105"
                    }`}
                  >
                    <Target className="w-4 h-4" />
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
                        className={`gap-3 transition-all duration-300 font-semibold px-5 py-3 rounded-2xl ${
                          selectedRole === roleKey
                            ? `bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} hover:scale-110 text-white shadow-2xl ${config.shadowColor} scale-110`
                            : "bg-white/80 border-2 border-gray-300 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:border-blue-300 text-gray-700 hover:text-blue-700 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105"
                        }`}
                      >
                        <config.icon className="w-4 h-4" />
                        {config.label} ({count})
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="relative w-full lg:w-96">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-200/50 to-purple-200/50 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    placeholder="Search users, emails, or IDs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-14 pr-14 h-14 bg-white/80 border-2 border-gray-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-gray-900 placeholder:text-gray-500 backdrop-blur-sm transition-all duration-300 group rounded-2xl shadow-lg focus:shadow-xl font-medium text-lg"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all duration-200 rounded-xl"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Users Table */}
        <Card className="bg-white/80 border-2 border-gray-200 backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl">
          <CardHeader className="pb-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <CardTitle className="text-3xl text-gray-900 flex items-center gap-4 font-black">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-300 shadow-lg">
                    <Users className="w-7 h-7 text-blue-600" />
                  </div>
                  Users ({filteredUsers.length})
                </CardTitle>
                <CardDescription className="text-gray-600 text-lg font-medium">
                  {selectedRole !== "all" &&
                    `Filtered by ${ROLE_CONFIG[selectedRole as keyof typeof ROLE_CONFIG]?.label} • `}
                  Real-time user management and analytics dashboard
                </CardDescription>
              </div>

              {selectedRole !== "all" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setRoleToAssign(selectedRole)
                    setShowExistingUsers(true)
                  }}
                  className="gap-3 bg-white/80 border-2 border-gray-300 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:border-purple-300 text-gray-700 hover:text-purple-700 backdrop-blur-sm transition-all duration-300 group shadow-lg hover:shadow-xl rounded-2xl px-6 py-3 font-semibold hover:scale-105"
                >
                  <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Bulk Promote
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading.users ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-6">
                  <div className="relative">
                    <RefreshCw className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
                    <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-30 animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-gray-700 font-bold text-xl">Loading users...</p>
                    <p className="text-gray-500 text-lg">Fetching latest data from the server</p>
                  </div>
                </div>
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-8">
                  <div className="relative">
                    <Users className="w-20 h-20 text-gray-400 mx-auto" />
                    <div className="absolute inset-0 bg-gray-400 rounded-full blur-2xl opacity-20" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-gray-700">No users found</h3>
                    <p className="text-gray-500 max-w-md text-lg">
                      {searchQuery
                        ? "Try adjusting your search criteria or filters"
                        : "No users match the selected filters"}
                    </p>
                  </div>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery("")}
                      className="bg-white/80 border-2 border-gray-300 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:border-blue-300 text-gray-700 hover:text-blue-700 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl px-6 py-3 font-semibold hover:scale-105"
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
                    <TableRow className="border-b-2 border-gray-200 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30">
                      <TableHead className="text-gray-700 font-bold text-lg py-6">User</TableHead>
                      <TableHead className="text-gray-700 font-bold text-lg py-6">Role</TableHead>
                      <TableHead className="text-gray-700 font-bold text-lg py-6">Status</TableHead>
                      <TableHead className="text-gray-700 font-bold text-lg py-6">Joined</TableHead>
                      <TableHead className="text-gray-700 font-bold text-lg py-6">Last Active</TableHead>
                      <TableHead className="text-gray-700 font-bold text-lg py-6 w-[140px]">Actions</TableHead>
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
        <DialogContent className="sm:max-w-md bg-white/95 border-2 border-gray-200 backdrop-blur-xl shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4 text-gray-900 text-2xl font-bold">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-300 shadow-lg">
                <UserPlus className="w-6 h-6 text-emerald-600" />
              </div>
              Create New User
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-lg font-medium">
              Add a new user to your platform with specified role and permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-3">
              <Label htmlFor="role" className="text-gray-700 font-bold text-lg">
                Role
              </Label>
              <Select
                value={createUserForm.role}
                onValueChange={(value) => setCreateUserForm((f) => ({ ...f, role: value }))}
              >
                <SelectTrigger className="bg-white/80 border-2 border-gray-300 focus:border-blue-400 text-gray-900 backdrop-blur-sm rounded-2xl h-12 text-lg font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/95 border-2 border-gray-200 backdrop-blur-xl rounded-2xl shadow-2xl">
                  <SelectItem
                    value="judge"
                    className="text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl py-3 font-medium"
                  >
                    Judge
                  </SelectItem>
                  <SelectItem
                    value="admin"
                    className="text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl py-3 font-medium"
                  >
                    Admin
                  </SelectItem>
                  <SelectItem
                    value="superadmin"
                    className="text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl py-3 font-medium"
                  >
                    Super Admin
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="displayName" className="text-gray-700 font-bold text-lg">
                Display Name *
              </Label>
              <Input
                id="displayName"
                placeholder="Enter full name"
                value={createUserForm.displayName}
                onChange={(e) => setCreateUserForm((f) => ({ ...f, displayName: e.target.value }))}
                className="bg-white/80 border-2 border-gray-300 focus:border-blue-400 text-gray-900 placeholder:text-gray-500 backdrop-blur-sm rounded-2xl h-12 text-lg font-medium"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-gray-700 font-bold text-lg">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={createUserForm.email}
                onChange={(e) => setCreateUserForm((f) => ({ ...f, email: e.target.value }))}
                className="bg-white/80 border-2 border-gray-300 focus:border-blue-400 text-gray-900 placeholder:text-gray-500 backdrop-blur-sm rounded-2xl h-12 text-lg font-medium"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-gray-700 font-bold text-lg">
                Password *
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={createUserForm.password}
                onChange={(e) => setCreateUserForm((f) => ({ ...f, password: e.target.value }))}
                className="bg-white/80 border-2 border-gray-300 focus:border-blue-400 text-gray-900 placeholder:text-gray-500 backdrop-blur-sm rounded-2xl h-12 text-lg font-medium"
              />
            </div>
          </div>

          <DialogFooter className="border-t-2 border-gray-200 pt-6">
            <Button
              variant="outline"
              onClick={() => setShowCreateUser(false)}
              disabled={loading.action}
              className="bg-white/80 border-2 border-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-slate-100 hover:border-gray-400 text-gray-700 hover:text-gray-800 backdrop-blur-sm rounded-2xl px-6 py-3 font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={createUser}
              disabled={loading.action}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-2xl shadow-emerald-200 rounded-2xl px-6 py-3 font-semibold hover:scale-105 transition-all duration-300"
            >
              {loading.action ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Bulk Promote Dialog */}
      <Dialog open={showExistingUsers} onOpenChange={setShowExistingUsers}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col bg-white/95 border-2 border-gray-200 backdrop-blur-xl shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4 text-gray-900 text-2xl font-bold">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-300 shadow-lg">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              Promote Users to {ROLE_CONFIG[roleToAssign as keyof typeof ROLE_CONFIG]?.label}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-lg font-medium">
              Select users to promote to the {ROLE_CONFIG[roleToAssign as keyof typeof ROLE_CONFIG]?.label} role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search users to promote..."
                value={promoteSearchQuery}
                onChange={(e) => {
                  setPromoteSearchQuery(e.target.value)
                  setPromoteCurrentPage(1)
                }}
                className="pl-14 bg-white/80 border-2 border-gray-300 focus:border-blue-400 text-gray-900 placeholder:text-gray-500 backdrop-blur-sm rounded-2xl h-12 text-lg font-medium"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 max-h-96 pr-2">
              {paginatedPromoteUsers.map((u) => (
                <div
                  key={u.uid}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                    selectedExistingUsers.has(u.uid)
                      ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 ring-4 ring-blue-100 shadow-2xl shadow-blue-100 scale-105"
                      : "bg-white/60 border-gray-300 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-102"
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
                        className="border-2 border-gray-400 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 rounded-lg w-5 h-5"
                      />
                      <Avatar className="h-12 w-12 ring-4 ring-white shadow-lg">
                        <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 font-bold text-lg">
                          {(u.displayName || u.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{u.displayName || u.email}</p>
                        <p className="text-sm text-gray-600 font-medium">{u.email}</p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-2 border-gray-300 font-semibold px-3 py-1.5">
                      {ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG]?.label || u.role}
                    </Badge>
                  </div>
                </div>
              ))}

              {hasMorePromoteUsers && (
                <Button
                  variant="outline"
                  onClick={() => setPromoteCurrentPage((p) => p + 1)}
                  className="w-full bg-white/80 border-2 border-gray-300 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:border-blue-300 text-gray-700 hover:text-blue-700 backdrop-blur-sm rounded-2xl py-3 font-semibold hover:scale-105 transition-all duration-300"
                >
                  Load More ({promoteUsers.length - promoteEnd} remaining)
                </Button>
              )}

              {!promoteUsers.length && (
                <div className="text-center py-16 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No users available for promotion</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t-2 border-gray-200 pt-6">
            <div className="flex items-center justify-between w-full">
              <p className="text-lg text-gray-600 font-medium">
                <span className="text-blue-600 font-bold">{selectedExistingUsers.size}</span> user(s) selected
              </p>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowExistingUsers(false)
                    setSelectedExistingUsers(new Set())
                    setPromoteSearchQuery("")
                    setPromoteCurrentPage(1)
                  }}
                  disabled={loading.action}
                  className="bg-white/80 border-2 border-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-slate-100 hover:border-gray-400 text-gray-700 hover:text-gray-800 backdrop-blur-sm rounded-2xl px-6 py-3 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={assignRoleToExistingUsers}
                  disabled={!selectedExistingUsers.size || loading.action}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-2xl shadow-purple-200 rounded-2xl px-6 py-3 font-semibold hover:scale-105 transition-all duration-300"
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
        <DialogContent className="sm:max-w-md bg-white/95 border-2 border-gray-200 backdrop-blur-xl shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4 text-red-600 text-2xl font-bold">
              <div className="p-3 rounded-2xl bg-red-500/10 border-2 border-red-300 shadow-lg">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-gray-600 space-y-3 text-lg">
              <p>
                Are you sure you want to delete <strong className="text-gray-900">{userToDelete?.email}</strong>?
              </p>
              <p className="text-red-600 font-bold">⚠️ This action cannot be undone.</p>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="border-t-2 border-gray-200 pt-6">
            <Button
              variant="outline"
              onClick={() => setUserToDelete(null)}
              className="bg-white/80 border-2 border-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-slate-100 hover:border-gray-400 text-gray-700 hover:text-gray-800 backdrop-blur-sm rounded-2xl px-6 py-3 font-semibold"
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
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-2xl shadow-red-200 rounded-2xl px-6 py-3 font-semibold hover:scale-105 transition-all duration-300"
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced User Details Dialog */}
      <Dialog open={!!showUserDetails} onOpenChange={() => setShowUserDetails(null)}>
        <DialogContent className="sm:max-w-md bg-white/95 border-2 border-gray-200 backdrop-blur-xl shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4 text-gray-900 text-2xl font-bold">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-300 shadow-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              User Details
            </DialogTitle>
          </DialogHeader>

          {showUserDetails && (
            <div className="space-y-8 py-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 ring-4 ring-white shadow-2xl">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${showUserDetails.displayName || showUserDetails.email}&backgroundColor=f1f5f9`}
                    />
                    <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700">
                      {(showUserDetails.displayName || showUserDetails.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 p-2 rounded-full bg-white border-4 border-gray-200 shadow-lg">
                    {showUserDetails.disabled ? (
                      <UserX className="w-5 h-5 text-red-500" />
                    ) : (
                      <UserCheck className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-2xl font-bold text-gray-900">
                    {showUserDetails.displayName || showUserDetails.email}
                  </h4>
                  <Badge
                    className={`${ROLE_CONFIG[showUserDetails.role as keyof typeof ROLE_CONFIG]?.badgeStyle || "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-200"} gap-2 px-4 py-2 text-lg font-semibold`}
                  >
                    {React.createElement(ROLE_CONFIG[showUserDetails.role as keyof typeof ROLE_CONFIG]?.icon || Users, {
                      className: "w-4 h-4",
                    })}
                    {ROLE_CONFIG[showUserDetails.role as keyof typeof ROLE_CONFIG]?.label || showUserDetails.role}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-gray-300" />

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Display Name</Label>
                    <p className="text-lg text-gray-900 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border-2 border-gray-200 font-medium">
                      {showUserDetails.displayName || "Not set"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email Status</Label>
                    <div className="flex items-center space-x-2">
                      {showUserDetails.emailVerified ? (
                        <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-200 gap-2 px-3 py-2 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-200 gap-2 px-3 py-2 font-semibold">
                          <XCircle className="w-4 h-4" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email Address</Label>
                  <p className="text-lg text-gray-900 font-mono bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border-2 border-gray-200 font-medium">
                    {showUserDetails.email}
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">User ID</Label>
                  <p className="text-sm text-gray-600 font-mono bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border-2 border-gray-200 break-all">
                    {showUserDetails.uid}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Member Since</Label>
                    <p className="text-lg text-gray-900 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border-2 border-gray-200 font-medium">
                      {formatDate(showUserDetails.createdAt)}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Last Active</Label>
                    <p className="text-lg text-gray-900 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border-2 border-gray-200 font-medium">
                      {formatDate(showUserDetails.lastSignIn)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Account Status</Label>
                  <div className="flex items-center space-x-2">
                    {showUserDetails.disabled ? (
                      <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-200 gap-2 px-4 py-2 font-semibold">
                        <UserX className="w-4 h-4" />
                        Disabled
                      </Badge>
                    ) : (
                      <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-200 gap-2 px-4 py-2 font-semibold">
                        <UserCheck className="w-4 h-4" />
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t-2 border-gray-200 pt-6">
            <Button
              onClick={() => setShowUserDetails(null)}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-2xl rounded-2xl py-3 font-semibold hover:scale-105 transition-all duration-300"
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