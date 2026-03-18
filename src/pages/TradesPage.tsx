import { useEffect, useState } from "react"
import { tradesApi } from "@/services/api"
import { DataTable } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { formatDate, formatCurrency } from "@/lib/utils"
import type { Trade } from "@/types"
import { Radio, History } from "lucide-react"
import {
  useAdminTradeStream,
  type LiveTrade,
} from "@/hooks/useAdminTradeStream"

function LiveTradesView() {
  const { trades, summary, status } = useAdminTradeStream()

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-6 px-4 py-3 bg-surface border border-border rounded-lg">
        <div>
          <span className="text-xs text-text-muted">Open Trades</span>
          <p className="text-lg font-bold">{summary.total_open}</p>
        </div>
        <div>
          <span className="text-xs text-text-muted">Unrealized PnL</span>
          <p
            className={`text-lg font-bold ${
              summary.total_unrealized_pnl >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {summary.total_unrealized_pnl >= 0 ? "+" : ""}
            {formatCurrency(summary.total_unrealized_pnl)}
          </p>
        </div>
        <div>
          <span className="text-xs text-text-muted">Margin Used</span>
          <p className="text-lg font-bold">{formatCurrency(summary.total_margin_used)}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              status === "connected"
                ? "bg-green-400 animate-pulse"
                : status === "polling"
                  ? "bg-blue-400 animate-pulse"
                  : status === "connecting"
                    ? "bg-yellow-400 animate-pulse"
                    : "bg-red-400"
            }`}
          />
          <span className="text-xs text-text-muted capitalize">{status}</span>
        </div>
      </div>

      {/* Live trades table */}
      {trades.length === 0 ? (
        <div className="text-center py-12 text-text-muted">No open trades</div>
      ) : (
        <div className="overflow-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">User</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Symbol</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Dir</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-text-muted">Entry</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-text-muted">Current</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-text-muted">TP / SL</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-text-muted">Size</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-text-muted">Lev</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-text-muted">PnL</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Exchange</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t: LiveTrade) => {
                const pnlColor =
                  t.unrealized_pnl > 0
                    ? "text-green-400"
                    : t.unrealized_pnl < 0
                      ? "text-red-400"
                      : "text-text-secondary"
                return (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-surface/50">
                    <td className="px-3 py-2 text-xs">{t.user_email}</td>
                    <td className="px-3 py-2 font-medium">{t.symbol}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          t.direction === "long"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {t.direction.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {t.entry_price != null ? `$${t.entry_price}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {t.current_price != null ? `$${t.current_price}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-xs">
                      <span className="text-green-400">${t.take_profit_price ?? "—"}</span>
                      {" / "}
                      <span className="text-red-400">${t.stop_loss_price ?? "—"}</span>
                    </td>
                    <td className="px-3 py-2 text-right text-xs">{formatCurrency(t.position_size_usd)}</td>
                    <td className="px-3 py-2 text-right text-xs">{t.leverage}x</td>
                    <td className={`px-3 py-2 text-right font-mono text-xs ${pnlColor}`}>
                      {t.unrealized_pnl >= 0 ? "+" : ""}
                      {formatCurrency(t.unrealized_pnl)}
                      <br />
                      <span className="text-[10px] opacity-70">
                        {t.unrealized_pnl_percent >= 0 ? "+" : ""}
                        {t.unrealized_pnl_percent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs capitalize">{t.exchange}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function HistoryView() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState("")
  const [exchange, setExchange] = useState("")
  const [loading, setLoading] = useState(true)

  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)

  const fetchTrades = () => {
    setLoading(true)
    tradesApi
      .list(page, pageSize, status || undefined, exchange || undefined)
      .then((res) => {
        setTrades(res.data.items)
        setTotal(res.data.total)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTrades()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, exchange])

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
            accessor: (row: Trade) => <span className="text-xs">{row.user_email}</span>,
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
            header: "Exit",
            accessor: (row: Trade) => row.exit_price ? `$${row.exit_price}` : "-",
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
            accessor: (row: Trade) => {
              const pnl = row.realized_pnl ?? row.unrealized_pnl
              const pct = row.realized_pnl_percent
              if (pnl == null) return "-"
              return (
                <span className={pnl >= 0 ? "text-success" : "text-danger"}>
                  {pnl >= 0 ? "+" : ""}
                  {formatCurrency(pnl)}{" "}
                  {pct != null && (
                    <span className="text-xs">
                      ({pct >= 0 ? "+" : ""}
                      {pct.toFixed(1)}%)
                    </span>
                  )}
                </span>
              )
            },
          },
          {
            header: "Status",
            accessor: (row: Trade) => <StatusBadge status={row.status} />,
          },
          {
            header: "Close",
            accessor: (row: Trade) =>
              row.close_reason ? (
                <span className="text-xs text-text-muted capitalize">{row.close_reason}</span>
              ) : (
                "-"
              ),
          },
          { header: "Exchange", accessor: "exchange" },
          {
            header: "Date",
            accessor: (row: Trade) => (
              <span className="text-xs text-text-muted">{formatDate(row.created_at)}</span>
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
        onPageChange={(p) => {
          setPage(p)
        }}
        isLoading={loading}
      />
    </div>
  )
}

export function TradesPage() {
  const [view, setView] = useState<"live" | "history">("live")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trades</h1>
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-0.5">
          <button
            onClick={() => setView("live")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              view === "live"
                ? "bg-green-500/10 text-green-400"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <Radio size={12} className={view === "live" ? "animate-pulse" : ""} />
            Live
          </button>
          <button
            onClick={() => setView("history")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              view === "history"
                ? "bg-accent/10 text-accent"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <History size={12} />
            History
          </button>
        </div>
      </div>

      {view === "live" ? <LiveTradesView /> : <HistoryView />}
    </div>
  )
}
