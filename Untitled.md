# Revisión Arquitectónica - Puppet Studio

## Estado Actual: El Tablero Después de la Apertura

La migración de `poseStore` monolítico (~1040 líneas, 60+ propiedades) a stores modulares fue **el movimiento correcto**. Es como haber desarrollado bien los alfiles y caballos en la apertura.

### Lo que está BIEN (piezas bien colocadas)

1. **Stores por Dominio** - `viewportStore`, `bridgeStore`, `avatarStore`, `sceneStore`, `uiStore` tienen responsabilidades claras
2. **CQRS-lite en scene-domain** - `dispatchSceneEngineCommand()` es función pura: (state, command) → (nextState, effect, events)
3. **Service Layer** - `sceneService` y `bridgeService` coordinan cross-store sin que los stores se conozcan
4. **No hay dependencias circulares entre stores** - Cada uno es independiente
5. **Features sin imports cruzados** - Comunicación via stores centrales, no spaghetti
6. **Command Bus extensible** - Capabilities permiten interceptar/decorar sin modificar core

---

## Lo que me PREOCUPA (piezas que podrían ahogar)

### 🚨 Severidad Alta - Deuda estructural activa

#### 1. God Components creciendo
| Componente | LOC | Problema |
|------------|-----|----------|
| `CadWorkspacePage.tsx` | ~840 | Renderiza header, toolrail, viewport, panels L/R, terminal, command palette |
| `PuppetScene.tsx` | ~665 | Mezcla ragdoll, room, cameras, sensors, bounds en uno |

**Riesgo**: Cada feature nuevo va a engordarlos más. En 6 meses serán inmanejables.

#### 2. Hook que es un Store disfrazado
`useSceneEventTerminalState.ts` tiene **15 useState** locales:
- `filterQuery`, `commandInput`, `commandHistory`, `historyIndex`, `paletteQuery`, etc.

**Riesgo**: Estado importante vive fuera de la arquitectura de stores. No persiste, no se puede inspeccionar, testing es difícil.

#### 3. Dependencia direccional incorrecta
```
scene-domain/sceneGeometry.ts imports from planogram-domain/
```
Scene es más genérico que planogram. La flecha debería ser `planogram → scene`, no al revés.

**Riesgo**: Cuando quieras reusar scene-domain sin planogram (otro proyecto, test isolation), arrastras todo.

### ⚠️ Severidad Media - Deuda técnica acumulable

#### 4. `poseStoreCommandBus.ts` es un God File (343 líneas)
Hace 5 cosas:
- Crea engine runtime
- Registra capabilities
- Define `PoseStoreState` combinado
- Implementa command port
- Inicializa capabilities por defecto

#### 5. Duplicación entre dominios
```typescript
// Mismo código en dos lugares:
core/planogram-domain/layout.ts:   degToRad()
core/scene-domain/sceneGeometry.ts: degToRad()
```

#### 6. `sync.ts` de 551 líneas
Mezcla:
- Parsing defensivo de mensajes
- Definición de tipos (`AvatarTransform`, `SceneSpecialistMeta`)
- Lógica de matching de placements

#### 7. Singleton mutable fuera de stores
```typescript
// bridgeOutbound.ts
let sender: BridgeSender | null = null
let observer: BridgeOutboundObserver | null = null
```
Estado global que dificulta testing y hot reload.

#### 8. Lógica de dominio escapada a features
`planogram/model/planogramMiniMapCanvas.ts` contiene:
- `pointInPolygon()`
- `zoneAppliesToAsset()`
- Proyecciones geométricas

Estas son funciones de dominio puro que deberían estar en `core/`.

---

## Movimientos Recomendados (Plan de Juego)

### Fase 1: Contención Inmediata (evitar que empeore)

