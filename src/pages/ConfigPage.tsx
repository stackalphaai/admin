import { useEffect, useState } from "react"
import { configApi } from "@/services/api"
import { Card } from "@/components/Card"
import type { ConfigMap } from "@/types"
import { Save, RotateCcw } from "lucide-react"

export function ConfigPage() {
  const [configs, setConfigs] = useState<ConfigMap>({})
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const fetchConfig = () => {
    setLoading(true)
    configApi
      .getAll()
      .then((res) => {
        setConfigs(res.data.configs)
        // Initialize edit values
        const edits: Record<string, string> = {}
        for (const [key, setting] of Object.entries(res.data.configs)) {
          edits[key] =
            typeof setting.value === "object"
              ? JSON.stringify(setting.value)
              : String(setting.value)
        }
        setEditValues(edits)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  const handleSave = async (key: string) => {
    const setting = configs[key]
    if (!setting) return

    setSaving(true)
    setMessage("")

    let value: unknown = editValues[key]
    if (setting.type === "json") value = JSON.parse(editValues[key])
    else if (setting.type === "float") value = parseFloat(editValues[key])
    else if (setting.type === "int") value = parseInt(editValues[key])
    else if (setting.type === "bool")
      value = editValues[key].toLowerCase() === "true"

    try {
      await configApi.update([{ key, value }])
      setMessage(`Updated: ${key}`)
      fetchConfig()
    } catch (e) {
      setMessage(`Error updating ${key}`)
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async (key: string) => {
    try {
      await configApi.reset(key)
      setMessage(`Reset: ${key}`)
      fetchConfig()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <p className="text-text-muted">Loading config...</p>

  // Group by category
  const categories: Record<string, string[]> = {}
  for (const [key, setting] of Object.entries(configs)) {
    const cat = setting.category
    if (!categories[cat]) categories[cat] = []
    categories[cat].push(key)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configuration</h1>
        {message && (
          <span className="text-xs text-accent">{message}</span>
        )}
      </div>

      {Object.entries(categories).map(([category, keys]) => (
        <Card key={category}>
          <h2 className="text-lg font-semibold capitalize mb-4">
            {category.replace(/_/g, " ")}
          </h2>
          <div className="space-y-3">
            {keys.map((key) => {
              const setting = configs[key]
              return (
                <div
                  key={key}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-background rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-accent">
                        {key}
                      </code>
                      {setting.has_override && (
                        <span className="text-[10px] bg-warning/10 text-warning px-1.5 py-0.5 rounded">
                          overridden
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      {setting.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {setting.type === "bool" ? (
                      <select
                        value={editValues[key]}
                        onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        className="bg-surface border border-border rounded px-2 py-1 text-sm w-24"
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : (
                      <input
                        type={
                          setting.type === "float" || setting.type === "int"
                            ? "number"
                            : "text"
                        }
                        step={setting.type === "float" ? "any" : undefined}
                        value={editValues[key] || ""}
                        onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        className="bg-surface border border-border rounded px-2 py-1 text-sm w-48 font-mono"
                      />
                    )}
                    <button
                      onClick={() => handleSave(key)}
                      disabled={saving}
                      className="p-1.5 rounded bg-accent/10 text-accent hover:bg-accent/20"
                      title="Save"
                    >
                      <Save size={14} />
                    </button>
                    {setting.has_override && (
                      <button
                        onClick={() => handleReset(key)}
                        className="p-1.5 rounded bg-warning/10 text-warning hover:bg-warning/20"
                        title="Reset to default"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ))}
    </div>
  )
}
