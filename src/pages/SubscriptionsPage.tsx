import { useEffect, useState } from "react"
import { subscriptionsApi } from "@/services/api"
import { DataTable } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { formatDate, formatCurrency } from "@/lib/utils"
import type { Subscription } from "@/types"

export function SubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)

  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)

  const fetchSubs = () => {
    setLoading(true)
    subscriptionsApi
      .list(page, pageSize, status || undefined)
      .then((res) => {
        setSubs(res.data.items)
        setTotal(res.data.total)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSubs()
  }, [page, status])

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this subscription?")) return
    try {
      await subscriptionsApi.cancel(id)
      fetchSubs()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Subscriptions</h1>

      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value)
          setPage(1)
        }}
        className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm"
      >
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="expired">Expired</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <DataTable
        columns={[
          { header: "User ID", accessor: (row: Subscription) => <span className="text-xs font-mono">{row.user_id.slice(0, 8)}...</span> },
          { header: "Plan", accessor: (row: Subscription) => <span className="capitalize">{row.plan}</span> },
          { header: "Price", accessor: (row: Subscription) => formatCurrency(row.price_usd) },
          { header: "Status", accessor: (row: Subscription) => <StatusBadge status={row.status} /> },
          { header: "Starts", accessor: (row: Subscription) => <span className="text-xs text-text-muted">{formatDate(row.starts_at)}</span> },
          { header: "Expires", accessor: (row: Subscription) => <span className="text-xs text-text-muted">{formatDate(row.expires_at)}</span> },
          {
            header: "",
            accessor: (row: Subscription) =>
              row.status === "active" ? (
                <button onClick={() => handleCancel(row.id)} className="text-xs text-danger hover:text-danger/80">
                  Cancel
                </button>
              ) : null,
          },
        ]}
        data={subs}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={loading}
      />
    </div>
  )
}
