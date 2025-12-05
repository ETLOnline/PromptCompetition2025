"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Button,
} from "@/components/ui/button"
import {
  Input,
} from "@/components/ui/input"
import {
  Label,
} from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users,
  Shield,
  Scale,
  Crown,
  UserPlus,
  Search,
  ChevronDown,
  Eye,
  MoreHorizontal,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Filter,
  Zap,
  Trophy,
  Award,
  Target,
  X,
} from "lucide-react"
import { validateEmail } from "@/lib/utils"
import { useAuth } from "@clerk/nextjs"
import { fetchWithAuth } from "@/lib/api"

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
  participations?: {
    [competitionId: string]: {
      competitionName: string
      totalScore: number
      rank: number
    }
  }
  // Additional Firestore profile fields
  bio?: string
  category?: string
  city?: string
  province?: string
  institution?: string
  majors?: string
  gender?: string
  linkedin?: string
}

export interface Stats {
  total: number
  superadmins: number
  admins: number
  judges: number
  participants: number
  disabled: number
  active: number
}

export interface CreateUserForm {
  email: string
  displayName: string
  role: string
}

interface NotificationState {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
}

interface UsersResponse {
  users: User[]
  total: number
  hasNextPage: boolean
  nextOffset?: number
  currentOffset?: number
}

// --- Constants --------------------------------------------------------------
export const ROLE_CONFIG = {
  superadmin: {
    label: "Super Admin",
    pluralLabel: "Super Admins",
    icon: Crown,
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    badgeVariant: "default" as const,
  },
  admin: {
    label: "Admin",
    pluralLabel: "Admins",
    icon: Shield,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    badgeVariant: "secondary" as const,
  },
  judge: {
    label: "Judge",
    pluralLabel: "Judges",
    icon: Scale,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    badgeVariant: "outline" as const,
  },
  participant: {
    label: "Contestant",
    pluralLabel: "Contestants",
    icon: Users,
    color: "text-slate-700",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    badgeVariant: "outline" as const,
  },
}

const ITEMS_PER_PAGE = 12