| # | Acción | Impacto | Esfuerzo |
|---|--------|---------|----------|
| 1.1 | **Subdividir `CadWorkspacePage`** en `WorkspaceToolrail`, `WorkspaceViewport`, `WorkspaceLeftPanel`, `WorkspaceRightPanel` | Alto | Medio |
| 1.2 | **Extraer de `PuppetScene`**: `PuppetRig.tsx`, `RoomEnvironment.tsx`, `MonitoringSensorLayer.tsx` | Alto | Medio |
| 1.3 | **Mover `quickActions`** (240 líneas) a `workspace/model/workspaceQuickActions.ts` | Bajo | Bajo |

### Fase 2: Corrección de Dependencias

| # | Acción | Impacto | Esfuerzo |
|---|--------|---------|----------|
| 2.1 | **Crear `core/shared-math/`** con `degToRad`, `pointInPolygon`, funciones geométricas compartidas | Medio | Bajo |
| 2.2 | **Invertir dependencia**: hacer que `planogram-domain` importe de `scene-domain`, no al revés | Alto | Medio |
| 2.3 | **Mover funciones de canvas** de `planogram/model/` a `core/scene-domain/projection/` | Medio | Bajo |

### Fase 3: Normalización de Estado

| # | Acción | Impacto | Esfuerzo |
|---|--------|---------|----------|
| 3.1 | **Crear `terminalUiStore.ts`** y mover los 15 useState del hook terminal | Alto | Medio |
| 3.2 | **Refactorizar `poseStoreCommandBus.ts`** en 3 archivos: `engineRuntimeSetup.ts`, `capabilityRegistration.ts`, `commandPort.ts` | Medio | Bajo |
| 3.3 | **Eliminar singleton** de `bridgeOutbound.ts` - inyectar via stores o crear `bridgeOutboundStore` | Medio | Medio |

### Fase 4: Modularización de Dominio

| # | Acción | Impacto | Esfuerzo |
|---|--------|---------|----------|
| 4.1 | **Dividir `sync.ts`** (551 líneas) en `sync/parsers.ts`, `sync/matchers.ts`, mover tipos a `types.ts` | Medio | Bajo |
| 4.2 | **Extraer tipos** `AvatarTransform`, `SceneSpecialistMeta` de `sync.ts` a `planogram-domain/types.ts` | Bajo | Bajo |

---

## Priorización: Qué Hacer Primero

```
URGENTE + IMPORTANTE (hacer ya):
├── 1.1 Subdividir CadWorkspacePage
├── 1.2 Subdividir PuppetScene
└── 3.1 Crear terminalUiStore

IMPORTANTE (próximas semanas):
├── 2.1 Crear shared-math
├── 2.2 Invertir dependencia scene↔planogram
└── 4.1 Dividir sync.ts

CUANDO HAYA TIEMPO:
├── 1.3 Mover quickActions
├── 3.2 Refactorizar poseStoreCommandBus
└── 3.3 Eliminar singleton bridgeOutbound
```

---

## Mi Opinión Honesta

**El fundamento arquitectónico es sólido.** La decisión de:
- Stores modulares vs monolítico
- CQRS-lite con funciones puras
- Service layer para coordinación
- Feature-sliced design

...son decisiones correctas y bien ejecutadas.

**Los problemas que veo son de segundo orden**:
- God components (típico de crecimiento orgánico)
- Dependencias direccionales incorrectas (fácil de corregir)
- Estado escapado a hooks (un store más lo resuelve)

**No hay errores de diseño fundamentales** que requieran reescribir. Los refactors son incrementales y de bajo riesgo.

La metáfora del ajedrez: tienes las piezas bien desarrolladas, pero algunos peones están bloqueando casillas importantes. Necesitas reorganizar para tener espacio en el medio juego, no cambiar de estrategia.

---

## Verificación Post-Implementación

Cuando se apliquen estos cambios:

1. `npm run build` debe pasar sin errores de tipos
2. `npm run dev` debe cargar sin errores en consola
3. Los stores deben ser inspeccionables via React DevTools (Zustand devtools)
4. Hot reload debe funcionar sin estado zombie (probar con el bridge activo)
5. Cada componente extraído debe renderizar correctamente en isolation (Storybook si existe)
