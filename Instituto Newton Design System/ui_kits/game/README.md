# Instituto Newton — Game UI Kit

Interactive click-through prototype of the in-game UI. Covers 5 core screens.

## Screens

| Screen | How to reach |
|---|---|
| **Loading Screen** | Default on load — auto-advances |
| **Main Menu** | After loading; click "Nueva Partida" or "Continuar" |
| **Chapter Select** | Choose a chapter (01 completado, 02 activo, 03 bloqueado) |
| **Mission Brief** | Click any available chapter → "Iniciar Misión" |
| **Game HUD** | Full HUD with live countdown timer, missions, inventory, log |

## Components (Components.jsx)

| Component | Props |
|---|---|
| `NBtn` | `variant` (primary/secondary/ghost/gold/danger), `size` (sm/md/lg), `disabled` |
| `NBadge` | `status` (info/success/warning/danger/muted) |
| `NCard` | `title`, `glow`, `gold`, `style` |
| `NDivider` | — |
| `NLabel` | — |
| `NProgress` | `value`, `max`, `color`, `label` |
| `NModal` | `title`, `visible`, `onClose` |
| `NTimer` | `seconds`, `urgent` |

## Usage

Load `index.html` directly in a browser. No build step needed — uses Babel standalone + React CDN.

To import components in another file:
```html
<script type="text/babel" src="Components.jsx"></script>
```
All components are exported to `window` automatically.

## Design Width

**1440px** (scales to viewport). Blueprint grid background on all screens.