// --- Helper Components ------------------------------------------------------
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
}) => (
  <Card
    className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
      selectedRole === role ? `ring-2 ring-blue-500 shadow-md` : "hover:shadow-md"
    }`}
    onClick={() => onSelectRole(role)}
  >
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold tracking-tight">{count.toLocaleString()}</p>
            {trend !== 0 && (
              <div className={`flex items-center text-xs ${trend > 0 ? "text-emerald-600" : "text-red-600"}`}>
                <TrendingUp className={`w-3 h-3 mr-1 ${trend < 0 ? "rotate-180" : ""}`} />
                {Math.abs(trend)}%
              </div>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
)

interface UserRowProps {
  user: User
  formatDate: (d?: string) => string
  getRoleActions: (u: User) => { label: string; action: () => void; color: string; icon: React.ComponentType<any> }[]
  onViewDetails: (u: User) => void
  onDelete: (uid: string, email: string) => void
}

const UserRow: React.FC<UserRowProps> = ({ user, formatDate, getRoleActions, onViewDetails, onDelete }) => {
  const cfg = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.participant
  const actions = getRoleActions(user)

  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell className="w-[250px]">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || user.email}`} />
            <AvatarFallback className={cfg.bgColor}>
              {(user.displayName || user.email).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <p className="font-medium leading-none">{user.displayName || user.email}</p>
              {user.emailVerified && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="w-[140px]">
        <Badge variant={cfg.badgeVariant} className="gap-1">
          <cfg.icon className="w-3 h-3" />
          {cfg.label}
        </Badge>
      </TableCell>
      <TableCell className="w-[160px] text-sm text-muted-foreground">
        {formatDate(user.createdAt)}
      </TableCell>
      <TableCell className="w-[160px] text-sm text-muted-foreground">
        {formatDate(user.lastSignIn)}
      </TableCell>
      <TableCell className="w-[100px]">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => onViewDetails(user)} className="h-8 w-8 p-0">
            <Eye className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {actions.map((action, i) => (
                <DropdownMenuItem key={i} onClick={action.action} className="gap-2">
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(user.uid, user.email)}
                className="gap-2 text-destructive focus:text-destructive"
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
    <div className="flex items-center justify-between px-6 py-4 border-t">
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalItems} users
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
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
                className="w-8 h-8 p-0"
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
  // --- Clerk Auth Hook ---
  const { getToken, isLoaded, isSignedIn } = useAuth()

  // --- State ---
  const [stats, setStats] = useState<Stats | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedRole, setSelectedRole] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  
  // Server pagination state
  const [serverPagination, setServerPagination] = useState({
    offset: 0,
    hasNextPage: false,
    totalUsers: 0,
    loading: false,
  })

  const [loading, setLoading] = useState({
    stats: true,
    users: true,
    action: false,
  })

  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showExistingUsers, setShowExistingUsers] = useState(false)
  const [createUserForm, setCreateUserForm] = useState<CreateUserForm>({
    email: "",
    displayName: "",
    role: "",
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    displayName?: string
    role?: string
  }>({})
  const [selectedExistingUsers, setSelectedExistingUsers] = useState<Set<string>>(new Set())
  const [roleToAssign, setRoleToAssign] = useState("")
  const [promoteSearchQuery, setPromoteSearchQuery] = useState("")
  const [promoteCurrentPage, setPromoteCurrentPage] = useState(1)
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
    await Promise.allSettled([fetchStats(), fetchAllUsers(true)])
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
      const roleOrder = { superadmin: 0, admin: 1, judge: 2, participant: 3 }
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

  const promoteStart = 0 // Always start from the beginning
  const promoteEnd = promoteCurrentPage * ITEMS_PER_PAGE
  const paginatedPromoteUsers = promoteUsers.slice(promoteStart, promoteEnd)
  const hasMorePromoteUsers = promoteUsers.length > promoteEnd

  const showNotification = useCallback((type: NotificationState["type"], title: string, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
        color: "text-green-600 hover:text-green-700",
        icon: Scale,
      })

    if (u.role !== "superadmin")
      actions.push({
        label: "Make Super Admin",
        action: () => updateRole(u.uid, "superadmin"),
        color: "text-purple-600 hover:text-purple-700",
        icon: Crown,
      })

    if (u.role !== "participant")
      actions.push({
        label: "Remove Role",
        action: () => updateRole(u.uid, "participant"),
        color: "text-gray-600 hover:text-gray-700",
        icon: Users,
      })

    return actions
  }

  // Validation helpers
  const validateField = (field: keyof CreateUserForm, value: string) => {
    const errors: { [key: string]: string } = {}
    
    switch (field) {
      case 'email':
        if (!value.trim()) {
          errors.email = "Email address is required"
        } else {
          const emailError = validateEmail(value)
          if (emailError) {
            errors.email = emailError
          }
        }
        break
      case 'displayName':
        if (!value.trim()) {
          errors.displayName = "Display name is required"
        } else if (value.trim().length < 2) {
          errors.displayName = "Display name must be at least 2 characters"
        }
        break
      case 'role':
        const allowedRoles = ["judge", "admin", "superadmin"]
        if (!value) {
          errors.role = "Role selection is required"
        } else if (!allowedRoles.includes(value)) {
          errors.role = "Please select a valid role"
        }
        break
    }
    
    setFieldErrors(prev => ({
      ...prev,
      [field]: errors[field] || undefined
    }))
    
    return !errors[field]
  }

  const validateAllFields = () => {
    const emailValid = validateField('email', createUserForm.email)
    const nameValid = validateField('displayName', createUserForm.displayName)
    const roleValid = validateField('role', createUserForm.role)
    
    return emailValid && nameValid && roleValid
  }

  const handleFieldChange = (field: keyof CreateUserForm, value: string) => {
    setCreateUserForm(prev => ({ ...prev, [field]: value }))
    // Clear any existing form error when user starts typing
    if (formError) setFormError(null)
    // Validate field after a brief delay to avoid excessive validation during typing
    setTimeout(() => validateField(field, value), 300)
  }

  // --- API calls ---
  async function fetchStats() {
    try {
      setLoading((p) => ({ ...p, stats: true }))
      const data = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/stats`,
        {},
        getToken
      )
      setStats(data)
    } catch (error: any) {
      console.error('Fetch stats error:', error)
      let errorMessage = "Failed to load user statistics"
      
      if (error.message) {
        errorMessage = error.message.replace(/^Error:\s*/, '')
      }
      
      showNotification("error", "Data Loading Error", errorMessage)
    } finally {
      setLoading((p) => ({ ...p, stats: false }))
    }
  }

  async function fetchAllUsers(isInitial = false) {
    try {
      const currentOffset = isInitial ? 0 : allUsers.length
      
      if (isInitial) {
        setLoading((p) => ({ ...p, users: true }))
        // Reset pagination state for initial load
        setServerPagination({
          offset: 0,
          hasNextPage: false,
          totalUsers: 0,
          loading: false,
        })
        setAllUsers([])
      }

      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/users`)
      url.searchParams.set('limit', '250')
      url.searchParams.set('offset', currentOffset.toString())

      console.log('Fetching URL:', url.toString(), 'with offset:', currentOffset)
      const data: UsersResponse = await fetchWithAuth(
        url.toString(),
        {},
        getToken
      )
      
      console.log('Received data:', {
        usersCount: data.users?.length,
        total: data.total,
        hasNextPage: data.hasNextPage,
        nextOffset: data.nextOffset,
        currentOffset: data.currentOffset
      })
        
      if (isInitial) {
        const newUsers = data.users || []
        setAllUsers(newUsers)
        
        const hasMore = newUsers.length < data.total
        setServerPagination({
          offset: newUsers.length,
          hasNextPage: hasMore,
          totalUsers: data.total,
          loading: false,
        })
      } else {
        // Append new users to existing ones, avoiding duplicates
        setAllUsers(prev => {
          const existingUids = new Set(prev.map(u => u.uid))
          const newUsers = (data.users || []).filter(u => !existingUids.has(u.uid))
          const updatedUsers = [...prev, ...newUsers]
          
          // If we received 0 new users or we've reached the total, no more pages
          const hasMore = newUsers.length > 0 && updatedUsers.length < data.total
          
          // console.log('Pagination update:', {
          //   previousCount: prev.length,
          //   newUsersReceived: data.users?.length,
          //   newUsersAdded: newUsers.length,
          //   totalNow: updatedUsers.length,
          //   expectedTotal: data.total,
          //   hasMore: hasMore,
          //   currentOffset: currentOffset
          // })
          
          // Update pagination state with the new count
          setServerPagination({
            offset: updatedUsers.length,
            hasNextPage: hasMore,
            totalUsers: data.total,
            loading: false,
          })
          
          return updatedUsers
        })
      }
    } catch (error: any) {
      console.error('Error fetching users:', error)
      let errorMessage = "Failed to load users"
      
      if (error.message) {
        errorMessage = error.message.replace(/^Error:\s*/, '')
      }
      
      showNotification("error", "Data Loading Error", errorMessage)
      setServerPagination(prev => ({ ...prev, loading: false }))
    } finally {
      if (isInitial) {
        setLoading((p) => ({ ...p, users: false }))
      }
    }
  }

  async function fetchMoreUsers() {
    if (serverPagination.loading || !serverPagination.hasNextPage) {
      console.log('fetchMoreUsers blocked:', { 
        loading: serverPagination.loading, 
        hasNextPage: serverPagination.hasNextPage 
      })
      return
    }
    
    console.log('fetchMoreUsers starting with offset:', serverPagination.offset)
    setServerPagination(prev => ({ ...prev, loading: true }))
    await fetchAllUsers(false)
  }

  async function updateRole(uid: string, newRole: string) {
    try {
      setLoading((p) => ({ ...p, action: true }))
      const data = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/assign-role`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, role: newRole }),
        },
        getToken
      )
      showNotification("success", "Role Updated", "User role updated successfully")
      // Update the user in local state
      setAllUsers(prev => prev.map(user => 
        user.uid === uid ? { ...user, role: newRole } : user
      ))
      fetchStats()
    } catch (error: any) {
      console.error('Role update error:', error)
      let errorMessage = "Failed to update role"
      
      if (error.message) {
        // Clean up error message - remove "Error: " prefix if present
        errorMessage = error.message.replace(/^Error:\s*/, '')
      }
      
      showNotification("error", "Update Failed", errorMessage)
    } finally {
      setLoading((p) => ({ ...p, action: false }))
    }
  }

  async function deleteUser(uid: string, email: string) {
    try {
      setLoading((p) => ({ ...p, action: true }))
      const data = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/delete-user`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid }),
        },
        getToken
      )
      showNotification("success", "User Deleted", "User deleted successfully")
      // Remove user from local state
      setAllUsers(prev => prev.filter(user => user.uid !== uid))
      fetchStats()
    } catch (error: any) {
      console.error('Delete user error:', error)
      let errorMessage = "Failed to delete user"
      
      if (error.message) {
        errorMessage = error.message.replace(/^Error:\s*/, '')
      }
      
      showNotification("error", "Delete Failed", errorMessage)
    } finally {
      setLoading((p) => ({ ...p, action: false }))
    }
  }

  async function createUser() {
    // Validate all fields first
    if (!validateAllFields()) {
      setFormError("Please fix the errors above before submitting")
      return
    }

    try {
      setLoading((p) => ({ ...p, action: true }))
      const data = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/create-user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createUserForm),
        },
        getToken
      )
      setFormError(null)
      setFieldErrors({})
      showNotification("success", "User Created", `${createUserForm.displayName} has been successfully created`)
      setCreateUserForm({ email: "", displayName: "", role: "" })
      setShowCreateUser(false)
      // Refresh data
      fetchAllUsers(true)
      fetchStats()
    } catch (error: any) {
      console.error('Create user error:', error)
      let errorMessage = "Failed to create user"
      
      if (error.message) {
        errorMessage = error.message.replace(/^Error:\s*/, '')
      }
      
      setFormError(errorMessage)
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
      const results = await Promise.all(
        Array.from(selectedExistingUsers).map((uid) =>
          fetchWithAuth(
            `${process.env.NEXT_PUBLIC_API_URL}/superadmin/assign-role`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ uid, role: roleToAssign }),
            },
            getToken
          ).then(() => ({ ok: true })).catch(() => ({ ok: false }))
        ),
      )

      if (results.every((r: { ok: boolean }) => r.ok)) {
        showNotification("success", "Roles Updated", `Roles updated for ${selectedExistingUsers.size} user(s)`)
        // Update users in local state
        setAllUsers(prev => prev.map(user => 
          selectedExistingUsers.has(user.uid) ? { ...user, role: roleToAssign } : user
        ))
        setSelectedExistingUsers(new Set())
        setShowExistingUsers(false)
        setPromoteSearchQuery("")
        setPromoteCurrentPage(1)
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

  // Render notification
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
        className={`flex items-start gap-3 p-4 rounded-lg border ${colors[notification.type]} shadow-lg backdrop-blur-sm`}
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
          className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  // Calculate role counts from loaded users
  const roleStats = useMemo(() => {
    const counts = { superadmin: 0, admin: 0, judge: 0, participant: 0 }
    allUsers.forEach(user => {
      if (counts.hasOwnProperty(user.role)) {
        counts[user.role as keyof typeof counts]++
      }
    })
    return counts
  }, [allUsers])

  // --- Loading and Auth Checks ---
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-600">Authenticating user access</p>
        </div>
      </div>
    )
  }

  // --- Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">{notifications.map(renderNotification)}</div>
      )}

      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage user accounts and permissions across your platform
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={() => setShowCreateUser(true)} className="gap-2">
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {loading.stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => (
              <StatsCard
                key={roleKey}
                title={config.pluralLabel}
                count={stats[`${roleKey}s` as keyof Stats] || 0}
                icon={config.icon}
                color={config.color}
                bgColor={config.bgColor}
                borderColor={config.borderColor}
                role={roleKey}
                selectedRole={selectedRole}
                onSelectRole={setSelectedRole}
              />
            ))}
          </div>
        ) : null}

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Filter className="w-4 h-4" />
                  <span>Filter by role:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedRole === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRole("all")}
                    className="gap-1"
                  >
                    All Users ({allUsers.length})
                  </Button>
                  {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => {
                    const count = roleStats[roleKey as keyof typeof roleStats]
                    return (
                      <Button
                        key={roleKey}
                        variant={selectedRole === roleKey ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedRole(roleKey)}
                        className="gap-1"
                      >
                        <config.icon className="w-3 h-3" />
                        {config.label}
                      </Button>
                    )
                  })}
                </div>
              </div>
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  Users ({filteredUsers.length})
                  {selectedRole === "all" && !searchQuery && serverPagination.totalUsers > 0 && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      of {serverPagination.totalUsers} total
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedRole !== "all" &&
                    `Filtered by ${ROLE_CONFIG[selectedRole as keyof typeof ROLE_CONFIG]?.label}`}
                </CardDescription>
              </div>
              {selectedRole !== "all" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setRoleToAssign(selectedRole)
                    setShowExistingUsers(true)
                  }}
                  className="gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Bulk Promote
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Load More Section - Show at top for better UX */}
            {selectedRole === "all" && !searchQuery && serverPagination.hasNextPage && !loading.users && (
              <div className="flex flex-col items-center gap-3 py-6 px-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    {allUsers.length} of {serverPagination.totalUsers} users loaded
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {serverPagination.totalUsers - allUsers.length} more users available
                  </p>
                </div>
                <Button
                  onClick={fetchMoreUsers}
                  disabled={serverPagination.loading}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  {serverPagination.loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Load More Users
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {/* Search with Load All Option */}
            {searchQuery && serverPagination.hasNextPage && !loading.users && (
              <div className="flex flex-col items-center gap-3 py-4 px-6 bg-amber-50 border-b border-amber-200">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="w-4 h-4" />
                  <p className="text-sm font-medium">
                    Searching in {allUsers.length} of {serverPagination.totalUsers} users
                  </p>
                </div>
                <Button
                  onClick={fetchMoreUsers}
                  disabled={serverPagination.loading}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-amber-300 hover:bg-amber-100"
                >
                  {serverPagination.loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Load More Users to Search
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {loading.users ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin mx-auto" />
                  <p className="text-muted-foreground">Loading users...</p>
                </div>
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">No users found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? "Try adjusting your search criteria" : "No users match the selected filters"}
                    </p>
                  </div>
                  {searchQuery && (
                    <Button variant="outline" onClick={() => setSearchQuery("")}>
                      Clear search
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">User</TableHead>
                      <TableHead className="w-[140px]">Role</TableHead>
                      <TableHead className="w-[160px]">Joined</TableHead>
                      <TableHead className="w-[160px]">Last Active</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
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
            {selectedRole === "all" && !searchQuery && serverPagination.hasNextPage && (
              <div className="flex justify-center py-4 border-t">
                <Button
                  onClick={fetchMoreUsers}
                  disabled={serverPagination.loading}
                  variant="outline"
                  className="gap-2"
                >
                  {serverPagination.loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading more users...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Load More Users ({allUsers.length} of {serverPagination.totalUsers})
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Create New User
            </DialogTitle>
            <DialogDescription>
              Add a new user with specified role and send them a secure link to set their password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={createUserForm.role}
                onValueChange={(value) => handleFieldChange('role', value)}
              >
                <SelectTrigger className={fieldErrors.role ? "border-red-500 focus:ring-red-500" : ""}>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="judge">Judge</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.role && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {fieldErrors.role}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                placeholder="Enter full name"
                value={createUserForm.displayName}
                onChange={(e) => handleFieldChange('displayName', e.target.value)}
                className={fieldErrors.displayName ? "border-red-500 focus:ring-red-500" : ""}
              />
              {fieldErrors.displayName && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {fieldErrors.displayName}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={createUserForm.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className={fieldErrors.email ? "border-red-500 focus:ring-red-500" : ""}
              />
              {fieldErrors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {fieldErrors.email}
                </p>
              )}
            </div>
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {formError}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCreateUserForm({
                  email: "",
                  displayName: "",
                  role: ""
                })
                setFormError(null)
                setFieldErrors({})
                setShowCreateUser(false)
              }}
              disabled={loading.action}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={createUser}
              disabled={loading.action}
              className="w-full sm:w-auto"
            >
              {loading.action ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Promote Dialog */}
      <Dialog open={showExistingUsers} onOpenChange={setShowExistingUsers}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Promote Users to {ROLE_CONFIG[roleToAssign as keyof typeof ROLE_CONFIG]?.label}
            </DialogTitle>
            <DialogDescription>
              Select users to promote to the {ROLE_CONFIG[roleToAssign as keyof typeof ROLE_CONFIG]?.label} role.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 flex-1 min-h-0">
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users to promote..."
                value={promoteSearchQuery}
                onChange={(e) => {
                  setPromoteSearchQuery(e.target.value)
                  setPromoteCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 max-h-96">
              <div className="space-y-2 pr-2">
                {paginatedPromoteUsers.map((u) => (
                  <div
                    key={u.uid}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedExistingUsers.has(u.uid)
                        ? "bg-blue-50 border-blue-200 ring-2 ring-blue-100"
                        : "bg-background border-border hover:border-muted-foreground"
                    }`}
                    onClick={() => {
                      const s = new Set(selectedExistingUsers)
                      s.has(u.uid) ? s.delete(u.uid) : s.add(u.uid)
                      setSelectedExistingUsers(s)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox checked={selectedExistingUsers.has(u.uid)} onChange={() => {}} />
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{(u.displayName || u.email).charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{u.displayName || u.email}</p>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG]?.label || u.role}</Badge>
                    </div>
                  </div>
                ))}
                {hasMorePromoteUsers && (
                  <Button variant="outline" onClick={() => setPromoteCurrentPage((p) => p + 1)} className="w-full">
                    Load More ({promoteUsers.length - promoteEnd} remaining)
                  </Button>
                )}
                {!promoteUsers.length && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No users available for promotion</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-muted-foreground">{selectedExistingUsers.size} user(s) selected</p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowExistingUsers(false)
                    setSelectedExistingUsers(new Set())
                    setPromoteSearchQuery("")
                    setPromoteCurrentPage(1)
                  }}
                  disabled={loading.action}
                >
                  Cancel
                </Button>
                <Button onClick={assignRoleToExistingUsers} disabled={!selectedExistingUsers.size || loading.action}>
                  {loading.action ? "Promoting..." : "Promote Users"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent className="sm:max-w-[380px] p-5">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="p-2.5 rounded-full bg-red-100 text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">Confirm Deletion</DialogTitle>
            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to delete <strong>{userToDelete?.email}</strong>?
              <br />
              <span className="text-red-600 text-sm font-medium">This action cannot be undone.</span>
            </p>
          </DialogHeader>
          <DialogFooter className="flex gap-3 pt-3">
            <Button 
              variant="outline" 
              onClick={() => setUserToDelete(null)}
              className="flex-1 text-sm"
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
              className="flex-1 bg-red-600 hover:bg-red-700 text-sm"
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={!!showUserDetails} onOpenChange={() => setShowUserDetails(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              User Details
            </DialogTitle>
          </DialogHeader>
          {showUserDetails && (
            <div className="space-y-6 py-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${showUserDetails.displayName || showUserDetails.email}`}
                  />
                  <AvatarFallback className="text-lg">
                    {(showUserDetails.displayName || showUserDetails.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold">{showUserDetails.displayName || showUserDetails.email}</h4>
                  <Badge variant={ROLE_CONFIG[showUserDetails.role as keyof typeof ROLE_CONFIG]?.badgeVariant}>
                    {ROLE_CONFIG[showUserDetails.role as keyof typeof ROLE_CONFIG]?.label || showUserDetails.role}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Display Name
                    </Label>
                    <p className="text-sm mt-1">{showUserDetails.displayName || "Not set"}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Email Status
                    </Label>
                    <div className="flex items-center space-x-2 mt-1">
                      {showUserDetails.emailVerified ? (
                        <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-red-600 border-red-200">
                          <XCircle className="w-3 h-3" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Email Address
                  </Label>
                  <p className="text-sm mt-1 font-mono">{showUserDetails.email}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">User ID</Label>
                  <p className="text-sm mt-1 font-mono text-muted-foreground">{showUserDetails.uid}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Member Since
                    </Label>
                    <p className="text-sm mt-1">{formatDate(showUserDetails.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Last Active
                    </Label>
                    <p className="text-sm mt-1">{formatDate(showUserDetails.lastSignIn)}</p>
                  </div>
                </div>
                
                {/* Additional Profile Information */}
                {(showUserDetails.category || showUserDetails.institution || showUserDetails.city) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      {showUserDetails.category && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Category
                          </Label>
                          <p className="text-sm mt-1">{showUserDetails.category}</p>
                        </div>
                      )}
                      {showUserDetails.gender && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Gender
                          </Label>
                          <p className="text-sm mt-1 capitalize">{showUserDetails.gender}</p>
                        </div>
                      )}
                    </div>
                    {showUserDetails.institution && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Institution
                        </Label>
                        <p className="text-sm mt-1">{showUserDetails.institution}</p>
                      </div>
                    )}
                    {showUserDetails.majors && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Major
                        </Label>
                        <p className="text-sm mt-1">{showUserDetails.majors}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {showUserDetails.city && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            City
                          </Label>
                          <p className="text-sm mt-1">{showUserDetails.city}</p>
                        </div>
                      )}
                      {showUserDetails.province && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Province
                          </Label>
                          <p className="text-sm mt-1">{showUserDetails.province}</p>
                        </div>
                      )}
                    </div>
                    {showUserDetails.linkedin && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          LinkedIn
                        </Label>
                        <a 
                          href={showUserDetails.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm mt-1 text-blue-600 hover:underline block"
                        >
                          {showUserDetails.linkedin}
                        </a>
                      </div>
                    )}
                    {showUserDetails.bio && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Bio
                        </Label>
                        <p className="text-sm mt-1">{showUserDetails.bio}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Competition Participations Section */}
              {showUserDetails.participations && Object.keys(showUserDetails.participations).length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-600" />
                      <Label className="text-sm font-medium text-gray-900">Competition Participations</Label>
                    </div>
                    <div className="grid gap-3">
                      {Object.entries(showUserDetails.participations).map(([competitionId, participation]) => (
                        <div key={competitionId} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900 truncate pr-2">
                              {participation.competitionName}
                            </h5>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant="outline" className="gap-1">
                                <Award className="w-3 h-3" />
                                Rank #{participation.rank}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              <span>Score: {participation.totalScore.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowUserDetails(null)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


