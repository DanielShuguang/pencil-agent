import type { Message } from '../stores/agent-store'

export function exportAsMarkdown(messages: Message[], title: string) {
  const lines = [`# ${title}\n`]
  for (const msg of messages) {
    const role = msg.role === 'user' ? '👤 User' : msg.role === 'assistant' ? '🤖 Assistant' : msg.role
    lines.push(`## ${role}\n`)
    lines.push(`${msg.content  }\n`)
  }
  downloadBlob(lines.join('\n'), `${title}.md`, 'text/markdown')
}

export function exportAsJSON(messages: Message[], title: string) {
  const data = {
    title,
    exportedAt: new Date().toISOString(),
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    })),
  }
  downloadBlob(JSON.stringify(data, null, 2), `${title}.json`, 'application/json')
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
