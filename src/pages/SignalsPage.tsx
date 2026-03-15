import { useEffect, useState, type FormEvent } from "react"
import { signalsApi } from "@/services/api"
import { DataTable } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { formatDate } from "@/lib/utils"
import type { Signal } from "@/types"

interface ExecuteResult {
  signal_id: string
  symbol: string
  exchange: string
  total_eligible: number
  executed: number
  rejected: number
  errors: number
  details: { user: string; status: string; reason?: string; trade_id?: string }[]
}

export function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [exchange, setExchange] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [symbol, setSymbol] = useState("")
  const [genExchange, setGenExchange] = useState("hyperliquid")
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState("")
  const [executing, setExecuting] = useState<string | null>(null)
  const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(null)

  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)

  const fetchSignals = () => {
    setLoading(true)
    signalsApi
      .list(page, pageSize, exchange || undefined, status || undefined)
      .then((res) => {
        setSignals(res.data.items)
        setTotal(res.data.total)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSignals()
  }, [page, exchange, status])

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault()
    if (!symbol.trim()) return
    setGenerating(true)
    setGenResult("")
    try {
      const res = await signalsApi.generate(symbol.trim(), genExchange)
      setGenResult(
        res.data.status === "success"
          ? `Signal generated: ${res.data.signal_id}`
          : "No consensus reached"
      )
      fetchSignals()
    } catch (e) {
      setGenResult("Error generating signal")
      console.error(e)
    } finally {
      setGenerating(false)
    }
  }

  const handleInvalidate = async (id: string) => {
    try {
      await signalsApi.invalidate(id)
      fetchSignals()
    } catch (e) {
      console.error(e)
    }
  }

  const handleExecute = async (id: string) => {
    if (!confirm("Execute this signal for all eligible users?")) return
    setExecuting(id)
    setExecuteResult(null)
    try {
      const res = await signalsApi.execute(id)
      setExecuteResult(res.data)
    } catch (e) {
      console.error(e)
      alert("Failed to execute signal")
    } finally {
      setExecuting(null)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Signals</h1>

      {/* Generate Signal */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-3">Generate Signal</h2>
        <form onSubmit={handleGenerate} className="flex gap-2 items-end flex-wrap">
          <div>
            <label className="block text-xs text-text-muted mb-1">
              Symbol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="BTC, ETH..."
              className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-accent w-32"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">
              Exchange
            </label>
            <select
              value={genExchange}
              onChange={(e) => setGenExchange(e.target.value)}
              className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
            >
              <option value="hyperliquid">Hyperliquid</option>
              <option value="binance">Binance</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={generating}
            className="bg-accent hover:bg-accent-hover text-white px-4 py-1.5 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate"}
          </button>
          {genResult && (
            <span className="text-xs text-text-muted">{genResult}</span>
          )}
        </form>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
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
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Execute Result */}
      {executeResult && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">
              Execution Result — {executeResult.symbol} ({executeResult.exchange})
            </h2>
            <button
              onClick={() => setExecuteResult(null)}
              className="text-xs text-text-muted hover:text-text"
            >
              Dismiss
            </button>
          </div>
          <div className="flex gap-4 text-sm mb-3">
            <span>
              Eligible: <strong>{executeResult.total_eligible}</strong>
            </span>
            <span className="text-green-400">
              Executed: <strong>{executeResult.executed}</strong>
            </span>
            <span className="text-yellow-400">
              Rejected: <strong>{executeResult.rejected}</strong>
            </span>
            <span className="text-red-400">
              Errors: <strong>{executeResult.errors}</strong>
            </span>
          </div>
          {executeResult.details.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {executeResult.details.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs font-mono"
                >
                  <span
                    className={
                      d.status === "executed"
                        ? "text-green-400"
                        : d.status === "rejected"
                          ? "text-yellow-400"
                          : "text-red-400"
                    }
                  >
                    {d.status}
                  </span>
                  <span className="text-text-muted">{d.user}</span>
                  {d.reason && (
                    <span className="text-text-muted">— {d.reason}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <DataTable
        columns={[
          { header: "Symbol", accessor: "symbol" },
          {
            header: "Direction",
            accessor: (row: Signal) => (
              <StatusBadge status={row.direction} />
            ),
          },
          {
            header: "Entry",
            accessor: (row: Signal) => `$${row.entry_price}`,
          },
          {
            header: "TP",
            accessor: (row: Signal) => `$${row.take_profit_price}`,
          },
          {
            header: "SL",
            accessor: (row: Signal) => `$${row.stop_loss_price}`,
          },
          {
            header: "Confidence",
            accessor: (row: Signal) => `${(row.confidence_score * 100).toFixed(0)}%`,
          },
          {
            header: "Exchange",
            accessor: "exchange",
          },
          {
            header: "Status",
            accessor: (row: Signal) => <StatusBadge status={row.status} />,
          },
          {
            header: "Created",
            accessor: (row: Signal) => (
              <span className="text-xs text-text-muted">
                {formatDate(row.created_at)}
              </span>
            ),
          },
          {
            header: "Actions",
            accessor: (row: Signal) => (
              <div className="flex gap-2">
                {row.status === "active" && (
                  <button
                    onClick={() => handleExecute(row.id)}
                    disabled={executing === row.id}
                    className="text-xs text-accent hover:text-accent-hover font-medium disabled:opacity-50"
                  >
                    {executing === row.id ? "Executing..." : "Execute"}
                  </button>
                )}
                {row.status !== "expired" && (
                  <button
                    onClick={() => handleInvalidate(row.id)}
                    className="text-xs text-danger hover:text-danger/80"
                  >
                    Invalidate
                  </button>
                )}
              </div>
            ),
          },
        ]}
        data={signals}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={loading}
      />
    </div>
  )
}
