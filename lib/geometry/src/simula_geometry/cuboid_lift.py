#!/usr/bin/env python3
"""
2.5D cuboid lifting from camera subplane detections.

Given:
- one calibrated camera (position + yaw/pitch/roll + fov + aspect),
- one 2D detection (bbox and/or anchorUV),
- known object dimensions (width/depth/height),

estimate a plausible 3D cuboid pose on the floor plane.

Assumptions:
- single camera
- object support plane is floor (world Y = floorY)
- object base stays parallel to floor (no pitch/roll)
- anchorUV corresponds to bottom-center of the detection by default
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any


def clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def deg_to_rad(value_deg: float) -> float:
    return value_deg * math.pi / 180.0


def dot(a: tuple[float, float, float], b: tuple[float, float, float]) -> float:
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def cross(a: tuple[float, float, float], b: tuple[float, float, float]) -> tuple[float, float, float]:
    return (
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    )


def normalize(v: tuple[float, float, float]) -> tuple[float, float, float]:
    length = math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
    if length <= 1e-9:
        return (0.0, 0.0, 0.0)
    return (v[0] / length, v[1] / length, v[2] / length)


def vector_add(a: tuple[float, float, float], b: tuple[float, float, float]) -> tuple[float, float, float]:
    return (a[0] + b[0], a[1] + b[1], a[2] + b[2])


def vector_scale(v: tuple[float, float, float], scalar: float) -> tuple[float, float, float]:
    return (v[0] * scalar, v[1] * scalar, v[2] * scalar)


def rotate_around_axis(
    vec: tuple[float, float, float],
    axis: tuple[float, float, float],
    angle_rad: float,
) -> tuple[float, float, float]:
    """
    Rodrigues rotation formula.
    """
    k = normalize(axis)
    c = math.cos(angle_rad)
    s = math.sin(angle_rad)
    k_cross_v = cross(k, vec)
    k_dot_v = dot(k, vec)
    term1 = vector_scale(vec, c)
    term2 = vector_scale(k_cross_v, s)
    term3 = vector_scale(k, k_dot_v * (1.0 - c))
    return vector_add(vector_add(term1, term2), term3)


def get_number(source: dict[str, Any], keys: list[str], default: float | None = None) -> float | None:
    for key in keys:
        if key in source:
            try:
                value = float(source[key])
            except Exception:
                continue
            if math.isfinite(value):
                return value
    return default


def parse_anchor_uv(detection: dict[str, Any]) -> tuple[float, float]:
    raw_anchor = detection.get("anchorUV") or detection.get("anchor_uv") or detection.get("footpointUV") or detection.get("footpoint_uv")
    if isinstance(raw_anchor, list) and len(raw_anchor) >= 2:
        try:
            return (clamp01(float(raw_anchor[0])), clamp01(float(raw_anchor[1])))
        except Exception:
            pass
    if isinstance(raw_anchor, dict):
        try:
            u = float(raw_anchor.get("u", raw_anchor.get("x")))
            v = float(raw_anchor.get("v", raw_anchor.get("y")))
            if math.isfinite(u) and math.isfinite(v):
                return (clamp01(u), clamp01(v))
        except Exception:
            pass

    x = get_number(detection, ["x", "left"], 0.0) or 0.0
    y = get_number(detection, ["y", "top"], 0.0) or 0.0
    width = get_number(detection, ["width", "w"], 0.0) or 0.0
    height = get_number(detection, ["height", "h"], 0.0) or 0.0
    return (clamp01(x + width * 0.5), clamp01(y + height))


def parse_bbox(detection: dict[str, Any]) -> dict[str, float]:
    x = clamp01(get_number(detection, ["x", "left"], 0.0) or 0.0)
    y = clamp01(get_number(detection, ["y", "top"], 0.0) or 0.0)
    width = clamp01(get_number(detection, ["width", "w"], 0.0) or 0.0)
    height = clamp01(get_number(detection, ["height", "h"], 0.0) or 0.0)
    return {"x": x, "y": y, "width": width, "height": height}


def camera_basis(camera: dict[str, Any]) -> tuple[tuple[float, float, float], tuple[float, float, float], tuple[float, float, float]]:
    yaw_deg = get_number(camera, ["yawDeg", "yaw"], 0.0) or 0.0
    pitch_deg = get_number(camera, ["pitchDeg", "pitch"], -35.0) or -35.0
    roll_deg = get_number(camera, ["rollDeg", "roll"], 0.0) or 0.0

    yaw = deg_to_rad(yaw_deg)
    pitch = deg_to_rad(pitch_deg)
    forward = normalize((math.sin(yaw) * math.cos(pitch), math.sin(pitch), math.cos(yaw) * math.cos(pitch)))
    right = normalize((math.cos(yaw), 0.0, -math.sin(yaw)))
    up = normalize(cross(forward, right))

    if abs(roll_deg) > 1e-7:
        roll = deg_to_rad(roll_deg)
        right = normalize(rotate_around_axis(right, forward, roll))
        up = normalize(rotate_around_axis(up, forward, roll))

    return (right, up, forward)


def camera_origin(camera: dict[str, Any]) -> tuple[float, float, float]:
    plan_position = camera.get("planPositionM")
    if not isinstance(plan_position, list) or len(plan_position) < 2:
        raise ValueError("camera.planPositionM invalido; se esperaba [x,z]")
    x = float(plan_position[0])
    z = float(plan_position[1])
    y = get_number(camera, ["heightM", "height", "mountHeightM"], 2.7) or 2.7
    return (x, y, z)


def ray_from_uv(
    camera: dict[str, Any],
    u: float,
    v: float,
) -> tuple[tuple[float, float, float], tuple[float, float, float]]:
    aspect = get_number(camera, ["aspectRatio", "aspect"], 16.0 / 9.0) or (16.0 / 9.0)
    fov_deg = get_number(camera, ["fovDeg", "fov", "verticalFovDeg"], 65.0) or 65.0

    right, up, forward = camera_basis(camera)
    origin = camera_origin(camera)
    tan_half_v = math.tan(deg_to_rad(fov_deg) * 0.5)

    x_ndc = (clamp01(u) * 2.0) - 1.0
    y_ndc = 1.0 - (clamp01(v) * 2.0)

    x_cam = x_ndc * tan_half_v * aspect
    y_cam = y_ndc * tan_half_v
    z_cam = 1.0

    world_direction = normalize(
        (
            right[0] * x_cam + up[0] * y_cam + forward[0] * z_cam,
            right[1] * x_cam + up[1] * y_cam + forward[1] * z_cam,
            right[2] * x_cam + up[2] * y_cam + forward[2] * z_cam,
        )
    )
    return origin, world_direction


def intersect_ray_with_floor(
    origin: tuple[float, float, float],
    direction: tuple[float, float, float],
    floor_y: float,
) -> tuple[float, float, float] | None:
    dy = direction[1]
    if abs(dy) <= 1e-9:
        return None
    t = (floor_y - origin[1]) / dy
    if t <= 0.0:
        return None
    return (
        origin[0] + direction[0] * t,
        origin[1] + direction[1] * t,
        origin[2] + direction[2] * t,
    )


def oriented_box_corners(
    center_x: float,
    center_z: float,
    width_m: float,
    depth_m: float,
    height_m: float,
    yaw_deg: float,
    base_y_m: float,
) -> list[tuple[float, float, float]]:
    half_w = width_m * 0.5
    half_d = depth_m * 0.5
    yaw = deg_to_rad(yaw_deg)
    c = math.cos(yaw)
    s = math.sin(yaw)

    corners_xz = [
        (-half_w, -half_d),
        (half_w, -half_d),
        (half_w, half_d),
        (-half_w, half_d),
    ]
    corners: list[tuple[float, float, float]] = []
    for lx, lz in corners_xz:
        world_x = center_x + lx * c - lz * s
        world_z = center_z + lx * s + lz * c
        corners.append((world_x, base_y_m, world_z))
        corners.append((world_x, base_y_m + height_m, world_z))
    return corners


def project_world_point(
    world_point: tuple[float, float, float],
    camera: dict[str, Any],
) -> tuple[float, float] | None:
    origin = camera_origin(camera)
    right, up, forward = camera_basis(camera)
    fov_deg = get_number(camera, ["fovDeg", "fov", "verticalFovDeg"], 65.0) or 65.0
    aspect = get_number(camera, ["aspectRatio", "aspect"], 16.0 / 9.0) or (16.0 / 9.0)

    rel = (world_point[0] - origin[0], world_point[1] - origin[1], world_point[2] - origin[2])
    x_cam = dot(rel, right)
    y_cam = dot(rel, up)
    z_cam = dot(rel, forward)
    if z_cam <= 1e-5:
        return None

    tan_half_v = math.tan(deg_to_rad(fov_deg) * 0.5)
    x_ndc = x_cam / (z_cam * tan_half_v * aspect)
    y_ndc = y_cam / (z_cam * tan_half_v)
    u = (x_ndc + 1.0) * 0.5
    v = (1.0 - y_ndc) * 0.5
    return (u, v)


def bbox_from_projected_corners(corners: list[tuple[float, float, float]], camera: dict[str, Any]) -> dict[str, float] | None:
    projected = [project_world_point(corner, camera) for corner in corners]
    visible = [item for item in projected if item is not None]
    if not visible:
        return None

    us = [item[0] for item in visible]
    vs = [item[1] for item in visible]
    min_u = max(0.0, min(1.0, min(us)))
    max_u = max(0.0, min(1.0, max(us)))
    min_v = max(0.0, min(1.0, min(vs)))
    max_v = max(0.0, min(1.0, max(vs)))
    if max_u <= min_u or max_v <= min_v:
        return None
    return {
        "x": min_u,
        "y": min_v,
        "width": max_u - min_u,
        "height": max_v - min_v,
    }


def bbox_fit_error(observed: dict[str, float], predicted: dict[str, float]) -> float:
    obs_cx = observed["x"] + observed["width"] * 0.5
    obs_cy = observed["y"] + observed["height"] * 0.5
    pred_cx = predicted["x"] + predicted["width"] * 0.5
    pred_cy = predicted["y"] + predicted["height"] * 0.5
    e_center = abs(obs_cx - pred_cx) + abs(obs_cy - pred_cy)
    e_size = abs(observed["width"] - predicted["width"]) + abs(observed["height"] - predicted["height"])
    return e_center * 2.0 + e_size


def fit_yaw_from_bbox(
    camera: dict[str, Any],
    observed_bbox: dict[str, float],
    anchor_world: tuple[float, float, float],
    size: dict[str, float],
    floor_y: float,
    elevation_m: float,
    coarse_step_deg: float,
    yaw_hint_deg: float | None,
) -> tuple[float, float, dict[str, float] | None]:
    width = size["width"]
    depth = size["depth"]
    height = size["height"]
    base_y = floor_y + elevation_m
    center_x = anchor_world[0]
    center_z = anchor_world[2]

    def eval_yaw(yaw_deg: float) -> tuple[float, dict[str, float] | None]:
        corners = oriented_box_corners(
            center_x=center_x,
            center_z=center_z,
            width_m=width,
            depth_m=depth,
            height_m=height,
            yaw_deg=yaw_deg,
            base_y_m=base_y,
        )
        projected_bbox = bbox_from_projected_corners(corners, camera)
        if projected_bbox is None:
            return (float("inf"), None)
        return (bbox_fit_error(observed_bbox, projected_bbox), projected_bbox)

    best_yaw = yaw_hint_deg if yaw_hint_deg is not None else 0.0
    best_error, best_bbox = eval_yaw(best_yaw)

    step = max(0.25, coarse_step_deg)
    turns = int(math.ceil(360.0 / step))
    for index in range(turns):
        yaw = -180.0 + index * step
        error, projected_bbox = eval_yaw(yaw)
        if error < best_error:
            best_error = error
            best_yaw = yaw
            best_bbox = projected_bbox

    fine_span = max(1.0, step * 2.0)
    fine_step = max(0.1, step / 8.0)
    fine_count = int(math.ceil((fine_span * 2.0) / fine_step)) + 1
    for index in range(fine_count):
        yaw = best_yaw - fine_span + index * fine_step
        error, projected_bbox = eval_yaw(yaw)
        if error < best_error:
            best_error = error
            best_yaw = yaw
            best_bbox = projected_bbox

    normalized_yaw = ((best_yaw + 180.0) % 360.0) - 180.0
    return normalized_yaw, best_error, best_bbox


def fit_center_offset_and_yaw_from_bbox(
    camera: dict[str, Any],
    observed_bbox: dict[str, float],
    anchor_world: tuple[float, float, float],
    size: dict[str, float],
    floor_y: float,
    elevation_m: float,
    coarse_step_deg: float,
    yaw_hint_deg: float | None,
    offset_min_m: float,
    offset_max_m: float,
    offset_step_m: float,
) -> tuple[float, float, dict[str, float] | None, float, tuple[float, float, float]]:
    width = size["width"]
    depth = size["depth"]
    height = size["height"]
    base_y = floor_y + elevation_m

    cam = camera_origin(camera)
    away = (anchor_world[0] - cam[0], 0.0, anchor_world[2] - cam[2])
    away_len = math.sqrt(away[0] * away[0] + away[2] * away[2])
    if away_len <= 1e-7:
        away_dir = (0.0, 0.0, 1.0)
    else:
        away_dir = (away[0] / away_len, 0.0, away[2] / away_len)

    def center_from_offset(offset_m: float) -> tuple[float, float, float]:
        return (
            anchor_world[0] + away_dir[0] * offset_m,
            base_y,
            anchor_world[2] + away_dir[2] * offset_m,
        )

    def eval_pose(yaw_deg: float, offset_m: float) -> tuple[float, dict[str, float] | None]:
        center = center_from_offset(offset_m)
        corners = oriented_box_corners(
            center_x=center[0],
            center_z=center[2],
            width_m=width,
            depth_m=depth,
            height_m=height,
            yaw_deg=yaw_deg,
            base_y_m=base_y,
        )
        projected_bbox = bbox_from_projected_corners(corners, camera)
        if projected_bbox is None:
            return (float("inf"), None)
        predicted_anchor = (
            projected_bbox["x"] + projected_bbox["width"] * 0.5,
            projected_bbox["y"] + projected_bbox["height"],
        )
        observed_anchor = (
            observed_bbox["x"] + observed_bbox["width"] * 0.5,
            observed_bbox["y"] + observed_bbox["height"],
        )
        anchor_error = abs(predicted_anchor[0] - observed_anchor[0]) + abs(predicted_anchor[1] - observed_anchor[1])
        bbox_error = bbox_fit_error(observed_bbox, projected_bbox)
        return (bbox_error + anchor_error * 2.0, projected_bbox)

    step_deg = max(0.25, coarse_step_deg)
    step_offset = max(0.02, offset_step_m)
    yaw_candidates = int(math.ceil(360.0 / step_deg))
    offset_count = int(math.floor((offset_max_m - offset_min_m) / step_offset)) + 1

    best_yaw = yaw_hint_deg if yaw_hint_deg is not None else 0.0
    best_offset = 0.0
    best_error, best_bbox = eval_pose(best_yaw, best_offset)

    for offset_index in range(offset_count):
        offset_m = offset_min_m + offset_index * step_offset
        for yaw_index in range(yaw_candidates):
            yaw = -180.0 + yaw_index * step_deg
            error, projected_bbox = eval_pose(yaw, offset_m)
            if error < best_error:
                best_error = error
                best_yaw = yaw
                best_offset = offset_m
                best_bbox = projected_bbox

    fine_yaw_span = max(2.0, step_deg * 2.0)
    fine_yaw_step = max(0.1, step_deg / 8.0)
    fine_offset_span = max(0.08, step_offset * 2.0)
    fine_offset_step = max(0.01, step_offset / 8.0)

    fine_yaw_count = int(math.ceil((fine_yaw_span * 2.0) / fine_yaw_step)) + 1
    fine_offset_count = int(math.ceil((fine_offset_span * 2.0) / fine_offset_step)) + 1
    for offset_index in range(fine_offset_count):
        offset_m = best_offset - fine_offset_span + offset_index * fine_offset_step
        for yaw_index in range(fine_yaw_count):
            yaw = best_yaw - fine_yaw_span + yaw_index * fine_yaw_step
            error, projected_bbox = eval_pose(yaw, offset_m)
            if error < best_error:
                best_error = error
                best_yaw = yaw
                best_offset = offset_m
                best_bbox = projected_bbox

    normalized_yaw = ((best_yaw + 180.0) % 360.0) - 180.0
    best_center = center_from_offset(best_offset)
    return normalized_yaw, best_error, best_bbox, best_offset, best_center


def parse_input_payload(payload: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any], dict[str, Any]]:
    camera = payload.get("camera")
    detection = payload.get("detection")
    obj = payload.get("object")
    config = payload.get("config", {})

    if not isinstance(camera, dict):
        raise ValueError("payload.camera es requerido")
    if not isinstance(detection, dict):
        raise ValueError("payload.detection es requerido")
    if not isinstance(obj, dict):
        raise ValueError("payload.object es requerido")
    if not isinstance(config, dict):
        config = {}
    return camera, detection, obj, config


def parse_object_size(obj: dict[str, Any]) -> dict[str, float]:
    size = obj.get("sizeM") if isinstance(obj.get("sizeM"), dict) else {}
    width = get_number(size, ["width", "x"], None)
    depth = get_number(size, ["depth", "z"], None)
    height = get_number(size, ["height", "y"], None)
    if width is None or depth is None or height is None:
        raise ValueError("object.sizeM requiere width, depth, height")
    if width <= 0.0 or depth <= 0.0 or height <= 0.0:
        raise ValueError("object.sizeM debe tener dimensiones positivas")
    return {"width": width, "depth": depth, "height": height}


def merge_object(base_object: dict[str, Any], override_object: dict[str, Any]) -> dict[str, Any]:
    merged = dict(base_object)
    for key, value in override_object.items():
        if key == "sizeM" and isinstance(merged.get("sizeM"), dict) and isinstance(value, dict):
            size_merged = dict(merged["sizeM"])
            size_merged.update(value)
            merged["sizeM"] = size_merged
        else:
            merged[key] = value
    return merged


def normalize_angle_deg(value: float) -> float:
    return ((value + 180.0) % 360.0) - 180.0


def lerp_scalar(previous: float, current: float, alpha: float) -> float:
    return previous * (1.0 - alpha) + current * alpha


def lerp_angle_deg(previous: float, current: float, alpha: float) -> float:
    delta = normalize_angle_deg(current - previous)
    return normalize_angle_deg(previous + delta * alpha)


def smooth_pose_step(
    previous: dict[str, float] | None,
    current_center_x: float,
    current_center_z: float,
    current_yaw_deg: float,
    alpha_center: float,
    alpha_yaw: float,
) -> dict[str, float]:
    if previous is None:
        return {
            "centerX": current_center_x,
            "centerZ": current_center_z,
            "yawDeg": normalize_angle_deg(current_yaw_deg),
        }

    next_center_x = lerp_scalar(previous["centerX"], current_center_x, alpha_center)
    next_center_z = lerp_scalar(previous["centerZ"], current_center_z, alpha_center)
    next_yaw = lerp_angle_deg(previous["yawDeg"], current_yaw_deg, alpha_yaw)
    return {
        "centerX": next_center_x,
        "centerZ": next_center_z,
        "yawDeg": next_yaw,
    }


def frame_detection(frame: dict[str, Any]) -> dict[str, Any] | None:
    raw = frame.get("detection")
    if isinstance(raw, dict):
        return raw
    required = ("x", "y", "width", "height")
    if all(key in frame for key in required):
        return {
            "id": frame.get("id", f"frame-det-{frame.get('index', 'na')}"),
            "trackId": frame.get("trackId"),
            "objectId": frame.get("objectId"),
            "x": frame["x"],
            "y": frame["y"],
            "width": frame["width"],
            "height": frame["height"],
            "anchorUV": frame.get("anchorUV") or frame.get("anchor_uv"),
            "anchorMode": frame.get("anchorMode") or frame.get("anchor_mode"),
        }
    return None


def frame_timestamp(frame: dict[str, Any], index: int) -> str:
    for key in ("timestamp", "time", "sentAt"):
        value = frame.get(key)
        if isinstance(value, str) and value.strip():
            return value
    return f"frame-{index + 1}"


def lift_cuboid(payload: dict[str, Any]) -> dict[str, Any]:
    camera, detection, obj, config = parse_input_payload(payload)
    bbox = parse_bbox(detection)
    anchor_uv = parse_anchor_uv(detection)
    size = parse_object_size(obj)

    floor_y = get_number(config, ["floorY", "floor_y"], 0.0) or 0.0
    elevation_m = get_number(obj, ["elevationM", "elevation"], 0.0) or 0.0

    origin, direction = ray_from_uv(camera, anchor_uv[0], anchor_uv[1])
    anchor_world = intersect_ray_with_floor(origin, direction, floor_y + elevation_m)
    if anchor_world is None:
        raise ValueError("no se pudo intersectar rayo con plano de piso")

    yaw_hint = get_number(obj, ["yawDeg", "rotationDeg", "yaw"], None)
    fit_yaw = bool(config.get("fitYawFromBBox", False))
    fit_center_offset = bool(config.get("fitCenterOffsetFromBBox", False))
    coarse_step = get_number(config, ["yawSearchStepDeg", "yaw_step_deg"], 2.0) or 2.0
    offset_min_m = get_number(config, ["centerOffsetMinM"], -size["depth"] * 0.5) or (-size["depth"] * 0.5)
    offset_max_m = get_number(config, ["centerOffsetMaxM"], size["depth"] * 0.5) or (size["depth"] * 0.5)
    offset_step_m = get_number(config, ["centerOffsetStepM"], 0.08) or 0.08
    center_world_x = anchor_world[0]
    center_world_z = anchor_world[2]
    center_offset_m = 0.0

    if fit_yaw and fit_center_offset:
        yaw_deg, fit_error, projected_bbox, center_offset_m, fitted_center = fit_center_offset_and_yaw_from_bbox(
            camera=camera,
            observed_bbox=bbox,
            anchor_world=anchor_world,
            size=size,
            floor_y=floor_y,
            elevation_m=elevation_m,
            coarse_step_deg=coarse_step,
            yaw_hint_deg=yaw_hint,
            offset_min_m=offset_min_m,
            offset_max_m=offset_max_m,
            offset_step_m=offset_step_m,
        )
        center_world_x = fitted_center[0]
        center_world_z = fitted_center[2]
    elif fit_yaw:
        yaw_deg, fit_error, projected_bbox = fit_yaw_from_bbox(
            camera=camera,
            observed_bbox=bbox,
            anchor_world=anchor_world,
            size=size,
            floor_y=floor_y,
            elevation_m=elevation_m,
            coarse_step_deg=coarse_step,
            yaw_hint_deg=yaw_hint,
        )
    else:
        yaw_deg = yaw_hint if yaw_hint is not None else 0.0
        corners = oriented_box_corners(
            center_x=center_world_x,
            center_z=center_world_z,
            width_m=size["width"],
            depth_m=size["depth"],
            height_m=size["height"],
            yaw_deg=yaw_deg,
            base_y_m=floor_y + elevation_m,
        )
        projected_bbox = bbox_from_projected_corners(corners, camera)
        fit_error = bbox_fit_error(bbox, projected_bbox) if projected_bbox is not None else None

    base_y = floor_y + elevation_m
    center_world = (center_world_x, base_y + size["height"] * 0.5, center_world_z)
    corners = oriented_box_corners(
        center_x=center_world_x,
        center_z=center_world_z,
        width_m=size["width"],
        depth_m=size["depth"],
        height_m=size["height"],
        yaw_deg=yaw_deg,
        base_y_m=base_y,
    )
    footprint = corners[0::2]
    footprint_xz = [[point[0], point[2]] for point in footprint]

    return {
        "status": "ok",
        "assumptions": [
            "single_camera",
            "floor_plane_support",
            "object_pitch_roll_fixed_zero",
            "anchor_uv_bottom_center_default",
        ],
        "inputEcho": {
            "anchorUV": [anchor_uv[0], anchor_uv[1]],
            "bbox": bbox,
            "sizeM": size,
        },
        "result": {
            "anchorWorld": [anchor_world[0], anchor_world[1], anchor_world[2]],
            "baseCenterWorld": [center_world_x, base_y, center_world_z],
            "centerWorld": [center_world[0], center_world[1], center_world[2]],
            "footprintXZ": footprint_xz,
            "centerOffsetFromAnchorM": center_offset_m,
            "yawDeg": yaw_deg,
            "reprojectedBBox": projected_bbox,
            "fit": {
                "enabled": fit_yaw,
                "fitCenterOffset": fit_center_offset if fit_yaw else None,
                "errorL1": fit_error,
                "coarseStepDeg": coarse_step if fit_yaw else None,
                "offsetRangeM": [offset_min_m, offset_max_m] if (fit_yaw and fit_center_offset) else None,
                "offsetStepM": offset_step_m if (fit_yaw and fit_center_offset) else None,
            },
            "cornersWorld": [[point[0], point[1], point[2]] for point in corners],
        },
    }


def lift_cuboid_sequence(payload: dict[str, Any]) -> dict[str, Any]:
    camera = payload.get("camera")
    obj = payload.get("object")
    config = payload.get("config", {})
    frames = payload.get("frames")

    if not isinstance(camera, dict):
        raise ValueError("payload.camera es requerido para modo batch")
    if not isinstance(obj, dict):
        raise ValueError("payload.object es requerido para modo batch")
    if not isinstance(config, dict):
        config = {}
    if not isinstance(frames, list) or not frames:
        raise ValueError("payload.frames debe ser una lista no vacia para modo batch")

    alpha_center = clamp01(get_number(config, ["smoothCenterAlpha", "smoothingAlpha"], 1.0) or 1.0)
    alpha_yaw = clamp01(get_number(config, ["smoothYawAlpha"], alpha_center) or alpha_center)

    output_frames: list[dict[str, Any]] = []
    previous_smoothed: dict[str, float] | None = None
    fit_errors: list[float] = []

    for index, raw_frame in enumerate(frames):
        if not isinstance(raw_frame, dict):
            continue
        detection = frame_detection(raw_frame)
        if not isinstance(detection, dict):
            continue

        frame_camera = camera
        if isinstance(raw_frame.get("camera"), dict):
            frame_camera = dict(camera)
            frame_camera.update(raw_frame["camera"])

        frame_object = obj
        if isinstance(raw_frame.get("object"), dict):
            frame_object = merge_object(obj, raw_frame["object"])

        frame_config = dict(config)
        if isinstance(raw_frame.get("config"), dict):
            frame_config.update(raw_frame["config"])

        raw_payload = lift_cuboid(
            {
                "camera": frame_camera,
                "detection": detection,
                "object": frame_object,
                "config": frame_config,
            }
        )
        raw_result = raw_payload["result"]
        raw_base = raw_result["baseCenterWorld"]
        raw_center = raw_result["centerWorld"]
        raw_yaw = float(raw_result["yawDeg"])

        smoothed = smooth_pose_step(
            previous_smoothed,
            current_center_x=float(raw_base[0]),
            current_center_z=float(raw_base[2]),
            current_yaw_deg=raw_yaw,
            alpha_center=alpha_center,
            alpha_yaw=alpha_yaw,
        )
        previous_smoothed = smoothed

        fit_error_raw = raw_result["fit"].get("errorL1")
        if isinstance(fit_error_raw, (int, float)) and math.isfinite(fit_error_raw):
            fit_errors.append(float(fit_error_raw))

        output_frames.append(
            {
                "index": index,
                "timestamp": frame_timestamp(raw_frame, index),
                "trackId": detection.get("trackId"),
                "objectId": detection.get("objectId"),
                "raw": raw_result,
                "smoothedPose": {
                    "baseCenterWorld": [smoothed["centerX"], float(raw_base[1]), smoothed["centerZ"]],
                    "centerWorld": [smoothed["centerX"], float(raw_center[1]), smoothed["centerZ"]],
                    "planPositionM": [smoothed["centerX"], smoothed["centerZ"]],
                    "yawDeg": smoothed["yawDeg"],
                },
            }
        )

    if not output_frames:
        raise ValueError("no se pudieron procesar frames validos en payload.frames")

    mean_fit_error = sum(fit_errors) / len(fit_errors) if fit_errors else None
    max_fit_error = max(fit_errors) if fit_errors else None

    return {
        "status": "ok",
        "mode": "batch",
        "assumptions": [
            "single_camera",
            "floor_plane_support",
            "object_pitch_roll_fixed_zero",
            "anchor_uv_bottom_center_default",
        ],
        "smoothing": {
            "smoothCenterAlpha": alpha_center,
            "smoothYawAlpha": alpha_yaw,
            "enabled": alpha_center < 0.999 or alpha_yaw < 0.999,
        },
        "summary": {
            "frameCount": len(output_frames),
            "fitErrorMeanL1": mean_fit_error,
            "fitErrorMaxL1": max_fit_error,
        },
        "frames": output_frames,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Lift 2D camera detections to 3D cuboid pose (2.5D assumptions)")
    parser.add_argument(
        "--input-json",
        required=True,
        help="Path to payload JSON. single: camera+detection+object; batch: camera+object+frames",
    )
    parser.add_argument(
        "--mode",
        default="auto",
        choices=["auto", "single", "batch"],
        help="auto: detect by payload.frames; single: one detection; batch: sequence",
    )
    parser.add_argument("--pretty", action="store_true", help="Pretty-print output JSON")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    payload_path = Path(args.input_json)
    payload = json.loads(payload_path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("input JSON debe ser un objeto")

    mode = args.mode
    if mode == "auto":
        mode = "batch" if isinstance(payload.get("frames"), list) else "single"

    if mode == "batch":
        output = lift_cuboid_sequence(payload)
    else:
        output = lift_cuboid(payload)
    if args.pretty:
        print(json.dumps(output, ensure_ascii=True, indent=2))
    else:
        print(json.dumps(output, ensure_ascii=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
