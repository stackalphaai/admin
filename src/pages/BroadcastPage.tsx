import { useState, type FormEvent } from "react"
import { broadcastApi } from "@/services/api"
import { Card } from "@/components/Card"
import { Send } from "lucide-react"

export function BroadcastPage() {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState("")

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    if (!confirm("Send this message to ALL connected Telegram users?")) return

    setSending(true)
    setResult("")
    try {
      const res = await broadcastApi.send(message.trim())
      setResult(res.data.message || "Broadcast sent")
      setMessage("")
    } catch (e) {
      setResult("Error sending broadcast")
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Broadcast</h1>
      <p className="text-sm text-text-muted">
        Send a message to all users with connected Telegram bots.
      </p>

      <Card className="max-w-xl">
        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Type your broadcast message..."
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              <Send size={14} />
              {sending ? "Sending..." : "Send Broadcast"}
            </button>
            {result && (
              <span className="text-xs text-text-muted">{result}</span>
            )}
          </div>
        </form>
      </Card>
    </div>
  )
}
