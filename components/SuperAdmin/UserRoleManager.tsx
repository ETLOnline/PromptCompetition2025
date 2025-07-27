// components/SuperAdmin/UserRoleManager.tsx

"use client"

import React, { useEffect, useState, useMemo } from "react"
import { StatsCard } from "./StatsCard"
import { SearchSection } from "./SearchSection"
import { UserList } from "./UserList"
import { CreateUserModal } from "./CreateUserModal"
import { PromoteUsersModal } from "./PromoteUsersModal"
import { UserDetailsModal } from "./UserDetailsModal"
import { Stats, User, CreateUserForm } from "./types"
import { ROLE_CONFIG } from "./constants"
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react"

// Pull your API base out of .env.local
const API = process.env.NEXT_PUBLIC_API_URL || ""
const ITEMS_PER_PAGE = 10

export default function UserRoleManager() {
  // --- State ---
  const [stats, setStats] = useState<Stats | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedRole, setSelectedRole] = useState<keyof typeof ROLE_CONFIG | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState({ stats: true, users: true, exactSearch: false })

  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showExistingUsers, setShowExistingUsers] = useState(false)
  const [createUserForm, setCreateUserForm] = useState<CreateUserForm>({
    email: "",
    password: "",
    displayName: "",
    role: "user",
  })
  const [selectedExistingUsers, setSelectedExistingUsers] = useState<Set<string>>(new Set())
  const [roleToAssign, setRoleToAssign] = useState<keyof typeof ROLE_CONFIG>("user")

  const [promoteSearchQuery, setPromoteSearchQuery] = useState("")
  const [promoteCurrentPage, setPromoteCurrentPage] = useState(1)

  const [exactSearchResults, setExactSearchResults] = useState<User[]>([])
  const [hasPerformedExactSearch, setHasPerformedExactSearch] = useState(false)

  const [notification, setNotification] = useState<{
    type: "success" | "error" | "warning"
    message: string
  } | null>(null)

  const [showUserDetails, setShowUserDetails] = useState<User | null>(null)

  // --- Effects ---
  useEffect(() => {
    fetchStats()
    fetchAllUsers()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    setSearchQuery("")
    setExactSearchResults([])
    setHasPerformedExactSearch(false)
  }, [selectedRole])

  // --- Derived Data ---
  const filteredUsers = useMemo(() => {
    let users = allUsers
    if (selectedRole !== "all") {
      users = users.filter((u) => u.role === selectedRole)
    }
    if (searchQuery.trim() && selectedRole !== "all") {
      const q = searchQuery.toLowerCase()
      users = users.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.displayName && u.displayName.toLowerCase().includes(q))
      )
    }
    return users
  }, [allUsers, selectedRole, searchQuery])

  const displayUsers =
    selectedRole === "all" && hasPerformedExactSearch ? exactSearchResults : filteredUsers
  const totalPages = Math.ceil(displayUsers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedUsers = displayUsers.slice(startIndex, endIndex)

  const promoteUsers = useMemo(() => {
    let users = allUsers.filter((u) => u.role !== roleToAssign)
    if (promoteSearchQuery.trim()) {
      const q = promoteSearchQuery.toLowerCase()
      users = users.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.displayName && u.displayName.toLowerCase().includes(q))
      )
    }
    return users
  }, [allUsers, roleToAssign, promoteSearchQuery])

  const promoteStartIndex = (promoteCurrentPage - 1) * ITEMS_PER_PAGE
  const promoteEndIndex = promoteStartIndex + ITEMS_PER_PAGE
  const paginatedPromoteUsers = promoteUsers.slice(promoteStartIndex, promoteEndIndex)
  const hasMorePromoteUsers = promoteUsers.length > promoteEndIndex

  // --- Helpers ---
  const showNotification = (type: "success" | "error" | "warning", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4000)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getRoleActions = (user: User) => {
    const actions: { label: string; action: () => void; color: string }[] = []
    if (user.role !== "admin") {
      actions.push({
        label: "Make Admin",
        action: () => updateRole(user.uid, "admin"),
        color: "text-blue-400 hover:text-blue-300",
      })
    }
    if (user.role !== "judge") {
      actions.push({
        label: "Make Judge",
        action: () => updateRole(user.uid, "judge"),
        color: "text-green-400 hover:text-green-300",
      })
    }
    if (user.role !== "superadmin") {
      actions.push({
        label: "Make Super Admin",
        action: () => updateRole(user.uid, "superadmin"),
        color: "text-purple-400 hover:text-purple-300",
      })
    }
    if (user.role !== "user") {
      actions.push({
        label: "Remove Role",
        action: () => updateRole(user.uid, "user"),
        color: "text-gray-400 hover:text-gray-300",
      })
    }
    return actions
  }

  // --- API Calls ---
  async function fetchStats() {
    try {
      setLoading((p) => ({ ...p, stats: true }))
      const token = await getIdToken()
      const res = await fetch(`${API}/superadmin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setStats(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading((p) => ({ ...p, stats: false }))
    }
  }

  async function fetchAllUsers() {
    try {
      setLoading((p) => ({ ...p, users: true }))
      const token = await getIdToken()
      const res = await fetch(`${API}/superadmin/users?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAllUsers(data.users || [])
      } else {
        showNotification("error", "Failed to load users")
      }
    } catch {
      showNotification("error", "Failed to load users")
    } finally {
      setLoading((p) => ({ ...p, users: false }))
    }
  }

  async function performExactSearch() {
    if (!searchQuery.trim()) {
      setExactSearchResults([])
      setHasPerformedExactSearch(false)
      return
    }
    try {
      setLoading((p) => ({ ...p, exactSearch: true }))
      const token = await getIdToken()
      const res = await fetch(
        `${API}/superadmin/user-by-email?q=${encodeURIComponent(searchQuery)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.ok) {
        const u = await res.json()
        setExactSearchResults([u])
        showNotification("success", "User found")
      } else {
        setExactSearchResults([])
        showNotification("warning", "User not found")
      }
      setHasPerformedExactSearch(true)
      setCurrentPage(1)
    } catch {
      setExactSearchResults([])
      setHasPerformedExactSearch(true)
      showNotification("error", "Search failed")
    } finally {
      setLoading((p) => ({ ...p, exactSearch: false }))
    }
  }

  function clearSearch() {
    setSearchQuery("")
    setExactSearchResults([])
    setHasPerformedExactSearch(false)
    setCurrentPage(1)
  }

  async function updateRole(uid: string, newRole: keyof typeof ROLE_CONFIG) {
    try {
      const token = await getIdToken()
      const res = await fetch(`${API}/superadmin/assign-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid, role: newRole }),
      })
      const data = await res.json()
      if (res.ok) {
        showNotification("success", "Role updated successfully")
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification("error", data.error)
      }
    } catch {
      showNotification("error", "Failed to update role")
    }
  }

  async function deleteUser(uid: string, email: string) {
    if (!confirm(`Delete user: ${email}?\n\nThis action cannot be undone.`)) return
    try {
      const token = await getIdToken()
      const res = await fetch(`${API}/superadmin/delete-user`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid }),
      })
      const data = await res.json()
      if (res.ok) {
        showNotification("success", "User deleted successfully")
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification("error", data.error)
      }
    } catch {
      showNotification("error", "Failed to delete user")
    }
  }

  async function createUser() {
    if (!createUserForm.email || !createUserForm.password) {
      showNotification("warning", "Email and password are required")
      return
    }
    try {
      const token = await getIdToken()
      const res = await fetch(`${API}/superadmin/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(createUserForm),
      })
      const data = await res.json()
      if (res.ok) {
        showNotification(
          "success",
          `${ROLE_CONFIG[createUserForm.role].label} created successfully`
        )
        setCreateUserForm({ email: "", password: "", displayName: "", role: "user" })
        setShowCreateUser(false)
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification("error", data.error)
      }
    } catch {
      showNotification("error", "Failed to create user")
    }
  }

  async function assignRoleToExistingUsers() {
    if (selectedExistingUsers.size === 0) {
      showNotification("warning", "Please select at least one user")
      return
    }
    try {
      const token = await getIdToken()
      const results = await Promise.all(
        Array.from(selectedExistingUsers).map((uid) =>
          fetch(`${API}/superadmin/assign-role`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ uid, role: roleToAssign }),
          })
        )
      )
      if (results.every((r) => r.ok)) {
        showNotification("success", `Roles updated for ${selectedExistingUsers.size} user(s)`)
        setSelectedExistingUsers(new Set())
        setShowExistingUsers(false)
        setPromoteSearchQuery("")
        setPromoteCurrentPage(1)
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification("error", "Some role updates failed")
      }
    } catch {
      showNotification("error", "Failed to update roles")
    }
  }

  // --- Render ---
  return (
    <div className="space-y-4">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg border text-sm ${
            notification.type === "success"
              ? "bg-green-900 border-green-500 text-green-100"
              : notification.type === "error"
              ? "bg-red-900 border-red-500 text-red-100"
              : "bg-yellow-900 border-yellow-500 text-yellow-100"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" && <CheckCircle2 className="w-4 h-4" />}
            {notification.type === "error" && <XCircle className="w-4 h-4" />}
            {notification.type === "warning" && <AlertTriangle className="w-4 h-4" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard
            title="Total Users"
            count={stats.total}
            icon={ROLE_CONFIG.user.icon}
            color={ROLE_CONFIG.user.color}
            bgColor="bg-gray-500/10"
            borderColor="border-white/10"
            selected={selectedRole === "all"}
            onSelect={() => setSelectedRole("all")}
          />
          {Object.entries(ROLE_CONFIG).filter(([roleKey]) => roleKey !== "user").
          map(([roleKey, cfg]) => (
            <StatsCard
              key={roleKey}
              title={cfg.pluralLabel}
              count={(stats as any)[roleKey + "s"]}
              icon={cfg.icon}
              color={cfg.color}
              bgColor={cfg.bgColor}
              borderColor="border-white/10"
              selected={selectedRole === roleKey}
              onSelect={() => setSelectedRole(roleKey as any)}
            />
          ))}
        </div>
      )}

      {/* Main Content */}
      {selectedRole === "all" ? (
        <SearchSection
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          performExactSearch={performExactSearch}
          clearSearch={clearSearch}
          loading={loading.exactSearch}
          hasSearched={hasPerformedExactSearch}
          results={exactSearchResults}
          onShowCreate={() => setShowCreateUser(true)}
          onViewDetails={setShowUserDetails}
          getActions={getRoleActions}
          onDelete={deleteUser}
          formatDate={formatDate}
        />
      ) : (
        <UserList
          selectedRole={selectedRole}
          roleCount={displayUsers.length}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onShowPromote={(r) => {
            setRoleToAssign(r as any)
            setShowExistingUsers(true)
          }}
          users={displayUsers}
          paginated={paginatedUsers}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          startIndex={startIndex}
          endIndex={endIndex}
          getActions={getRoleActions}
          onViewDetails={setShowUserDetails}
          onDelete={deleteUser}
          formatDate={formatDate}
        />
      )}

      {/* Modals */}
      {showCreateUser && (
        <CreateUserModal
          form={createUserForm}
          onChange={setCreateUserForm}
          onCancel={() => setShowCreateUser(false)}
          onCreate={createUser}
        />
      )}

      {showExistingUsers && (
        <PromoteUsersModal
          role={roleToAssign}
          users={promoteUsers}
          paginated={paginatedPromoteUsers}
          hasMore={hasMorePromoteUsers}
          selected={selectedExistingUsers}
          onToggleSelect={(uid) => {
            const s = new Set(selectedExistingUsers)
            s.has(uid) ? s.delete(uid) : s.add(uid)
            setSelectedExistingUsers(s)
          }}
          onSearch={setPromoteSearchQuery}
          searchQuery={promoteSearchQuery}
          onLoadMore={() => setPromoteCurrentPage((p) => p + 1)}
          onCancel={() => {
            setShowExistingUsers(false)
            setSelectedExistingUsers(new Set())
            setPromoteSearchQuery("")
            setPromoteCurrentPage(1)
          }}
          onPromote={assignRoleToExistingUsers}
        />
      )}

      {showUserDetails && (
        <UserDetailsModal
          user={showUserDetails}
          onClose={() => setShowUserDetails(null)}
          formatDate={formatDate}
        />
      )}
    </div>
  )
}

// Firebase helper
async function getIdToken(): Promise<string> {
  const { getAuth } = await import("firebase/auth")
  const user = getAuth().currentUser
  if (!user) throw new Error("No user signed in")
  return await user.getIdToken()
}
