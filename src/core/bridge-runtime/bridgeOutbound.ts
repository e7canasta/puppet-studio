type BridgeSender = (payload: Record<string, unknown>) => boolean
type BridgeOutboundObserver = (payload: Record<string, unknown>, sent: boolean) => void

let sender: BridgeSender | null = null
let observer: BridgeOutboundObserver | null = null

export function setBridgeOutboundSender(next: BridgeSender | null) {
  sender = next
}

export function setBridgeOutboundObserver(next: BridgeOutboundObserver | null) {
  observer = next
}

export function sendBridgePayload(payload: Record<string, unknown>): boolean {
  const sent = sender ? sender(payload) : false
  observer?.(payload, sent)
  return sent
}
