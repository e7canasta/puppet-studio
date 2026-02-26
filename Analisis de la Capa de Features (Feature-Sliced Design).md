

---

### TODO

[ ] scene-domain/sceneGeometry.ts importa desde planogram-domain (catalog, layout, sync).
Esto es problemático porque scene-domain debería ser más genérico que planogram. 
La solución correcta sería mover las funciones que scene-domain necesita a un módulo compartido o hacer que scene-domain sea completamente independiente de planogram.

 Veo que scene-domain depende heavily de planogram-domain. Las dependencias son:      
 1. Tipos: Placement, RoomDefinition, MonitoringCameraDefinition, DetectionBox2D      
 2. Funciones: ASSET_CATALOG, metersToWorld, getPlacementTargetSizeM, clonePlacements        
 3. Constantes: TOP_VIEW_PADDING_M, TOP_VIEW_TARGET_PX_PER_M, WORLD_UNITS_PER_METER   
  
 La realidad es que "scene-domain" en este proyecto no es realmente un dominio genérico de escenas - está específicamente diseñado para trabajar con planogramas. Por lo tanto, esta dependencia no es       
 necesariamente incorrecta arquitectónicamente para este proyecto específico.Sin embargo, el problema identificado era que podría hacer difícil reusar scene-domain en otros contextos. Una solución intermedia     
 sería documentar esta relación claramente y aceptarla como parte del diseño, ya que un refactor completo requeriría cambios significativos.         
  
 Voy a crear un análisis y documentar la decisión, en lugar de hacer un refactor invasivo que podría romper cosas.       
  
● Voy a analizar el impacto real de esta dependencia. En realidad, después de revisar el código, la dependencia scene-domain → planogram-domain no es necesariamente un problema arquitectónico en este proyecto.    
 Scene-domain está específicamente diseñado para trabajar con planogramas, no es un dominio genérico de escenas 3D.      
  
 La documentación del refactor 2025 menciona "domain consolidation", pero no menciona que scene deba ser independiente de planogram. La relación es:        
 - planogram-domain: Define QUÉ son los objetos (Placement, Room, assets)      
 - scene-domain: Define CÓMO se manipulan en la escena (comandos, geometría, rendering)      
  
 Esto es una dependencia correcta en capas de dominio. No es necesario invertirla.
 
 

---     
Analisis de la Capa de Features (Feature-Sliced Design)   

1. ESTRUCTURA INTERNA DE CADA FEATURE   

workspace (Feature Principal/Orchestrador)    

workspace/    
hooks/useWorkspaceHudState.ts   
model/workspaceHudModel.ts    
ui/components/WorkspaceHeaderBar.tsx, WorkspaceStatusBar.tsx, WorkspaceCommandPalette.tsx,      
WorkspaceWidgetCard.tsx, WorkspaceDockManager.tsx, WorkspaceViewCube.tsx,   
WorkspaceAxisGizmo.tsx, WorkspaceViewportAxisReference.tsx, WorkspaceSceneOutliner.tsx    
ui/pages/CadWorkspacePage.tsx   
- Estructura completa: hooks/model/ui   
- Es el feature principal que orquesta la UI      

scene   

scene/    
hooks/useSceneViewportState.ts, useSceneCommandHotkeys.ts   
model/sceneHotkeyGuards.ts, sceneViewportModel.ts     
ui/PuppetScene.tsx, SceneCommandHotkeys.tsx     
- Estructura completa: hooks/model/ui   

pose    

pose/   
hooks/usePoseControlPanelState.ts   
model/poseControlPanelModel.ts      
ui/PoseControlPanel.tsx, AxisSlider.tsx   
- Estructura completa: hooks/model/ui   

planogram     

planogram/    
hooks/usePlanogramMiniMapState.ts, usePlanogramMiniMapCanvas.ts   
model/planogramMiniMapCanvas.ts     
ui/PlanogramMiniMap.tsx   
- Estructura completa: hooks/model/ui   

camera    

camera/   
hooks/useCameraSubspaceState.ts, useCameraPlaneCanvas.ts    
model/cameraOverlayViewModel.ts, cameraPlaneCanvas.ts   
ui/CameraSubspaceMap.tsx      
- Estructura completa: hooks/model/ui   

terminal      

terminal/     
hooks/useSceneEventTerminalState.ts   
model/sceneEventTerminalModel.ts, terminalCommandLine.ts, terminalCommandPaletteModel.ts    
ui/SceneEventTerminal.tsx, TerminalCommandInput.tsx   
- Estructura completa: hooks/model/ui   

bridge    

bridge/   
hooks/useBridgePoseListener.ts      
model/bridgeLifecycleSceneEvent.ts    
ui/BridgePoseListener.tsx     
- Estructura completa: hooks/model/ui   

