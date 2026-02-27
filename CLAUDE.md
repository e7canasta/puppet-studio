# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


## Project Overview

Puppet Studio is a CAD-like 3D workspace application for visualizing and simulating scenes with human body poses (ragdoll physics), room planning (planogram), and monitoring camera overlays. Part of the care-simulator system for healthcare/assisted living monitoring.

## Development Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript check + production build
npm run test:scene   # Run scene tests (esbuild + Node.js)
npm run bridge       # Start WebSocket bridge server
npm run bridge:monitor  # Start bridge monitor
```

### Python Mock Clients (require uv package manager)
```bash
npm run mock:lift-listener  # Cuboid lift listener for scene-1
npm run mock:bed-sequence   # Bed rise/walk sequence simulation
```

### Python Analytics Tests
```bash
cd lib/analytics && pytest test_hub.py
```

## Architecture

### Tech Stack
- **React + TypeScript** with Vite
- **@react-three/fiber** (React Three Fiber) for 3D rendering
- **@react-three/cannon** for physics simulation
- **Zustand** for state management (modular stores)
- **WebSocket** for real-time bridge communication

### Directory Structure (Post-Refactor 2025)

```
src/
├── app/state/               # Modular Zustand stores
│   ├── viewportStore.ts     # Camera, projection, viewport state
│   ├── bridgeStore.ts       # WebSocket connection & deferred sync
│   ├── avatarStore.ts       # Avatar pose & position
│   ├── sceneStore.ts        # Scene engine wrapper (replaces engine duplication)
│   ├── uiStore.ts           # UI state (terminal, tool mode)
│   └── poseStore.ts         # Legacy store (being phased out)
├── services/                # Service layer (coordinates stores)
│   ├── sceneService.ts      # Scene operations + bridge publishing
│   └── bridgeService.ts     # Remote sync coordination
├── core/                    # Domain logic
│   ├── scene-domain/        # Scene engine, commands, history, sync
│   ├── planogram-domain/    # Asset catalog, placements, rooms (moved from src/planogram)
│   ├── bridge-runtime/      # WebSocket bridge communication
│   ├── engine/              # Capability system
│   └── config/              # Runtime config from VITE_* env vars
├── features/                # Feature-Sliced Design modules
│   ├── workspace/           # Main CAD workspace layout
│   ├── scene/               # 3D scene rendering
│   ├── pose/                # Pose control panel
│   ├── planogram/           # Planogram mini map
│   └── bridge/              # Bridge connection UI
└── shared/                  # Shared UI components and utilities
lib/
├── analytics/               # Python SpecialistSubscriber base class
└── geometry/                # Python 2.5D lifting utilities (simula-geometry)
```

### Key Patterns

- **Modular Stores**: State split by domain (viewport, bridge, avatar, scene, ui) instead of monolithic store
- **Scene Engine as Store**: SceneEngine now wrapped in sceneStore - no state duplication
- **Service Layer**: `sceneService` and `bridgeService` coordinate cross-store operations
- **Domain Consolidation**: All domain logic in `core/*-domain/` (planogram moved from src/)
- **Feature Organization**: Each feature follows `hooks/model/ui` structure with lazy loading
- **Capability System**: Engine capabilities can be enabled/disabled via config profiles (dev/demo/ops)

### Architectural Improvements (2025 Refactor)

1. **Store Separation**: Giant poseStore (~1000 lines, 60+ properties) **ELIMINATED** - split into focused stores
2. **No State Duplication**: Scene engine IS the store, not wrapped and duplicated
3. **Service Coordination**: Business logic that crosses stores moved to service layer
4. **Consistent Domain Layout**: All domain logic in `core/`, UI in `features/`
5. **Command Bus Migration**: `poseStoreCommandBus` now delegates to modular stores transparently

## Migration Notes (Feb 2025)

### What Changed

**Before**: Single monolithic `poseStore.ts` (~1040 lines) handling ALL state:
- Viewport, scene, bridge, avatar, UI state all mixed together
- Features directly imported `usePoseStore` everywhere
- 14+ selector calls in a single hook to avoid re-renders

**After**: Five focused stores + service layer:
- `viewportStore`: Camera, projection, viewport settings
- `sceneStore`: Scene placements, room, undo/redo (wraps SceneEngine)
- `bridgeStore`: WebSocket connection, deferred sync queue
- `avatarStore`: Avatar pose and position
- `uiStore`: Terminal, tool mode, event log
- `sceneService` + `bridgeService`: Cross-store coordination

### For New Contributors

- **Never import from `poseStore`** - it no longer exists
- Use specific stores: `useSceneStore`, `useViewportStore`, etc.
- For complex operations crossing stores, use `sceneService` or `bridgeService`
- Command bus (`dispatchPoseStoreCommand`) still works - it delegates internally

### Command Bus Exceptions

Las siguientes operaciones NO van por command bus (intencionalmente):

| Operación | Razón |
|-----------|-------|
| Bridge remote updates | External source of truth - sobrescribe estado local |
| Terminal filter state | UI ephemeral state - no necesita undo |
| Bridge connection status | Side effect de WebSocket, no user action |

### Testing

Basic store tests available at `src/app/state/__tests__/stores.test.ts`

Run with:
```bash
npm test  # (when Jest/Vitest is configured)
```

### Environment Variables

Configure via `VITE_*` environment variables:
- `VITE_FRONTEND_ENGINE_CAPABILITY_PROFILE` - Profile preset: `dev`, `demo`, or `ops`
- `VITE_FRONTEND_SCENE_EDIT_ENABLED` - Enable scene editing (default: true)
- `VITE_FRONTEND_SCENE_UNDO_LIMIT` - Undo history limit (default: 80)
- `VITE_FRONTEND_SCENE_DEFERRED_AUTO_APPLY_ON_RELEASE` - Auto-apply deferred changes


