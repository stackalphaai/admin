import { useEffect, useState } from "react"
import { usersApi } from "@/services/api"
import { DataTable } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { formatDate } from "@/lib/utils"
import type { UserListItem, UserDetail } from "@/types"
import { Search, X, Save, Gift } from "lucide-react"

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-border-hover"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform mt-0.5 ${
            checked ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  )
}

export function UsersPage() {
  const [users, setUsers] = useState<UserListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  // Editable fields
  const [editName, setEditName] = useState("")
  const [editActive, setEditActive] = useState(false)
  const [editVerified, setEditVerified] = useState(false)
  const [editSubscribed, setEditSubscribed] = useState(false)
  const [editAdmin, setEditAdmin] = useState(false)
  const [editSuperadmin, setEditSuperadmin] = useState(false)

  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)

  const fetchUsers = () => {
    setLoading(true)
    usersApi
      .list(page, pageSize, search || undefined)
      .then((res) => {
        setUsers(res.data.items)
        setTotal(res.data.total)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  }, [page, search])

  const populateEditFields = (user: UserDetail) => {
    setEditName(user.full_name || "")
    setEditActive(user.is_active)
    setEditVerified(user.is_verified)
    setEditSubscribed(user.is_subscribed)
    setEditAdmin(user.is_admin)
    setEditSuperadmin(user.is_superadmin)
  }

  const viewUser = async (id: string) => {
    setDetailLoading(true)
    setMessage("")
    try {
      const res = await usersApi.detail(id)
      setSelectedUser(res.data)
      populateEditFields(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedUser) return
    setSaving(true)
    setMessage("")
    try {
      const res = await usersApi.update(selectedUser.id, {
        full_name: editName || null,
        is_active: editActive,
        is_verified: editVerified,
        is_subscribed: editSubscribed,
        is_admin: editAdmin,
        is_superadmin: editSuperadmin,
      })
      setSelectedUser(res.data)
      populateEditFields(res.data)
      setMessage("User updated")
      fetchUsers()
    } catch (e) {
      setMessage("Error updating user")
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleGrantSub = async () => {
    if (!selectedUser) return
    try {
      await usersApi.grantSubscription(selectedUser.id, "monthly", 30)
      const res = await usersApi.detail(selectedUser.id)
      setSelectedUser(res.data)
      populateEditFields(res.data)
      setMessage("30-day subscription granted")
      fetchUsers()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="bg-surface border border-border rounded-md pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-accent w-60"
          />
        </div>
      </div>

      <DataTable
        columns={[
          { header: "Email", accessor: "email" },
          {
            header: "Name",
            accessor: (row: UserListItem) => row.full_name || "-",
          },
          {
            header: "Active",
            accessor: (row: UserListItem) => (
              <StatusBadge status={row.is_active ? "active" : "inactive"} />
            ),
          },
          {
            header: "Subscribed",
            accessor: (row: UserListItem) => (
              <StatusBadge
                status={row.is_subscribed ? "active" : "inactive"}
              />
            ),
          },
          {
            header: "Admin",
            accessor: (row: UserListItem) =>
              row.is_admin ? (
                <StatusBadge status="active" />
              ) : (
                <span className="text-text-muted text-xs">No</span>
              ),
          },
          {
            header: "Joined",
            accessor: (row: UserListItem) => (
              <span className="text-xs text-text-muted">
                {formatDate(row.created_at)}
              </span>
            ),
          },
          {
            header: "",
            accessor: (row: UserListItem) => (
              <button
                onClick={() => viewUser(row.id)}
                className="text-xs text-accent hover:text-accent-hover"
              >
                Edit
              </button>
            ),
          },
        ]}
        data={users}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={loading}
      />

      {/* User Edit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-lg w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            {detailLoading ? (
              <p className="text-text-muted">Loading...</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">
                      {selectedUser.email}
                    </h2>
                    <span className="text-xs text-text-muted font-mono">
                      {selectedUser.id}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-text-muted hover:text-text-primary"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Read-only stats */}
                <div className="grid grid-cols-3 gap-3 text-sm mb-5 p-3 bg-background rounded-md">
                  <div className="text-center">
                    <p className="text-xs text-text-muted">Logins</p>
                    <p className="font-semibold">{selectedUser.login_count}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-text-muted">Trades</p>
                    <p className="font-semibold">{selectedUser.trade_count}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-text-muted">Wallets</p>
                    <p className="font-semibold">{selectedUser.wallet_count}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-text-muted">Exchanges</p>
                    <p className="font-semibold">
                      {selectedUser.exchange_connection_count}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-text-muted">Telegram</p>
                    <StatusBadge
                      status={
                        selectedUser.has_telegram ? "connected" : "disconnected"
                      }
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-text-muted">2FA</p>
                    <StatusBadge
                      status={
                        selectedUser.is_2fa_enabled ? "active" : "inactive"
                      }
                    />
                  </div>
                </div>

                {/* Editable fields */}
                <div className="space-y-3 mb-5">
                  <div>
                    <label className="block text-xs text-text-muted mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="No name set"
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="bg-background rounded-md px-3 py-1 divide-y divide-border">
                    <Toggle
                      label="Active"
                      checked={editActive}
                      onChange={setEditActive}
                    />
                    <Toggle
                      label="Email Verified"
                      checked={editVerified}
                      onChange={setEditVerified}
                    />
                    <Toggle
                      label="Subscribed"
                      checked={editSubscribed}
                      onChange={setEditSubscribed}
                    />
                    <Toggle
                      label="Admin"
                      checked={editAdmin}
                      onChange={setEditAdmin}
                    />
                    <Toggle
                      label="Superadmin"
                      checked={editSuperadmin}
                      onChange={setEditSuperadmin}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                    >
                      <Save size={14} />
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={handleGrantSub}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-success/10 text-success hover:bg-success/20"
                    >
                      <Gift size={12} /> Grant 30d Sub
                    </button>
                  </div>
                  {message && (
                    <span className="text-xs text-accent">{message}</span>
                  )}
                </div>

                <p className="text-[10px] text-text-muted mt-3">
                  Joined {formatDate(selectedUser.created_at)}
                  {selectedUser.last_login &&
                    ` · Last login ${formatDate(selectedUser.last_login)}`}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
