import { useEffect, useRef } from 'react'

import { usePoseStore } from '../../../app/state'
import {
  applyBridgeStateActions,
  BridgeSession,
  mapParsedBridgeInboundToActions,
  parseBridgeInboundMessage,
  setBridgeOutboundObserver,
  setBridgeOutboundSender,
} from '../../../core/bridge-runtime'
import { inferSceneEventSource, summarizeSceneEvent } from '../../../core/observability'
import { toBridgeLifecycleSceneEvent } from '../model'

const RECONNECT_MS = 1200

export function useBridgePoseListener() {
  const bridgeEnabled = usePoseStore((state) => state.bridgeEnabled)
  const bridgeUrl = usePoseStore((state) => state.bridgeUrl)
  const sceneId = usePoseStore((state) => state.sceneId)
  const sessionRef = useRef<BridgeSession | null>(null)
  const previousEnabledRef = useRef<boolean | null>(null)

  useEffect(() => {
    const appendEvent = usePoseStore.getState().appendSceneEvent
    const session = new BridgeSession({
      onError: (error) => {
        usePoseStore.getState().setBridgeError(error)
      },
      onInboundPayload: (payload) => {
        const parsed = parseBridgeInboundMessage(payload)
        if (parsed.type === 'invalid') {
          appendEvent({
            kind: 'bridge_inbound_invalid',
            level: 'warn',
            source: 'bridge.inbound',
            summary: `invalid inbound: ${parsed.reason}`,
          })
          return
        }

        const eventKind =
          parsed.type === 'scene_patch' || parsed.type === 'scene_snapshot' ? parsed.rawKind : parsed.kind

        appendEvent({
          kind: eventKind || 'bridge_message',
          level: parsed.type === 'bridge_error' ? 'error' : 'info',
          message: parsed.message,
          source: inferSceneEventSource(eventKind, parsed.message, 'bridge.inbound'),
          summary: `in ${summarizeSceneEvent(eventKind, parsed.message)}`,
        })

        const actions = mapParsedBridgeInboundToActions(parsed)
        if (actions.length <= 0) return
        applyBridgeStateActions(usePoseStore.getState(), actions)
      },
      onLifecycle: (event) => {
        appendEvent(toBridgeLifecycleSceneEvent(event))
      },
      onStatus: (status) => {
        usePoseStore.getState().setBridgeStatus(status)
      },
      reconnectMs: RECONNECT_MS,
    })
    sessionRef.current = session

    setBridgeOutboundObserver((payload, sent) => {
      const kind = typeof payload.kind === 'string' ? payload.kind : 'bridge_outbound'
      appendEvent({
        kind,
        level: sent ? 'info' : 'warn',
        message: payload,
        source: inferSceneEventSource(kind, payload, 'frontend.outbound'),
        summary: `${sent ? 'out' : 'out(drop)'} ${summarizeSceneEvent(kind, payload)}`,
      })
    })
    setBridgeOutboundSender((payload) => session.sendPayload(payload))

    return () => {
      session.destroy()
      sessionRef.current = null
      previousEnabledRef.current = null
      setBridgeOutboundObserver(null)
      setBridgeOutboundSender(null)
      usePoseStore.getState().setBridgeStatus('disconnected')
    }
  }, [])

  useEffect(() => {
    const session = sessionRef.current
    if (!session) return

    session.setSceneId(sceneId)
    session.setUrl(bridgeUrl)

    if (!bridgeEnabled) {
      session.setEnabled(false)
      if (previousEnabledRef.current !== false) {
        usePoseStore.getState().appendSceneEvent({
          kind: 'bridge_disabled',
          level: 'info',
          source: 'bridge.lifecycle',
          summary: 'bridge disabled from frontend',
        })
      }
      previousEnabledRef.current = false
      return
    }

    session.setEnabled(true)
    previousEnabledRef.current = true
  }, [bridgeEnabled, bridgeUrl, sceneId])
}
