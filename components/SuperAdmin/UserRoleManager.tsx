"use client"

import { useEffect, useState } from "react"
import { Search, Users, UserPlus, Shield, Gavel, Trash2, Eye, EyeOff, AlertTriangle, CheckCircle2, XCircle, Crown, Settings } from "lucide-react"

interface User {
  uid: string
  email: string
  displayName: string
  role: string
  createdAt?: string
  lastSignIn?: string
  emailVerified?: boolean
  disabled?: boolean
}

interface Stats {
  total: number
  superadmins: number
  admins: number
  judges: number
  users: number
  disabled: number
  active: number
}

interface CreateJudgeForm {
  email: string
  password: string
  displayName: string
}

const ROLE_CONFIG = {
  superadmin: { 
    label: "Super Admin", 
    icon: Crown, 
    color: "text-purple-400", 
    bgColor: "bg-purple-500/10 border-purple-500/20",
    buttonColor: "bg-purple-600 hover:bg-purple-700"
  },
  admin: { 
    label: "Admin", 
    icon: Shield, 
    color: "text-blue-400", 
    bgColor: "bg-blue-500/10 border-blue-500/20",
    buttonColor: "bg-blue-600 hover:bg-blue-700"
  },
  judge: { 
    label: "Judge", 
    icon: Gavel, 
    color: "text-green-400", 
    bgColor: "bg-green-500/10 border-green-500/20",
    buttonColor: "bg-green-600 hover:bg-green-700"
  },
  user: { 
    label: "User", 
    icon: Users, 
    color: "text-gray-400", 
    bgColor: "bg-gray-500/10 border-gray-500/20",
    buttonColor: "bg-gray-600 hover:bg-gray-700"
  }
}

