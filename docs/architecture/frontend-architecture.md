# Frontend Architecture Documentation

The **Virtual AI Company (VAC)** frontend application is built on **React 18**, **Vite**, **TypeScript**, **TailwindCSS**, and **React Three Fiber (R3F)**.

---

## Component Tree & Directory Structure

```
apps/web/src/
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx          # Root chrome container with auto-refresh poll
│   │   ├── Sidebar.tsx             # Enterprise navigation sidebar & backend status pill
│   │   └── TopNav.tsx              # Page headers, organization picker, API telemetry
│   ├── office/
│   │   ├── OfficeScene.tsx         # R3F Canvas root with CameraController & lighting
│   │   ├── OfficeFloor.tsx         # Tiled slab, corridors, zone boundaries, grid
│   │   ├── OfficeWalls.tsx         # Perimeter glass walls, interior partitions, columns
│   │   ├── OfficeFurniture.tsx     # Desks, chairs, monitors, server racks, amenities
│   │   ├── Workstation.tsx         # Modular desk unit with monitor glow & GLB anchor
│   │   ├── CharacterAnchor.tsx     # 3D coordinates marker for future GLB character mounting
│   │   ├── OfficeLighting.tsx      # Ambient, directional shadows, accent downlights
│   │   ├── DepartmentZoneTag.tsx   # 3D floating HTML department labels & agent counters
│   │   └── OfficeControlsOverlay.tsx # HUD overlay: camera presets, toggles, zone inspector
│   └── ui/
│       ├── Badge.tsx               # Status badges with live/placeholder variants
│       ├── Card.tsx                # Glassmorphism container cards with glow effects
│       └── MetricCard.tsx          # Metrics display distinguishing Live DB vs Sprint 2
├── pages/
│   ├── DashboardPage.tsx           # Corporate overview, live stats, seeded department cards
│   ├── VirtualOfficePage.tsx       # Fullscreen interactive 3D headquarters
│   ├── EmployeesPage.tsx           # AI Agent workforce directory (Sprint 2 placeholder)
│   ├── TasksPage.tsx               # Kanban task orchestration queue (Sprint 2 placeholder)
│   └── SettingsPage.tsx            # LLM providers & infrastructure telemetry
├── services/
│   └── api.ts                      # Resilient fetch client with error handling
├── store/
│   ├── useCompanyStore.ts          # Zustand store for organization and telemetry state
│   └── useOfficeStore.ts           # Zustand store for camera, selections, and rendering modes
├── types/
│   └── index.ts                    # Re-exports domain types from @vac/shared
├── App.tsx                         # Client-side router configuration
└── main.tsx                        # DOM hydration entry point
```

---

## 3D Spatial Virtual Office Details

### 1. Camera Projection & Controls
- **Default Angle**: Isometric perspective projection (`position: [24, 26, 24]`, `target: [0, 0, 0]`, `FOV: 35`).
- **Interactive Controls**:
  - `Left Click + Drag`: Orbit / Rotate azimuth and polar angles.
  - `Right Click + Drag` / `Middle Click`: Pan camera plane.
  - `Mouse Wheel / Pinch`: Smooth Zoom (`minDistance: 6`, `maxDistance: 65`).
  - `Polar Angle Clamping`: Restricted to `Math.PI / 2.05` to prevent ground clipping.
- **Smooth Transitions**: `CameraController` uses Three.js `lerp` on every frame to smoothly pan and zoom between camera presets (`Isometric Default`, `Top Down Blueprint`, `Tech Hub`, `Executive Wing`).

### 2. Geometry & Optimization
- Geometry is built using clean stylized Three.js primitives (`boxGeometry`, `cylinderGeometry`, `planeGeometry`).
- Lighting uses high-efficiency shadow maps with bias compensation (`-0.0005`) to prevent shadow acne.
- Pixel ratio is clamped with `dpr={[1, 2]}` to prevent GPU thermal throttling on high-DPI displays.

### 3. Future GLB Asset Mounting Readiness
Each workstation contains a `<CharacterAnchor />` component specifying:
- Exact 3D local coordinates `[x, y, z]` for seating.
- Directional facing rotation.
- Department slug and workstation index.
- Holographic docking ring on the floor plane.
When GLB avatar loading is implemented in Sprint 2, the GLB asset will simply mount directly onto `<CharacterAnchor />`.

---

## State Management

Two lightweight Zustand stores manage frontend state without Redux boilerplate:
- **`useCompanyStore`**: Holds active company details, department lists, employee stats, and `/api/health` telemetry.
- **`useOfficeStore`**: Holds camera presets, selected department info, grid toggles, label visibility, and lighting modes.

