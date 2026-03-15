import { useEffect, useRef, useState } from "react"
import { logsApi } from "@/services/api"

const SOURCES = ["celery-worker", "celery-beat", "api"]

export function LogsPage() {
  const [source, setSource] = useState("celery-worker")
  const [lines, setLines] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lineCount, setLineCount] = useState(200)
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchLogs = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await logsApi.get(source, lineCount, search)
      if (res.data.error) {
        setError(res.data.error)
        setLines([])
      } else {
        setLines(res.data.lines)
      }
    } catch (e) {
      setError("Failed to fetch logs")
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [source, lineCount])

  // Auto-refresh every 3 seconds
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchLogs, 3000)
    return () => clearInterval(interval)
  }, [autoRefresh, source, lineCount, search])

  // Auto-scroll to bottom on new lines
  useEffect(() => {
    if (autoRefresh && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [lines, autoRefresh])

  const handleSearch = () => {
    fetchLogs()
  }

  const getLineColor = (line: string) => {
    const lower = line.toLowerCase()
    if (lower.includes("error") || lower.includes("exception") || lower.includes("traceback"))
      return "text-red-400"
    if (lower.includes("warning") || lower.includes("warn")) return "text-yellow-400"
    if (lower.includes("success") || lower.includes("executed") || lower.includes("opened"))
      return "text-green-400"
    if (lower.includes("info")) return "text-text-muted"
    return "text-text-secondary"
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Logs</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="accent-accent"
            />
            Auto-refresh
          </label>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="text-xs bg-accent/10 text-accent hover:bg-accent/20 px-3 py-1.5 rounded-md font-medium disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap items-end">
        <div>
          <label className="block text-xs text-text-muted mb-1">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Lines</label>
          <select
            value={lineCount}
            onChange={(e) => setLineCount(Number(e.target.value))}
            className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
          >
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-text-muted mb-1">Search</label>
          <div className="flex gap-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Filter logs..."
              className="flex-1 bg-surface border border-border rounded-md px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-accent"
            />
            <button
              onClick={handleSearch}
              className="px-3 py-1.5 rounded-md text-sm bg-surface border border-border hover:border-accent"
            >
              Filter
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Log output */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 bg-[#0d1117] border border-border rounded-lg overflow-auto font-mono text-xs leading-5"
      >
        <div className="p-3">
          {lines.length === 0 && !loading && (
            <span className="text-text-muted">No log lines found</span>
          )}
          {lines.map((line, i) => (
            <div key={i} className={`whitespace-pre-wrap break-all ${getLineColor(line)}`}>
              {line}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}