export default function UserRoleManager() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [fetchedUser, setFetchedUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [showCreateJudge, setShowCreateJudge] = useState(false)
  const [createJudgeForm, setCreateJudgeForm] = useState<CreateJudgeForm>({
    email: "",
    password: "",
    displayName: ""
  })
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "warning"
    message: string
  } | null>(null)

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [])

  const showNotification = (type: "success" | "error" | "warning", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const fetchStats = async () => {
    try {
      const token = await getIdToken()
      const res = await fetch("http://localhost:8080/superadmin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error("Error fetching stats", err)
    }
  }

  const fetchUsers = async (role: string = "all") => {
    try {
      setLoading(true)
      const token = await getIdToken()
      const url = role === "all" 
        ? "http://localhost:8080/superadmin/users"
        : `http://localhost:8080/superadmin/users?role=${role}`
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
      }
    } catch (err) {
      console.error("Error loading users", err)
      showNotification("error", "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserByEmail = async () => {
    if (!searchQuery.trim()) return
    
    try {
      setSearching(true)
      const token = await getIdToken()
      const res = await fetch(
        `http://localhost:8080/superadmin/user-by-email?q=${encodeURIComponent(searchQuery)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (res.ok) {
        const user = await res.json()
        setFetchedUser(user)
      } else {
        setFetchedUser(null)
        showNotification("warning", "User not found")
      }
    } catch (err) {
      console.error("Search failed", err)
      setFetchedUser(null)
      showNotification("error", "Search failed")
    } finally {
      setSearching(false)
    }
  }

  const updateRole = async (uid: string, newRole: string) => {
    try {
      const token = await getIdToken()
      const res = await fetch("http://localhost:8080/superadmin/assign-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ uid, role: newRole })
      })

      const data = await res.json()
      
      if (res.ok) {
        showNotification("success", data.message)
        fetchUsers(activeTab)
        fetchStats()
        if (fetchedUser?.uid === uid) {
          setFetchedUser({ ...fetchedUser, role: newRole })
        }
      } else {
        showNotification("error", data.error)
      }
    } catch (err) {
      showNotification("error", "Failed to update role")
    }
  }

  const deleteUser = async (uid: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user: ${email}? This action cannot be undone.`)) {
      return
    }

    try {
      const token = await getIdToken()
      const res = await fetch("http://localhost:8080/superadmin/delete-user", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ uid })
      })

      const data = await res.json()
      
      if (res.ok) {
        showNotification("success", data.message)
        fetchUsers(activeTab)
        fetchStats()
        if (fetchedUser?.uid === uid) {
          setFetchedUser(null)
          setSearchQuery("")
        }
      } else {
        showNotification("error", data.error)
      }
    } catch (err) {
      showNotification("error", "Failed to delete user")
    }
  }

  const createJudge = async () => {
    if (!createJudgeForm.email || !createJudgeForm.password) {
      showNotification("warning", "Email and password are required")
      return
    }

    try {
      const token = await getIdToken()
      const res = await fetch("http://localhost:8080/superadmin/create-judge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(createJudgeForm)
      })

      const data = await res.json()
      
      if (res.ok) {
        showNotification("success", data.message)
        setCreateJudgeForm({ email: "", password: "", displayName: "" })
        setShowCreateJudge(false)
        fetchUsers(activeTab)
        fetchStats()
      } else {
        showNotification("error", data.error)
      }
    } catch (err) {
      showNotification("error", "Failed to create judge")
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    fetchUsers(tab)
  }

  const getRoleIcon = (role: string) => {
    const config = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.user
    const IconComponent = config.icon
    return <IconComponent className={`w-4 h-4 ${config.color}`} />
  }

  const getRoleButtons = (user: User) => {
    const buttons = []
    
    if (user.role !== "admin") {
      buttons.push(
        <button
          key="admin"
          onClick={() => updateRole(user.uid, "admin")}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
        >
          Make Admin
        </button>
      )
    }
    
    if (user.role !== "judge") {
      buttons.push(
        <button
          key="judge"
          onClick={() => updateRole(user.uid, "judge")}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
        >
          Make Judge
        </button>
      )
    }
    
    if (user.role !== "superadmin") {
      buttons.push(
        <button
          key="superadmin"
          onClick={() => updateRole(user.uid, "superadmin")}
          className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
        >
          Make Super Admin
        </button>
      )
    }
    
    if (user.role !== "user") {
      buttons.push(
        <button
          key="user"
          onClick={() => updateRole(user.uid, "user")}
          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
        >
          Remove Role
        </button>
      )
    }

    buttons.push(
      <button
        key="delete"
        onClick={() => deleteUser(user.uid, user.email)}
        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
      >
        <Trash2 className="w-3 h-3" />
        Delete
      </button>
    )

    return buttons
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-8">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${
          notification.type === "success" 
            ? "bg-green-900 border-green-500 text-green-100" 
            : notification.type === "error"
            ? "bg-red-900 border-red-500 text-red-100"
            : "bg-yellow-900 border-yellow-500 text-yellow-100"
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === "success" && <CheckCircle2 className="w-5 h-5" />}
            {notification.type === "error" && <XCircle className="w-5 h-5" />}
            {notification.type === "warning" && <AlertTriangle className="w-5 h-5" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#121244] rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-purple-400" />
              <span className="text-purple-400 font-semibold">Super Admins</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.superadmins}</p>
          </div>
          <div className="bg-[#121244] rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-semibold">Admins</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.admins}</p>
          </div>
          <div className="bg-[#121244] rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Gavel className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold">Judges</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.judges}</p>
          </div>
          <div className="bg-[#121244] rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="text-gray-400 font-semibold">Total Users</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
        </div>
      )}

      {/* Search and Create Judge */}
      <div className="bg-[#121244] rounded-lg p-6 border border-white/10">
        <h2 className="text-xl text-[#56ffbc] font-semibold mb-4 flex items-center gap-2">
          <Search className="w-5 h-5" />
          User Management
        </h2>
        
        <div className="space-y-4">
          {/* Search User */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search user by email..."
                className="pl-10 pr-4 py-2 rounded-md bg-[#1c1c3a] text-white w-full border border-white/10 focus:border-[#56ffbc] focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && fetchUserByEmail()}
              />
            </div>
            <button
              onClick={fetchUserByEmail}
              disabled={searching}
              className="bg-[#56ffbc] text-[#07073a] font-semibold px-6 py-2 rounded hover:bg-[#3cf0a3] transition-colors disabled:opacity-50"
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Create Judge Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateJudge(true)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Create New Judge
            </button>
          </div>

          {/* Search Result */}
          {fetchedUser && (
            <div className="bg-[#1c1c3a] rounded-lg p-4 border border-white/10">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(fetchedUser.role)}
                    <span className="text-white font-semibold">
                      {fetchedUser.displayName || fetchedUser.email}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      ROLE_CONFIG[fetchedUser.role as keyof typeof ROLE_CONFIG]?.bgColor || ROLE_CONFIG.user.bgColor
                    }`}>
                      {ROLE_CONFIG[fetchedUser.role as keyof typeof ROLE_CONFIG]?.label || "User"}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{fetchedUser.email}</p>
                  <p className="text-gray-500 text-xs">UID: {fetchedUser.uid}</p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>Created: {formatDate(fetchedUser.createdAt)}</span>
                    <span>Last Sign In: {formatDate(fetchedUser.lastSignIn)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getRoleButtons(fetchedUser)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Judge Modal */}
      {showCreateJudge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#121244] rounded-lg p-6 border border-white/10 w-full max-w-md">
            <h3 className="text-xl text-[#56ffbc] font-semibold mb-4">Create New Judge</h3>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email address"
                className="w-full px-4 py-2 rounded-md bg-[#1c1c3a] text-white border border-white/10 focus:border-[#56ffbc] focus:outline-none"
                value={createJudgeForm.email}
                onChange={(e) => setCreateJudgeForm({ ...createJudgeForm, email: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                className="w-full px-4 py-2 rounded-md bg-[#1c1c3a] text-white border border-white/10 focus:border-[#56ffbc] focus:outline-none"
                value={createJudgeForm.password}
                onChange={(e) => setCreateJudgeForm({ ...createJudgeForm, password: e.target.value })}
              />
              <input
                type="text"
                placeholder="Display Name (optional)"
                className="w-full px-4 py-2 rounded-md bg-[#1c1c3a] text-white border border-white/10 focus:border-[#56ffbc] focus:outline-none"
                value={createJudgeForm.displayName}
                onChange={(e) => setCreateJudgeForm({ ...createJudgeForm, displayName: e.target.value })}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateJudge(false)}
                className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createJudge}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
              >
                Create Judge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User List with Tabs */}
      <div className="bg-[#121244] rounded-lg border border-white/10">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl text-[#56ffbc] font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            All Users Management
          </h2>
          
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-4">
            {[
              { key: "all", label: "All Users", icon: Users },
              { key: "superadmin", label: "Super Admins", icon: Crown },
              { key: "admin", label: "Admins", icon: Shield },
              { key: "judge", label: "Judges", icon: Gavel },
              { key: "user", label: "Regular Users", icon: Users }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === key
                    ? "bg-[#56ffbc] text-[#07073a] font-semibold"
                    : "bg-[#1c1c3a] text-gray-300 hover:text-white hover:bg-[#2a2a4a]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#56ffbc] mx-auto"></div>
              <p className="text-white mt-2">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.uid}
                  className={`rounded-lg p-5 border transition-all hover:border-white/20 ${
                    user.disabled 
                      ? "bg-red-900/20 border-red-500/20" 
                      : "bg-[#1c1c3a] border-white/10"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        {getRoleIcon(user.role)}
                        <span className="text-white font-semibold text-lg">
                          {user.displayName || user.email}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG]?.bgColor || ROLE_CONFIG.user.bgColor
                        }`}>
                          {ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG]?.label || "User"}
                        </span>
                        {user.disabled && (
                          <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-xs text-red-300 flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            Disabled
                          </span>
                        )}
                        {user.emailVerified && (
                          <span className="px-2 py-1 bg-green-500/20 border border-green-500/50 rounded text-xs text-green-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-400">{user.email}</p>
                      <p className="text-gray-500 text-sm font-mono">UID: {user.uid}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mt-3">
                        <div>
                          <span className="text-gray-400">Created:</span>
                          <br />
                          <span>{formatDate(user.createdAt)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Last Sign In:</span>
                          <br />
                          <span>{formatDate(user.lastSignIn)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 ml-4">
                      {getRoleButtons(user)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

async function getIdToken(): Promise<string> {
  const { getAuth } = await import("firebase/auth")
  const user = getAuth().currentUser
  if (!user) throw new Error("No user signed in")
  return await user.getIdToken()
}