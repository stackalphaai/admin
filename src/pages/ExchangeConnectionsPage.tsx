import { useEffect, useState } from "react"
import { exchangeApi } from "@/services/api"
import { DataTable } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { formatDate, formatCurrency } from "@/lib/utils"
import type { ExchangeConnection } from "@/types"

export function ExchangeConnectionsPage() {
  const [connections, setConnections] = useState<ExchangeConnection[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)

  useEffect(() => {
    setLoading(true)
    exchangeApi
      .list(page, pageSize)
      .then((res) => {
        setConnections(res.data.items)
        setTotal(res.data.total)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Exchange Connections</h1>

      <DataTable
        columns={[
          { header: "User", accessor: (row: ExchangeConnection) => <span className="text-xs">{row.user_email}</span> },
          { header: "Exchange", accessor: (row: ExchangeConnection) => <span className="capitalize">{row.exchange_type}</span> },
          { header: "Label", accessor: (row: ExchangeConnection) => row.label || "-" },
          { header: "Testnet", accessor: (row: ExchangeConnection) => row.is_testnet ? "Yes" : "No" },
          { header: "Trading", accessor: (row: ExchangeConnection) => <StatusBadge status={row.is_trading_enabled ? "active" : "inactive"} /> },
          { header: "Status", accessor: (row: ExchangeConnection) => <StatusBadge status={row.status} /> },
          { header: "Balance", accessor: (row: ExchangeConnection) => row.balance_usd != null ? formatCurrency(row.balance_usd) : "-" },
          { header: "Last Sync", accessor: (row: ExchangeConnection) => row.last_sync_at ? <span className="text-xs text-text-muted">{formatDate(row.last_sync_at)}</span> : "-" },
        ]}
        data={connections}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={loading}
      />
    </div>
  )
}
