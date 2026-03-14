import { useEffect, useState } from "react"
import { usersApi } from "@/services/api"
import { DataTable } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { formatDate } from "@/lib/utils"
import type { UserListItem, UserDetail } from "@/types"
import { Search, X, Shield, ShieldOff, Ban, UserCheck, Gift } from "lucide-react"

export function UsersPage() {
  const [users, setUsers] = useState<UserListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

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

  const viewUser = async (id: string) => {
    setDetailLoading(true)
    try {
      const res = await usersApi.detail(id)
      setSelectedUser(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleAction = async (
    action: "toggleActive" | "toggleAdmin" | "grantSub",
    userId: string
  ) => {
    try {
      if (action === "toggleActive") await usersApi.toggleActive(userId)
      else if (action === "toggleAdmin") await usersApi.toggleAdmin(userId)
      else if (action === "grantSub")
        await usersApi.grantSubscription(userId, "monthly", 30)

      // Refresh user detail
      if (selectedUser?.id === userId) {
        const res = await usersApi.detail(userId)
        setSelectedUser(res.data)
      }
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
                View
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

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-lg w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            {detailLoading ? (
              <p className="text-text-muted">Loading...</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">{selectedUser.email}</h2>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-text-muted hover:text-text-primary"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-6">
                  <div>
                    <span className="text-text-muted">Name</span>
                    <p>{selectedUser.full_name || "-"}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Login Count</span>
                    <p>{selectedUser.login_count}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Wallets</span>
                    <p>{selectedUser.wallet_count}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Trades</span>
                    <p>{selectedUser.trade_count}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Exchanges</span>
                    <p>{selectedUser.exchange_connection_count}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Telegram</span>
                    <p>
                      <StatusBadge
                        status={
                          selectedUser.has_telegram ? "connected" : "disconnected"
                        }
                      />
                    </p>
                  </div>
                  <div>
                    <span className="text-text-muted">2FA</span>
                    <p>
                      <StatusBadge
                        status={
                          selectedUser.is_2fa_enabled ? "active" : "inactive"
                        }
                      />
                    </p>
                  </div>
                  <div>
                    <span className="text-text-muted">Joined</span>
                    <p className="text-xs">
                      {formatDate(selectedUser.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      handleAction("toggleActive", selectedUser.id)
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium ${
                      selectedUser.is_active
                        ? "bg-danger/10 text-danger hover:bg-danger/20"
                        : "bg-success/10 text-success hover:bg-success/20"
                    }`}
                  >
                    {selectedUser.is_active ? (
                      <>
                        <Ban size={12} /> Ban User
                      </>
                    ) : (
                      <>
                        <UserCheck size={12} /> Activate
                      </>
                    )}
                  </button>
                  <button
                    onClick={() =>
                      handleAction("toggleAdmin", selectedUser.id)
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20"
                  >
                    {selectedUser.is_admin ? (
                      <>
                        <ShieldOff size={12} /> Remove Admin
                      </>
                    ) : (
                      <>
                        <Shield size={12} /> Make Admin
                      </>
                    )}
                  </button>
                  {!selectedUser.is_subscribed && (
                    <button
                      onClick={() =>
                        handleAction("grantSub", selectedUser.id)
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-success/10 text-success hover:bg-success/20"
                    >
                      <Gift size={12} /> Grant 30d Sub
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
