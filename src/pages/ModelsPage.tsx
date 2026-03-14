import { useEffect, useState } from "react"
import { modelsApi } from "@/services/api"
import { Card } from "@/components/Card"
import { Save, Plus } from "lucide-react"

interface LLMModel {
  id: string
  name: string
  provider: string
  description: string
  is_active: boolean
}

export function ModelsPage() {
  const [models, setModels] = useState<LLMModel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [customId, setCustomId] = useState("")

  const fetchModels = () => {
    setLoading(true)
    modelsApi
      .list()
      .then((res) => setModels(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchModels()
  }, [])

  const toggleModel = (id: string) => {
    setModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_active: !m.is_active } : m))
    )
  }

  const addCustomModel = () => {
    const id = customId.trim()
    if (!id) return
    if (models.some((m) => m.id === id)) {
      setMessage("Model already in list")
      return
    }
    setModels((prev) => [
      ...prev,
      {
        id,
        name: id.split("/").pop() || id,
        provider: id.split("/")[0] || "Custom",
        description: "Custom model added by admin",
        is_active: true,
      },
    ])
    setCustomId("")
  }

  const handleSave = async () => {
    const activeModels = models.filter((m) => m.is_active).map((m) => m.id)
    if (activeModels.length < 1) {
      setMessage("At least 1 model must be active")
      return
    }

    setSaving(true)
    setMessage("")
    try {
      const res = await modelsApi.update(activeModels)
      setMessage(res.data.message)
      fetchModels()
    } catch (e) {
      setMessage("Error saving models")
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const activeCount = models.filter((m) => m.is_active).length

  // Group by provider
  const providers: Record<string, LLMModel[]> = {}
  for (const m of models) {
    const p = m.provider
    if (!providers[p]) providers[p] = []
    providers[p].push(m)
  }

  if (loading) return <p className="text-text-muted">Loading models...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">LLM Models</h1>
          <p className="text-sm text-text-muted mt-1">
            Select which models participate in consensus analysis.{" "}
            <span className="text-accent font-medium">
              {activeCount} active
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {message && <span className="text-xs text-accent">{message}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Add custom model */}
      <Card className="flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-xs text-text-muted mb-1">
            Add Custom Model (OpenRouter model ID)
          </label>
          <input
            type="text"
            value={customId}
            onChange={(e) => setCustomId(e.target.value)}
            placeholder="e.g. provider/model-name"
            onKeyDown={(e) => e.key === "Enter" && addCustomModel()}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
          />
        </div>
        <button
          onClick={addCustomModel}
          disabled={!customId.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-30"
        >
          <Plus size={14} /> Add
        </button>
      </Card>

      {/* Models by provider */}
      {Object.entries(providers).map(([provider, providerModels]) => (
        <Card key={provider}>
          <h2 className="text-sm font-semibold text-text-secondary mb-3">
            {provider}
          </h2>
          <div className="space-y-1">
            {providerModels.map((model) => (
              <div
                key={model.id}
                className={`flex items-center justify-between p-3 rounded-md transition-colors cursor-pointer ${
                  model.is_active
                    ? "bg-accent/5 border border-accent/20"
                    : "bg-background border border-transparent hover:border-border-hover"
                }`}
                onClick={() => toggleModel(model.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{model.name}</span>
                    {model.is_active && (
                      <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {model.description}
                  </p>
                  <code className="text-[10px] text-text-muted font-mono">
                    {model.id}
                  </code>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleModel(model.id)
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                    model.is_active ? "bg-accent" : "bg-border-hover"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform mt-0.5 ${
                      model.is_active ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