---     
2. ANALISIS DE HOOKS Y CONSUMO DE STORES    

Patron comun identificado:      

Los hooks actuan como "fachadas" que extraen datos de multiples stores modulares (useViewportStore, useSceneStore, useBridgeStore, useAvatarStore, useUiStore) y los combinan en un objeto de retorno   
plano.    

Positivo:     

- Los hooks evitan que los componentes UI importan stores directamente    
- Uso correcto de selectores individuales para evitar re-renders innecesarios   
- Buena separacion: datos de stores + funciones puras de model = estado derivado via useMemo      

Problematico - LOGICA DE NEGOCIO EN HOOKS:    

useSceneEventTerminalState (394 lineas):    
- Contiene 15 useState locales    
- Logica de navegacion de historial de comandos   
- Logica de command palette     
- Logica de filtrado y busqueda   
- VIOLACION: Este hook hace demasiado. Es un mini-store en si mismo.      

useWorkspaceHudState:     
- Persiste estado en sessionStorage   
- Subscribe a comandos externos via subscribeWorkspaceShellCommands   
- Aceptable pero podria ser un store Zustand dedicado   

useBridgePoseListener:    
- Maneja conexion WebSocket, parsing de mensajes, lifecycle   
- VIOLACION: Demasiada logica de infraestructura en un hook de feature    

---     
3. DEPENDENCIAS ENTRE FEATURES    

MUY BUENO: No hay importaciones directas entre features.      

El grep import.*from.*features/ no encontro resultados. Esto significa que los features son silos independientes.   

Comunicacion indirecta:   
- Todos los features se comunican via stores centrales (app/state/)   
- Todos usan command dispatcher (createPoseStoreCommandDispatcher) para acciones      
- El feature workspace carga otros features via lazy imports dinamicos    

// CadWorkspacePage.tsx   
const PuppetScene = lazy(() => import('../../../scene/ui/PuppetScene'))   
const PoseControlPanel = lazy(() => import('../../../pose/ui/PoseControlPanel'))      
const CameraSubspaceMap = lazy(() => import('../../../camera/ui/CameraSubspaceMap'))    
const PlanogramMiniMap = lazy(() => import('../../../planogram/ui/PlanogramMiniMap'))   
const SceneEventTerminal = lazy(() => import('../../../terminal/ui/SceneEventTerminal'))    

---     
4. LAZY LOADING Y CODE SPLITTING      

Implementacion:     
- CadWorkspacePage usa React.lazy() para todos los features widgets   
- Cada lazy import esta envuelto en <Suspense fallback={...}>   
- Fallbacks adecuados (strings de loading)    

Bueno:    
- Los features pesados (PuppetScene con Three.js, terminal) se cargan solo cuando se necesitan    
- Separacion clara en chunks    

Oportunidad de mejora:    
- Los index.ts de features solo exportan UI (export * from './ui')    
- Podrian exportar hooks publicos para permitir composicion sin cargar UI   

---     
5. COMPONENTES UI CON LOGICA EXCESIVA O STATE LOCAL     

CadWorkspacePage.tsx (~840 lineas)    

State local:    
- resizeStartRef - manejo de resize panels (aceptable)    
- dockManagerOpen - toggle UI local (aceptable)   

Problemas:    
- ~240 lineas de quickActions array (lineas 223-457) - deberia estar en model/    
- Mucho dispatch inline en JSX - podria abstraerse en callbacks     
- El componente hace rendering de: header, toolrail, viewport, panels izquierdo/derecho, terminal, command palette    

VIOLACION: Este componente es un "God Component". Deberia dividirse en:   
- WorkspaceToolrail.tsx   
- WorkspaceViewport.tsx   
- WorkspaceLeftPanel.tsx    
- WorkspaceRightPanel.tsx   

---     
PuppetScene.tsx (~665 lineas)   

State local:    
- Solo refs para Three.js (aceptable)   
- useMemo para calculo de datos derivados   

Problema:     
- El componente incluye:    
- Ragdoll rendering (PuppetRig, PartMesh, JointNode)    
- Room environment rendering    
- Camera preset controller    
- Camera orientation observer   
- Monitoring sensor layer     
- Avatar bounds   

VIOLACION: Esto deberia ser multiples componentes en /scene/ui/:    
- PuppetRig.tsx     
- RoomEnvironment.tsx     
- MonitoringSensorLayer.tsx     
- CameraPresetController.tsx    

---     
WorkspaceSceneOutliner.tsx (~387 lineas)    

State local:    
- openSections - estado de acordeon   
- filterQuery - filtro de busqueda    

Aceptable: El state local es UI-only y no afecta otros features.    

---     
PlanogramMiniMap.tsx (~412 lineas)    

State local:    
- Solo refs para canvas   

