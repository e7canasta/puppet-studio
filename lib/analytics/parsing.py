"""
lib/analytics/parsing.py

Shared parsing utilities for Expert Mesh specialists.

Functions extracted from mock-client/cuboid_lift_listener.py to avoid
duplication between SpatialProjector (Fase B) and SceneCompositor (Fase C).
"""

from __future__ import annotations

import math
from typing import Any


# ──────────────────────────────────────────────
# Type-safe value converters
# ──────────────────────────────────────────────

def to_str(value: Any) -> str | None:
    """Convert to string if non-empty, else None."""
    if isinstance(value, str) and value.strip():
        return value
    return None


def to_float(value: Any, default: float | None = None) -> float | None:
    """Convert to float if finite, else default."""
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    if not math.isfinite(number):
        return default
    return number


def clamp01(value: float) -> float:
    """Clamp value to [0.0, 1.0]."""
    return max(0.0, min(1.0, value))


def angle_delta_deg(a: float, b: float) -> float:
    """Absolute shortest angular difference in degrees."""
    delta = (a - b + 180.0) % 360.0 - 180.0
    return abs(delta)


# ──────────────────────────────────────────────
# Protocol parsing — monitoring cameras
# ──────────────────────────────────────────────

def parse_monitoring_cameras(raw: Any) -> dict[str, dict[str, Any]]:
    """
    Parse monitoring camera definitions from bridge messages.

    Accepts both list and single-object inputs.
    Returns dict keyed by camera ID.

    Source: cuboid_lift_listener.py:78-99
    """
    source = raw if isinstance(raw, list) else [raw] if isinstance(raw, dict) else []
    cameras: dict[str, dict[str, Any]] = {}
    for entry in source:
        if not isinstance(entry, dict):
            continue
        camera_id = to_str(
            entry.get("id") or entry.get("cameraId") or entry.get("camera_id")
        )
        plan_position = entry.get("planPositionM")
        if not camera_id or not isinstance(plan_position, list) or len(plan_position) < 2:
            continue
        camera = {
            "id": camera_id,
            "planPositionM": [float(plan_position[0]), float(plan_position[1])],
            "heightM": to_float(
                entry.get("heightM") or entry.get("height") or entry.get("mountHeightM"),
                2.7,
            ),
            "yawDeg": to_float(entry.get("yawDeg") or entry.get("yaw"), 0.0),
            "pitchDeg": to_float(entry.get("pitchDeg") or entry.get("pitch"), -35.0),
            "rollDeg": to_float(entry.get("rollDeg") or entry.get("roll"), 0.0),
            "fovDeg": to_float(entry.get("fovDeg") or entry.get("fov"), 65.0),
            "aspectRatio": to_float(
                entry.get("aspectRatio") or entry.get("aspect"), 16.0 / 9.0
            ),
        }
        cameras[camera_id] = camera
    return cameras


# ──────────────────────────────────────────────
# Protocol parsing — detection overlays
# ──────────────────────────────────────────────

def parse_detection_overlays(raw: Any) -> list[dict[str, Any]]:
    """
    Parse camera detection overlays from bridge messages.

    Each overlay has a cameraId and a list of detection boxes.

    Source: cuboid_lift_listener.py:63-75
    """
    source = raw if isinstance(raw, list) else [raw] if isinstance(raw, dict) else []
    overlays: list[dict[str, Any]] = []
    for entry in source:
        if not isinstance(entry, dict):
            continue
        camera_id = to_str(
            entry.get("cameraId") or entry.get("camera_id") or entry.get("id")
        )
        boxes_raw = (
            entry.get("boxes")
            if isinstance(entry.get("boxes"), list)
            else entry.get("detections")
        )
        boxes = boxes_raw if isinstance(boxes_raw, list) else []
        if not camera_id:
            continue
        overlays.append({
            "cameraId": camera_id,
            "boxes": boxes,
            "timestamp": entry.get("timestamp"),
        })
    return overlays


# ──────────────────────────────────────────────
# Protocol parsing — entity map
# ──────────────────────────────────────────────

def parse_entity_map(raw_entities: Any) -> dict[str, dict[str, Any]]:
    """
    Build a lookup map from entities list, keyed by trackId/objectId/id.

    Source: cuboid_lift_listener.py:102-116
    """
    entities = raw_entities if isinstance(raw_entities, list) else []
    entity_map: dict[str, dict[str, Any]] = {}
    for entity in entities:
        if not isinstance(entity, dict):
            continue
        tokens = [
            to_str(entity.get("trackId") or entity.get("track_id")),
            to_str(entity.get("objectId") or entity.get("object_id")),
            to_str(entity.get("id")),
        ]
        for token in tokens:
            if token:
                entity_map[token] = entity
    return entity_map


# ──────────────────────────────────────────────
# Protocol parsing — message extraction
# ──────────────────────────────────────────────

def extract_metadata_and_scene(
    message: dict[str, Any],
) -> tuple[str | None, dict[str, Any] | None, list[Any] | None, list[Any] | None]:
    """
    Extract metadata, entities/upserts, and removes from bridge messages.

    Returns (scene_id, metadata, entity_like, removes).

    Source: cuboid_lift_listener.py:293-306
    """
    kind = to_str(message.get("kind"))
    scene_id = to_str(message.get("sceneId") or message.get("scene_id"))

    if kind == "bridge_scene_snapshot":
        metadata = (
            message.get("metadata")
            if isinstance(message.get("metadata"), dict)
            else None
        )
        entities = (
            message.get("entities")
            if isinstance(message.get("entities"), list)
            else None
        )
        return scene_id, metadata, entities, None

    if kind == "bridge_scene_patch":
        patch = (
            message.get("patch")
            if isinstance(message.get("patch"), dict)
            else None
        )
        metadata = (
            patch.get("metadata")
            if isinstance(patch, dict) and isinstance(patch.get("metadata"), dict)
            else None
        )
        upserts = (
            patch.get("upserts")
            if isinstance(patch, dict) and isinstance(patch.get("upserts"), list)
            else None
        )
        removes = (
            patch.get("removes")
            if isinstance(patch, dict) and isinstance(patch.get("removes"), list)
            else None
        )
        return scene_id, metadata, upserts, removes

    return None, None, None, None
