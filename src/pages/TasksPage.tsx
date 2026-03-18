import { useEffect, useRef, useState, useCallback } from "react"
import { tasksApi, logsApi } from "@/services/api"
import { Card } from "@/components/Card"
import type { CeleryTask } from "@/types"
import { Play, Clock, X, Terminal } from "lucide-react"

const LOG_SOURCES = ["celery-worker", "celery-beat", "api"] as const

export function TasksPage() {
  const [tasks, setTasks] = useState<CeleryTask[]>([])
  const [loading, setLoading] = useState(true)
  const [triggerResult, setTriggerResult] = useState<Record<string, string>>({})
  const [togglingTask, setTogglingTask] = useState<string | null>(null)
  const [showLogs, setShowLogs] = useState(false)
  const [logSource, setLogSource] = useState<string>("celery-worker")
  const [logLines, setLogLines] = useState<string[]>([])
  const [logLoading, setLogLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fetchingRef = useRef(false)

  useEffect(() => {
    tasksApi
      .list()
      .then((res) => setTasks(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const fetchLogs = useCallback(async () => {
    // Prevent overlapping requests
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLogLoading(true)
    try {
      const res = await logsApi.get(logSource, 200)
      if (!res.data.error) {
        setLogLines(res.data.lines)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLogLoading(false)
      fetchingRef.current = false
    }
  }, [logSource])

  // Auto-refresh logs every 3 seconds when panel is open
  useEffect(() => {
    if (!showLogs || !autoRefresh) return
    fetchLogs()
    const interval = setInterval(fetchLogs, 3000)
    return () => clearInterval(interval)
  }, [showLogs, autoRefresh, fetchLogs])

  // Auto-scroll to bottom on new lines
  useEffect(() => {
    if (autoRefresh && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logLines, autoRefresh])

  const handleTrigger = async (taskName: string) => {
    setTriggerResult((prev) => ({ ...prev, [taskName]: "Triggering..." }))
    try {
      const res = await tasksApi.trigger(taskName)
      setTriggerResult((prev) => ({
        ...prev,
        [taskName]: `Queued: ${res.data.task_id.slice(0, 8)}...`,
      }))
      // Auto-open logs panel and start streaming
      setShowLogs(true)
      setAutoRefresh(true)
      // Pick the right log source based on task name
      if (taskName.includes("beat")) {
        setLogSource("celery-beat")
      } else {
        setLogSource("celery-worker")
      }
    } catch (e) {
      setTriggerResult((prev) => ({ ...prev, [taskName]: "Error" }))
      console.error(e)
    }
  }

  const handleToggle = async (taskName: string) => {
    setTogglingTask(taskName)
    try {
      const res = await tasksApi.toggle(taskName)
      setTasks((prev) =>
        prev.map((t) => (t.name === taskName ? { ...t, enabled: res.data.enabled } : t)),
      )
    } catch (e) {
      console.error(e)
    } finally {
      setTogglingTask(null)
    }
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

  if (loading) return <p className="text-text-muted">Loading tasks...</p>

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Celery Tasks</h1>
          <p className="text-sm text-text-muted">
            Manually trigger background tasks or enable/disable their scheduled execution.
          </p>
        </div>
        {!showLogs && (
          <button
            onClick={() => {
              setShowLogs(true)
              setAutoRefresh(true)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-surface border border-border hover:border-accent text-text-secondary"
          >
            <Terminal size={12} /> Show Logs
          </button>
        )}
      </div>

      <div className="grid gap-3">
        {tasks.map((task) => (
          <Card key={task.name} className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-accent truncate">{task.name}</code>
                {!task.enabled && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-400 font-medium shrink-0">
                    DISABLED
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-1">{task.description}</p>
              <div className="flex items-center gap-1 mt-1 text-xs text-text-muted">
                <Clock size={10} />
                {task.schedule}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {/* Enable/Disable toggle */}
              <button
                onClick={() => handleToggle(task.name)}
                disabled={togglingTask === task.name}
                title={task.enabled ? "Disable task" : "Enable task"}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                  task.enabled ? "bg-accent" : "bg-border"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    task.enabled ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
              {triggerResult[task.name] && (
                <span className="text-xs text-text-muted">{triggerResult[task.name]}</span>
              )}
              <button
                onClick={() => handleTrigger(task.name)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20"
              >
                <Play size={12} /> Run Now
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Live Log Panel */}
      {showLogs && (
        <div className="flex-1 min-h-0 flex flex-col border border-border rounded-lg overflow-hidden">
          {/* Log panel header */}
          <div className="flex items-center justify-between px-3 py-2 bg-surface border-b border-border">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-text-primary flex items-center gap-1.5">
                <Terminal size={12} className="text-accent" /> Live Logs
              </span>
              <select
                value={logSource}
                onChange={(e) => setLogSource(e.target.value)}
                className="bg-background border border-border rounded px-2 py-0.5 text-xs focus:outline-none focus:border-accent"
              >
                {LOG_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-xs text-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="accent-accent"
                />
                Auto-refresh
              </label>
              {logLoading && (
                <span className="text-xs text-text-muted animate-pulse">Fetching...</span>
              )}
            </div>
            <button
              onClick={() => {
                setShowLogs(false)
                setAutoRefresh(false)
              }}
              className="text-text-muted hover:text-text-primary p-0.5"
            >
              <X size={14} />
            </button>
          </div>

          {/* Log output — single pre block for performance */}
          <div className="flex-1 min-h-0 bg-[#0d1117] overflow-auto font-mono text-xs leading-5">
            <pre className="p-3 m-0 whitespace-pre-wrap break-all">
              {logLines.length === 0 && (
                <span className="text-text-muted">No log lines found</span>
              )}
              {logLines.map((line, i) => (
                <span key={i} className={getLineColor(line)}>
                  {line}
                  {"\n"}
                </span>
              ))}
              <span ref={bottomRef} />
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
