import i18n from '../i18n'
import { useAgentStore } from '../stores/agent-store'
import { useModelConfigStore } from '../stores/model-config-store'
import { exportAsMarkdown, exportAsJSON } from './export-chat'
import { toast } from './toast'

export interface CommandDef {
  name: string
  description: string
  usage?: string
  execute: (args: string) => string | void
}

function t(key: string, opts?: Record<string, unknown>) {
  return i18n.t(key, opts) as string
}

export function getCommands(): CommandDef[] {
  return [
    {
      name: '/compact',
      description: t('commands.compactDesc'),
      execute: () => {
        const store = useAgentStore.getState()
        const { activeSessionId } = store
        if (!activeSessionId) return t('commands.noActiveSession')
        const messages = store.sessions.get(activeSessionId) || []
        const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0)
        return t('commands.compactResult', {
          count: messages.length,
          chars: totalChars.toLocaleString(),
        })
      },
    },
    {
      name: '/clear',
      description: t('commands.clearDesc'),
      execute: () => {
        const store = useAgentStore.getState()
        const { activeSessionId, sessionMetas } = store
        if (!activeSessionId) return t('commands.noActiveSession')
        const sessions = new Map(store.sessions)
        const metas = new Map(sessionMetas)
        sessions.set(activeSessionId, [])
        const meta = metas.get(activeSessionId)
        if (meta) {
          metas.set(activeSessionId, { ...meta, messageCount: 0, updatedAt: Date.now() })
        }
        useAgentStore.setState({ sessions, sessionMetas: metas })
        return t('commands.cleared')
      },
    },
    {
      name: '/context',
      description: t('commands.contextDesc'),
      execute: () => {
        const store = useAgentStore.getState()
        const { activeSessionId, currentModel } = store
        if (!activeSessionId) return t('commands.noActiveSession')
        const messages = store.sessions.get(activeSessionId) || []
        const userMsgs = messages.filter((m) => m.role === 'user').length
        const assistantMsgs = messages.filter((m) => m.role === 'assistant').length
        const toolMsgs = messages.filter((m) => m.role === 'tool').length
        const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0)
        return [
          `${t('commands.contextModel')}: ${currentModel.id}`,
          `${t('commands.contextMessages')}: ${messages.length} (${t('commands.contextUser')}: ${userMsgs}, ${t('commands.contextAssistant')}: ${assistantMsgs}, ${t('commands.contextTool')}: ${toolMsgs})`,
          `${t('commands.contextChars')}: ${totalChars.toLocaleString()}`,
          `${t('commands.contextMax')}: 300`,
        ].join('\n')
      },
    },
    {
      name: '/model',
      description: t('commands.modelDesc'),
      usage: '/model [model-id]',
      execute: (args) => {
        const store = useAgentStore.getState()
        const modelId = args.trim()
        if (!modelId) {
          const configStore = useModelConfigStore.getState()
          const providers = configStore.providers
          const allModels = providers.flatMap((p) =>
            p.models.filter((m) => m.visible !== false).map((m) => `  ${m.id} (${p.name})`),
          )
          return [
            `${t('commands.currentModel')}: ${store.currentModel.id}`,
            '',
            t('commands.availableModels'),
            ...allModels,
          ].join('\n')
        }
        const configStore = useModelConfigStore.getState()
        const providers = configStore.providers
        for (const provider of providers) {
          const model = provider.models.find((m) => m.id === modelId)
          if (model) {
            store.switchModel({ id: modelId, provider: provider.id })
            return t('commands.modelSwitched', { model: modelId })
          }
        }
        return t('commands.modelNotFound', { model: modelId })
      },
    },
    {
      name: '/export',
      description: t('commands.exportDesc'),
      usage: '/export [md|json]',
      execute: (args) => {
        const store = useAgentStore.getState()
        const { activeSessionId, sessionMetas } = store
        if (!activeSessionId) return t('commands.noActiveSession')
        const messages = store.sessions.get(activeSessionId) || []
        if (messages.length === 0) return t('commands.noMessages')
        const title = sessionMetas.get(activeSessionId)?.title || 'chat'
        const format = args.trim().toLowerCase()
        if (format === 'json') {
          exportAsJSON(messages, title)
        } else {
          exportAsMarkdown(messages, title)
        }
        toast.success(t('chat.chatExported'))
        return t('commands.exportDone')
      },
    },
    {
      name: '/memory',
      description: t('commands.memoryDesc'),
      execute: () => {
        window.dispatchEvent(new CustomEvent('open-settings', { detail: { tab: 'memory' } }))
        return t('commands.memoryOpened')
      },
    },
    {
      name: '/help',
      description: t('commands.helpDesc'),
      execute: () => {
        const commands = getCommands()
        const lines = commands.map((cmd) => {
          const usage = cmd.usage ? ` ${cmd.usage}` : ''
          return `  ${cmd.name}${usage} — ${cmd.description}`
        })
        return [t('commands.availableCommands'), '', ...lines].join('\n')
      },
    },
  ]
}

export function isCommand(input: string): boolean {
  return input.trim().startsWith('/')
}

export function parseCommand(input: string): { name: string; args: string } {
  const trimmed = input.trim()
  const spaceIndex = trimmed.indexOf(' ')
  if (spaceIndex === -1) return { name: trimmed, args: '' }
  return { name: trimmed.slice(0, spaceIndex), args: trimmed.slice(spaceIndex + 1) }
}

export function executeCommand(input: string): string | void {
  const { name, args } = parseCommand(input)
  const commands = getCommands()
  const cmd = commands.find((c) => c.name === name)
  if (!cmd) return t('commands.unknownCommand', { command: name })
  return cmd.execute(args)
}

export function filterCommands(query: string): CommandDef[] {
  const commands = getCommands()
  if (!query || query === '/') return commands
  const lower = query.toLowerCase()
  return commands.filter(
    (cmd) => cmd.name.toLowerCase().startsWith(lower) || cmd.description.toLowerCase().includes(lower),
  )
}
