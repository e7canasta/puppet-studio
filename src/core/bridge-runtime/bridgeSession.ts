type BridgeStatus = 'connected' | 'connecting' | 'disconnected'

export type BridgeSessionLifecycleEvent =
  | {
      kind: 'connected'
      url: string
    }
  | {
      kind: 'connecting'
      url: string
    }
  | {
      kind: 'disconnected'
      url: string
      willReconnect: boolean
    }
  | {
      kind: 'inbound_json_invalid'
      url: string
    }
  | {
      kind: 'reconnect_scheduled'
      delayMs: number
      url: string
    }
  | {
      kind: 'scene_subscribe_sent'
      sceneId: string
      url: string
    }
  | {
      kind: 'socket_create_error'
      message: string
      url: string
    }
  | {
      kind: 'socket_error'
      url: string
    }

export type BridgeSessionWebSocketLike = {
  close: () => void
  onclose: ((event: unknown) => void) | null
  onerror: ((event: unknown) => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
  onopen: ((event: unknown) => void) | null
  readyState: number
  send: (data: string) => void
}

export type BridgeSessionOptions = {
  clearTimeoutFn?: (token: unknown) => void
  createSocket?: (url: string) => BridgeSessionWebSocketLike
  onError?: (error: string | null) => void
  onInboundPayload?: (payload: unknown) => void
  onLifecycle?: (event: BridgeSessionLifecycleEvent) => void
  onStatus?: (status: BridgeStatus) => void
  reconnectMs?: number
  setTimeoutFn?: (callback: () => void, delayMs: number) => unknown
}

const OPEN_READY_STATE = 1
const DEFAULT_RECONNECT_MS = 1200

function normalizeSceneId(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function detachSocketHandlers(socket: BridgeSessionWebSocketLike) {
  socket.onclose = null
  socket.onerror = null
  socket.onmessage = null
  socket.onopen = null
}

export class BridgeSession {
  private enabled = false
  private reconnectToken: unknown = null
  private sceneId: string | null = null
  private socket: BridgeSessionWebSocketLike | null = null
  private status: BridgeStatus = 'disconnected'
  private subscribedSceneId: string | null = null
  private url = ''
  private readonly clearTimeoutFn: (token: unknown) => void
  private readonly createSocket: (url: string) => BridgeSessionWebSocketLike
  private readonly onError?: (error: string | null) => void
  private readonly onInboundPayload?: (payload: unknown) => void
  private readonly onLifecycle?: (event: BridgeSessionLifecycleEvent) => void
  private readonly onStatus?: (status: BridgeStatus) => void
  private readonly reconnectMs: number
  private readonly setTimeoutFn: (callback: () => void, delayMs: number) => unknown

  constructor(options: BridgeSessionOptions = {}) {
    this.clearTimeoutFn = options.clearTimeoutFn ?? ((token) => globalThis.clearTimeout(token as number))
    this.createSocket =
      options.createSocket ??
      ((url) => {
        return new WebSocket(url) as unknown as BridgeSessionWebSocketLike
      })
    this.onError = options.onError
    this.onInboundPayload = options.onInboundPayload
    this.onLifecycle = options.onLifecycle
    this.onStatus = options.onStatus
    this.reconnectMs = Number.isFinite(options.reconnectMs) && (options.reconnectMs ?? 0) > 0 ? Number(options.reconnectMs) : DEFAULT_RECONNECT_MS
    this.setTimeoutFn = options.setTimeoutFn ?? ((callback, delayMs) => globalThis.setTimeout(callback, delayMs))
  }

  destroy() {
    this.setEnabled(false)
  }

  sendPayload(payload: Record<string, unknown>): boolean {
    if (!this.socket || this.socket.readyState !== OPEN_READY_STATE) return false
    this.socket.send(JSON.stringify(payload))
    return true
  }

  setEnabled(enabled: boolean) {
    if (this.enabled === enabled) return
    this.enabled = enabled
    if (enabled) {
      this.connect()
      return
    }
    this.clearReconnect()
    this.closeSocket()
    this.setStatus('disconnected')
  }

  setSceneId(sceneId: string) {
    const next = normalizeSceneId(sceneId)
    if (next === this.sceneId) return
    this.sceneId = next
    this.trySendSceneSubscribe()
  }

  setUrl(url: string) {
    const next = url.trim()
    if (next === this.url) return
    this.url = next
    if (!this.enabled) return
    if (!this.socket) {
      this.connect()
      return
    }
    this.clearReconnect()
    this.closeSocket()
    this.connect()
  }

  private clearReconnect() {
    if (this.reconnectToken === null) return
    this.clearTimeoutFn(this.reconnectToken)
    this.reconnectToken = null
  }

  private closeSocket() {
    if (!this.socket) return
    const current = this.socket
    this.socket = null
    detachSocketHandlers(current)
    this.subscribedSceneId = null
    current.close()
  }

  private connect() {
    if (!this.enabled) return
    if (!this.url) {
      this.setStatus('disconnected')
      this.onError?.('Bridge URL vacia')
      return
    }
    if (this.socket) return
    this.clearReconnect()
    this.setStatus('connecting')
    this.onError?.(null)
    this.onLifecycle?.({
      kind: 'connecting',
      url: this.url,
    })

    let socket: BridgeSessionWebSocketLike
    try {
      socket = this.createSocket(this.url)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear WebSocket'
      this.onError?.(message)
      this.setStatus('disconnected')
      this.onLifecycle?.({
        kind: 'socket_create_error',
        message,
        url: this.url,
      })
      this.scheduleReconnect()
      return
    }

    this.socket = socket
    this.subscribedSceneId = null

    socket.onopen = () => {
      if (this.socket !== socket) return
      this.setStatus('connected')
      this.onError?.(null)
      this.onLifecycle?.({
        kind: 'connected',
        url: this.url,
      })
      this.trySendSceneSubscribe()
    }

    socket.onmessage = (event) => {
      let payload: unknown
      try {
        payload = JSON.parse(String(event.data))
      } catch {
        this.onLifecycle?.({
          kind: 'inbound_json_invalid',
          url: this.url,
        })
        return
      }
      this.onInboundPayload?.(payload)
    }

    socket.onerror = () => {
      this.onError?.('Error de socket con el bridge')
      this.onLifecycle?.({
        kind: 'socket_error',
        url: this.url,
      })
    }

    socket.onclose = () => {
      if (this.socket !== socket) return
      this.socket = null
      this.subscribedSceneId = null
      this.setStatus('disconnected')
      this.onLifecycle?.({
        kind: 'disconnected',
        url: this.url,
        willReconnect: this.enabled,
      })
      if (this.enabled) {
        this.scheduleReconnect()
      }
    }
  }

  private scheduleReconnect() {
    if (!this.enabled) return
    if (this.reconnectToken !== null) return
    this.reconnectToken = this.setTimeoutFn(() => {
      this.reconnectToken = null
      this.connect()
    }, this.reconnectMs)
    this.onLifecycle?.({
      kind: 'reconnect_scheduled',
      delayMs: this.reconnectMs,
      url: this.url,
    })
  }

  private setStatus(next: BridgeStatus) {
    if (this.status === next) return
    this.status = next
    this.onStatus?.(next)
  }

  private trySendSceneSubscribe() {
    if (!this.sceneId) return false
    if (!this.socket || this.socket.readyState !== OPEN_READY_STATE) return false
    if (this.subscribedSceneId === this.sceneId) return false
    const payload = {
      kind: 'scene_subscribe',
      sceneId: this.sceneId,
    }
    const sent = this.sendPayload(payload)
    if (!sent) return false
    this.subscribedSceneId = this.sceneId
    this.onLifecycle?.({
      kind: 'scene_subscribe_sent',
      sceneId: this.sceneId,
      url: this.url,
    })
    return true
  }
}