Problema menor:     
- El componente hace mucho rendering inline   
- Podria extraerse la grilla de comandos a un sub-componente    

---     
RESUMEN DE VIOLACIONES Y OPORTUNIDADES      

Violaciones de Boundaries (Severidad Alta)    

1. useSceneEventTerminalState: Es un store completo disfrazado de hook. 15 useState = deberia ser Zustand store en app/state/terminalUiStore.ts   
2. useBridgePoseListener: Logica de infraestructura (WebSocket, parsing) no deberia estar en feature. Mover a services/ o core/bridge-runtime/    
3. CadWorkspacePage: God component con 840 lineas. Dividir en sub-componentes.    
4. PuppetScene: Multiples responsabilidades mezcladas. Extraer componentes Three.js a archivos separados.     

Violaciones de Boundaries (Severidad Media)   

5. quickActions en CadWorkspacePage: 240 lineas de configuracion deberian estar en workspace/model/workspaceQuickActions.ts     
6. Hooks que acceden a getState(): Algunos hooks acceden directamente al store via useStore.getState() en callbacks. Esto es un pattern valido en Zustand pero rompe la trazabilidad.   

Oportunidades de Mejora   

1. Public API de features: Los index.ts solo exportan UI. Podrian exportar hooks para composicion:      
// features/scene/index.ts      
export * from './ui'      
export { useSceneViewportState } from './hooks'   

2. Terminal store dedicado: Extraer los 15 useState del hook terminal a un store:     
// app/state/terminalUiStore.ts   
export const useTerminalUiStore = create((set) => ({    
filterQuery: '',    
commandInput: '',   
commandHistory: [],     
// ... etc    
}))     

3. Componentes atomicos: Extraer de PuppetScene y CadWorkspacePage componentes mas pequenos que puedan ser testeados independientemente.    
4. Bridge hook simplificado: Mover la logica de BridgeSession a un servicio y dejar el hook solo como "conector":   
// hook simplificado      
export function useBridgePoseListener() {   
const bridgeEnabled = useBridgeStore(s => s.bridgeEnabled)    
useEffect(() => bridgeService.setEnabled(bridgeEnabled), [bridgeEnabled])     
}   

---     
Conclusion    

La arquitectura Feature-Sliced esta bien implementada en lo estructural:    
- Cada feature tiene hooks/model/ui   
- No hay importaciones cruzadas entre features    
- Comunicacion via stores centrales   
- Lazy loading implementado     

Los problemas principales son de granularidad interna:    
- Algunos hooks concentran demasiada logica (terminal, bridge)      
- Algunos componentes UI son muy grandes (CadWorkspacePage, PuppetScene)    
- Falta de subdivisiones dentro de features complejos



----


Excelente, ahora tengo un análisis muy completo de las tres áreas principales:       
																																														
1. State Management: Stores modulares con Zustand, service layer, command bus        
2. Domain Layer: CQRS-lite en scene-domain, buena separación pero algunos code smells       
3. Features Layer: FSD bien implementado estructuralmente pero con problemas de granularidad       
																																														
Voy a sintetizar todo esto en una opinión honesta y escribir el plan con mis recomendaciones arquitectónicas.    
																																														
Puntos clave que veo:        
																																														
Lo Bueno:      
- La migración de monolítico (poseStore ~1000 líneas) a modular fue correcta         
- CQRS-lite en scene-domain es elegante    
- Separation of concerns clara entre core/ y app/state/         
- Features no tienen dependencias cruzadas        
- Command bus extensible con capabilities         
																																														
Lo Preocupante (que podría "ahogar la rey"):      
																																														
1. God Components: CadWorkspacePage (840 líneas) y PuppetScene (665 líneas) van a crecer    
2. Hooks que son stores disfrazados: useSceneEventTerminalState con 15 useState      
3. Acoplamiento direccional incorrecto: scene-domain importa de planogram-domain     
4. poseStoreCommandBus es un god file: Orquesta todo en un archivo     
5. Duplicación: degToRad duplicado entre dominios        
6. Singleton mutable: bridgeOutbound fuera de stores     
7. sync.ts de 551 líneas: Parsing + tipos + matching todo junto        
																																														
Movimientos estratégicos que recomendaría:        
																																														
1. Invertir dependencia scene ↔ planogram: Crear shared-math o hacer que planogram dependa de scene       
2. Dividir god components: Antes de que sea muy tarde    
																																														
3. Migrar terminal state a Zustand: El hook con 15 useState necesita ser un store real      
4. Fragmentar features grandes: Crear sub-componentes en scene/ui/ y planogram/ui/   
5. Centralizar utilidades compartidas: shared-math para funciones geométricas        
6. Refactorizar bridge hook: Extraer lógica a bridgeService     
																																														
Déjame escribir el plan con mi análisis y recomendaciones.



---


