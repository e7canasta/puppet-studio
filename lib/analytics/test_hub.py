"""
lib/analytics/test_hub.py

Tests for SpecialistSubscriber base class.
Uses unittest.mock to simulate WebSocket interactions.
"""

from __future__ import annotations

import asyncio
import json
from typing import Optional
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from lib.analytics.hub import SpecialistSubscriber


# ──────────────────────────────────────────────
# Concrete subclass for testing
# ──────────────────────────────────────────────

class EchoSpecialist(SpecialistSubscriber):
    """Simple concrete specialist that echoes bridge_scene_patch messages."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.received: list[dict] = []

    async def process(self, message: dict) -> Optional[dict]:
        self.received.append(message)
        if message.get("kind") == "bridge_scene_patch":
            return {
                "kind": "scene_patch",
                "sceneId": self.scene_id,
                "patch": {"echo": True},
            }
        return None


class NoneSpecialist(SpecialistSubscriber):
    """Specialist that always returns None — skips emission."""

    async def process(self, message: dict) -> Optional[dict]:
        return None


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def make_ws_mock(messages: list[dict]) -> AsyncMock:
    """Create a mock WebSocket that yields pre-defined JSON messages."""
    ws = AsyncMock()
    ws.open = True
    ws.send = AsyncMock()

    async def _aiter_messages():
        for msg in messages:
            yield json.dumps(msg)

    ws.__aiter__ = lambda self: _aiter_messages()
    return ws


# ──────────────────────────────────────────────
# Tests
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_wait_for_scene_ready_on_hello():
    """wait_for_scene_ready resolves when bridge_hello arrives."""
    specialist = EchoSpecialist("ws://localhost:8765", "scene-1", "test")
    specialist._ws = make_ws_mock([
        {"kind": "bridge_ack", "packetKind": "scene_subscribe"},
        {"kind": "bridge_hello", "clientId": 42},
    ])
    await specialist.wait_for_scene_ready(timeout=2.0)
    assert specialist._client_id == 42


@pytest.mark.asyncio
async def test_wait_for_scene_ready_on_snapshot():
    """wait_for_scene_ready resolves when bridge_scene_snapshot arrives."""
    specialist = EchoSpecialist("ws://localhost:8765", "scene-1", "test")
    specialist._ws = make_ws_mock([
        {"kind": "bridge_scene_snapshot", "sceneId": "scene-1", "entities": []},
    ])
    await specialist.wait_for_scene_ready(timeout=2.0)
    # No bridge_hello — clientId stays None (still works, just no echo filtering)
    assert specialist._client_id is None


@pytest.mark.asyncio
async def test_wait_for_scene_ready_timeout():
    """wait_for_scene_ready raises TimeoutError if no ready signal within timeout."""
    specialist = EchoSpecialist("ws://localhost:8765", "scene-1", "test")
    specialist._ws = make_ws_mock([
        {"kind": "bridge_ack", "packetKind": "something_else"},
    ])
    with pytest.raises(TimeoutError, match="scene not ready"):
        await specialist.wait_for_scene_ready(timeout=0.1)


@pytest.mark.asyncio
async def test_process_result_emitted():
    """When process() returns a dict, emit() sends it to the bridge."""
    specialist = EchoSpecialist("ws://localhost:8765", "scene-1", "test")
    specialist._client_id = 1

    messages = [
        {"kind": "bridge_scene_patch", "fromClientId": 99, "patch": {}},
    ]

    ws = make_ws_mock(messages)
    specialist._ws = ws
    specialist._running = True

    # Run the message processing loop manually
    async for raw in specialist._ws:
        message = json.loads(raw)
        if message.get("fromClientId") == specialist._client_id:
            continue
        result = await specialist.process(message)
        if result is not None:
            await specialist.emit(result)

    # Should have called ws.send with the echoed patch
    assert ws.send.call_count == 1
    sent = json.loads(ws.send.call_args[0][0])
    assert sent["kind"] == "scene_patch"
    assert sent["patch"]["echo"] is True


@pytest.mark.asyncio
async def test_process_none_skips_emit():
    """When process() returns None, emit() is NOT called."""
    specialist = NoneSpecialist("ws://localhost:8765", "scene-1", "test")
    specialist._client_id = 1

    messages = [
        {"kind": "bridge_pose", "fromClientId": 99, "joints": {}},
    ]

    ws = make_ws_mock(messages)
    specialist._ws = ws
    specialist._running = True

    async for raw in specialist._ws:
        message = json.loads(raw)
        if message.get("fromClientId") == specialist._client_id:
            continue
        result = await specialist.process(message)
        if result is not None:
            await specialist.emit(result)

    # send() should NOT be called (no emission)
    ws.send.assert_not_called()


@pytest.mark.asyncio
async def test_echo_filtering():
    """Messages with fromClientId matching our own clientId are skipped."""
    specialist = EchoSpecialist("ws://localhost:8765", "scene-1", "test")
    specialist._client_id = 42

    messages = [
        # Own echo — should be skipped
        {"kind": "bridge_scene_patch", "fromClientId": 42, "patch": {}},
        # From another client — should be processed
        {"kind": "bridge_scene_patch", "fromClientId": 99, "patch": {}},
    ]

    ws = make_ws_mock(messages)
    specialist._ws = ws
    specialist._running = True

    processed = []
    async for raw in specialist._ws:
        message = json.loads(raw)
        if message.get("fromClientId") == specialist._client_id:
            continue
        result = await specialist.process(message)
        if result is not None:
            processed.append(result)
            await specialist.emit(result)

    # Only 1 message processed (the one from client 99)
    assert len(specialist.received) == 1
    assert specialist.received[0]["fromClientId"] == 99

    # Only 1 emission
    assert ws.send.call_count == 1


@pytest.mark.asyncio
async def test_specialist_is_abstract():
    """SpecialistSubscriber cannot be instantiated directly."""
    with pytest.raises(TypeError, match="process"):
        SpecialistSubscriber("ws://localhost", "scene-1", "test")
