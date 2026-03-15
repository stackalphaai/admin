import { useEffect, useState } from "react"
import { walletsApi } from "@/services/api"
import { DataTable } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { formatDate, formatCurrency } from "@/lib/utils"
import type { WalletInfo } from "@/types"

export function WalletsPage() {
  const [wallets, setWallets] = useState<WalletInfo[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)

  useEffect(() => {
    setLoading(true)
    walletsApi
      .list(page, pageSize)
      .then((res) => {
        setWallets(res.data.items)
        setTotal(res.data.total)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Wallets</h1>

      <DataTable
        columns={[
          { header: "User", accessor: (row: WalletInfo) => <span className="text-xs">{row.user_email}</span> },
          { header: "Address", accessor: (row: WalletInfo) => <span className="text-xs font-mono">{row.address.slice(0, 10)}...{row.address.slice(-6)}</span> },
          { header: "Type", accessor: (row: WalletInfo) => <span className="capitalize">{row.wallet_type}</span> },
          { header: "Status", accessor: (row: WalletInfo) => <StatusBadge status={row.status} /> },
          { header: "Trading", accessor: (row: WalletInfo) => <StatusBadge status={row.is_trading_enabled ? "active" : "inactive"} /> },
          { header: "Balance", accessor: (row: WalletInfo) => row.balance_usd != null ? formatCurrency(row.balance_usd) : "-" },
          { header: "Margin Used", accessor: (row: WalletInfo) => row.margin_used != null ? formatCurrency(row.margin_used) : "-" },
          { header: "Last Sync", accessor: (row: WalletInfo) => row.last_sync_at ? <span className="text-xs text-text-muted">{formatDate(row.last_sync_at)}</span> : "-" },
        ]}
        data={wallets}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={loading}
      />
    </div>
  )
}
