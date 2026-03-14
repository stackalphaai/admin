import { useEffect, useState } from "react"
import { tasksApi } from "@/services/api"
import { Card } from "@/components/Card"
import type { CeleryTask } from "@/types"
import { Play, Clock } from "lucide-react"

export function TasksPage() {
  const [tasks, setTasks] = useState<CeleryTask[]>([])
  const [loading, setLoading] = useState(true)
  const [triggerResult, setTriggerResult] = useState<Record<string, string>>({})

  useEffect(() => {
    tasksApi
      .list()
      .then((res) => setTasks(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleTrigger = async (taskName: string) => {
    setTriggerResult((prev) => ({ ...prev, [taskName]: "Triggering..." }))
    try {
      const res = await tasksApi.trigger(taskName)
      setTriggerResult((prev) => ({
        ...prev,
        [taskName]: `Queued: ${res.data.task_id.slice(0, 8)}...`,
      }))
    } catch (e) {
      setTriggerResult((prev) => ({ ...prev, [taskName]: "Error" }))
      console.error(e)
    }
  }

  if (loading) return <p className="text-text-muted">Loading tasks...</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Celery Tasks</h1>
      <p className="text-sm text-text-muted">
        Manually trigger background tasks. Tasks run asynchronously via Celery.
      </p>

      <div className="grid gap-3">
        {tasks.map((task) => (
          <Card key={task.name} className="flex items-center justify-between">
            <div>
              <code className="text-sm font-mono text-accent">{task.name}</code>
              <p className="text-xs text-text-muted mt-1">
                {task.description}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs text-text-muted">
                <Clock size={10} />
                {task.schedule}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {triggerResult[task.name] && (
                <span className="text-xs text-text-muted">
                  {triggerResult[task.name]}
                </span>
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
    </div>
  )
}
