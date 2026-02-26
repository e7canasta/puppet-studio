"""
lib/analytics/hub.py

Base class for Expert Mesh specialists.
Each specialist connects to the bridge as a normal WebSocket client,
listens to the stream, and emits transformed patches back.

Usage:
    class MySpecialist(SpecialistSubscriber):
        async def process(self, message: dict) -> dict | None:
            if message.get("kind") != "bridge_scene_patch":
                return None
            # ... transform data
            return {"kind": "scene_patch", "sceneId": self.scene_id, "patch": {...}}

    asyncio.run(MySpecialist(bridge_url, scene_id, "my-specialist").reconnect())
"""

from __future__ import annotations

import asyncio
import json
import logging
from abc import ABC, abstractmethod
from typing import Optional

import websockets
from websockets.exceptions import ConnectionClosed, WebSocketException

logger = logging.getLogger(__name__)


class SpecialistSubscriber(ABC):
    """
    Abstract base class for all Expert Mesh specialists.

    Handles:
      - WebSocket connection lifecycle
      - scene_subscribe handshake
      - wait_for_scene_ready (protocolar — no sleep hacks)
      - Echo filtering via fromClientId
      - Message loop
      - Reconnect with exponential backoff

    Subclasses implement only: process(message) -> patch | None
    """

    def __init__(self, bridge_url: str, scene_id: str, name: str):
        self.bridge_url = bridge_url
        self.scene_id = scene_id
        self.name = name
        self._ws = None
        self._running = False
        self._client_id: int | None = None

    # ──────────────────────────────────────────────
    # Abstract — subclasses implement this only
    # ──────────────────────────────────────────────

    @abstractmethod
    async def process(self, message: dict) -> Optional[dict]:
        """
        Process an incoming bridge_* message.

        Args:
            message: Parsed JSON dict from the bridge.

        Returns:
            A patch dict to emit back to the bridge, or None to skip.
            If returning a dict, it must include 'kind' and 'sceneId'.
        """
        pass

    # ──────────────────────────────────────────────
    # Network lifecycle (do not override unless needed)
    # ──────────────────────────────────────────────

    async def connect(self) -> None:
        """Open WebSocket connection to the bridge."""
        self._ws = await websockets.connect(self.bridge_url)
        logger.info(f"[{self.name}] connected to {self.bridge_url}")

    async def subscribe(self) -> None:
        """Send scene_subscribe to the bridge."""
        await self._send({"kind": "scene_subscribe", "sceneId": self.scene_id})
        logger.debug(f"[{self.name}] subscribed to scene {self.scene_id!r}")

    async def wait_for_scene_ready(self, timeout: float = 10.0) -> None:
        """
        Wait for bridge_hello or bridge_scene_snapshot before processing.
        Protocolar handshake — no sleep hacks.

        Captures clientId from bridge_hello for echo filtering.

        Raises:
            TimeoutError: If no ready signal is received within timeout,
                          or if the connection closes before a ready signal.
        """
        try:
            async with asyncio.timeout(timeout):
                async for raw in self._ws:
                    msg = json.loads(raw)
                    kind = msg.get("kind", "")
                    # Capture our clientId from bridge_hello
                    if kind == "bridge_hello":
                        self._client_id = msg.get("clientId")
                        logger.info(
                            f"[{self.name}] assigned clientId={self._client_id}"
                        )
                    if kind in ("bridge_hello", "bridge_scene_snapshot"):
                        logger.info(
                            f"[{self.name}] scene ready — starting processing"
                        )
                        return
        except TimeoutError:
            pass  # fall through to raise below

        raise TimeoutError(
            f"[{self.name}] scene not ready after {timeout}s. "
            f"Is the bridge running at {self.bridge_url}?"
        )

    async def emit(self, patch: dict) -> None:
        """Emit a patch back to the bridge as a regular client message."""
        if self._ws and self._ws.open:
            await self._send(patch)

    async def run(self) -> None:
        """
        Full lifecycle: connect → subscribe → wait_ready → message loop.
        Exits cleanly on ConnectionClosed.
        """
        self._running = True
        await self.connect()
        await self.subscribe()
        await self.wait_for_scene_ready()

        async for raw in self._ws:
            if not self._running:
                break
            try:
                message = json.loads(raw)
                # Skip own echoes — fromClientId is in all bridge_* messages
                if message.get("fromClientId") == self._client_id:
                    continue
                result = await self.process(message)
                if result is not None:
                    await self.emit(result)
            except json.JSONDecodeError as e:
                logger.warning(f"[{self.name}] invalid JSON from bridge: {e}")
            except Exception as e:
                logger.error(
                    f"[{self.name}] process() error: {e}", exc_info=True
                )

    async def reconnect(self, max_retries: int = 0) -> None:
        """
        Run with exponential backoff reconnection.

        Args:
            max_retries: 0 = infinite retries (recommended for production).
        """
        attempt = 0
        while max_retries == 0 or attempt < max_retries:
            try:
                await self.run()
                # run() returned cleanly (self._running = False)
                return
            except (ConnectionClosed, WebSocketException, OSError) as e:
                attempt += 1
                delay = min(2 ** min(attempt, 6), 60)  # cap at 60s
                logger.warning(
                    f"[{self.name}] disconnected ({e}). "
                    f"Reconnecting in {delay}s (attempt {attempt})"
                )
                await asyncio.sleep(delay)
            except Exception as e:
                logger.error(
                    f"[{self.name}] unexpected error: {e}", exc_info=True
                )
                attempt += 1
                await asyncio.sleep(5)

        logger.error(
            f"[{self.name}] max retries ({max_retries}) reached. Giving up."
        )

    def stop(self) -> None:
        """Signal the run loop to stop cleanly."""
        self._running = False

    # ──────────────────────────────────────────────
    # Private helpers
    # ──────────────────────────────────────────────

    async def _send(self, payload: dict) -> None:
        """Send a JSON payload to the bridge."""
        try:
            await self._ws.send(json.dumps(payload))
        except (ConnectionClosed, WebSocketException) as e:
            logger.warning(f"[{self.name}] send failed: {e}")
            raise
