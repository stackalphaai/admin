import { useEffect, useState, useRef, useCallback } from "react"
import { tradesApi } from "@/services/api"
import { DataTable } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { formatDate, formatCurrency } from "@/lib/utils"
import type { Trade } from "@/types"
import { Radio } from "lucide-react"

export function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState("")
  const [exchange, setExchange] = useState("")
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(true)
  const fetchingRef = useRef(false)

  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)

  const fetchTrades = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    try {
      const res = await tradesApi.list(page, pageSize, status || undefined, exchange || undefined)
      setTrades(res.data.items)
      setTotal(res.data.total)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [page, status, exchange])

  useEffect(() => {
    fetchTrades()
  }, [fetchTrades])

  // Live auto-refresh every 5 seconds
  useEffect(() => {
    if (!live) return
    const interval = setInterval(fetchTrades, 5000)
    return () => clearInterval(interval)
  }, [live, fetchTrades])

  const handleForceClose = async (id: string) => {
    if (!confirm("Force close this trade?")) return
    try {
      await tradesApi.forceClose(id)
      fetchTrades()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trades</h1>
        <button
          onClick={() => setLive(!live)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border ${
            live
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-surface border-border text-text-muted"
          }`}
        >
          <Radio size={12} className={live ? "animate-pulse" : ""} />
          {live ? "Live" : "Paused"}
        </button>
      </div>

      <div className="flex gap-2">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="opening">Opening</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={exchange}
          onChange={(e) => {
            setExchange(e.target.value)
            setPage(1)
          }}
          className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">All Exchanges</option>
          <option value="hyperliquid">Hyperliquid</option>
          <option value="binance">Binance</option>
        </select>
      </div>

      <DataTable
        columns={[
          {
            header: "User",
            accessor: (row: Trade) => (
              <span className="text-xs">{row.user_email}</span>
            ),
          },
          { header: "Symbol", accessor: "symbol" },
          {
            header: "Direction",
            accessor: (row: Trade) => <StatusBadge status={row.direction} />,
          },
          {
            header: "Entry",
            accessor: (row: Trade) => `$${row.entry_price}`,
          },
          {
            header: "TP / SL",
            accessor: (row: Trade) => (
              <span className="text-xs">
                <span className="text-green-400">${row.take_profit_price}</span>
                {" / "}
                <span className="text-red-400">${row.stop_loss_price}</span>
              </span>
            ),
          },
          {
            header: "Size",
            accessor: (row: Trade) => formatCurrency(row.position_size_usd),
          },
          {
            header: "Leverage",
            accessor: (row: Trade) => `${row.leverage}x`,
          },
          {
            header: "PnL",
            accessor: (row: Trade) =>
              row.pnl_usd != null ? (
                <span
                  className={
                    row.pnl_usd >= 0 ? "text-success" : "text-danger"
                  }
                >
                  {row.pnl_usd >= 0 ? "+" : ""}
                  {formatCurrency(row.pnl_usd)}{" "}
                  {row.pnl_percent != null && (
                    <span className="text-xs">
                      ({row.pnl_percent >= 0 ? "+" : ""}
                      {row.pnl_percent.toFixed(1)}%)
                    </span>
                  )}
                </span>
              ) : (
                "-"
              ),
          },
          {
            header: "Status",
            accessor: (row: Trade) => <StatusBadge status={row.status} />,
          },
          {
            header: "Close",
            accessor: (row: Trade) =>
              row.close_reason ? (
                <span className="text-xs text-text-muted capitalize">
                  {row.close_reason}
                </span>
              ) : (
                "-"
              ),
          },
          {
            header: "Exchange",
            accessor: "exchange",
          },
          {
            header: "Date",
            accessor: (row: Trade) => (
              <span className="text-xs text-text-muted">
                {formatDate(row.created_at)}
              </span>
            ),
          },
          {
            header: "",
            accessor: (row: Trade) =>
              row.status === "open" || row.status === "opening" ? (
                <button
                  onClick={() => handleForceClose(row.id)}
                  className="text-xs text-danger hover:text-danger/80"
                >
                  Force Close
                </button>
              ) : null,
          },
        ]}
        data={trades}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={loading}
      />
    </div>
  )
}
