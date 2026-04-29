# Instituto Newton — Design System

> Carpeta canonica consolidada. Absorbe el contenido util de `Instituto Newton Design System V2` y la preview suelta `Design system_clear color 26_04`.

## Overview

**Instituto Newton** is a video escape room game set inside a prestigious scientific institute with over 100 years of history. The tagline is *"Gravedad para mentes brillantes"* (Gravity for brilliant minds).

Players explore the institute's secrets through missions that blend dry academic humour with genuinely tense thriller moments. Think: a respectable 1920s university that hides something much darker underneath its marble floors.

**Sources provided:**
- `assets/LoadingScreen_Newton.png` — 1920×1080 loading screen (blueprint floor plan + logo + lore text)
- Brand colors and font specified by the client: `#013E70`, `#0276D6`, `#E2D6AF`, League Spartan

---

## Products / Surfaces

| Surface | Description |
|---|---|
| **In-game UI** | HUD, mission screens, inventory, puzzle overlays |
| **Menus & Loading** | Main menu, loading screens, chapter select |
| **Narrative UI** | Dialogue, lore cards, NPC quotes |

---

## CONTENT FUNDAMENTALS

### Voice & Tone

- **Language:** Spanish (primary). All copy should feel native, not translated.
- **Register:** Semi-formal with wit. The institute speaks formally; players speak casually.
- **Person:** Narrative lore uses third-person ("El Instituto Newton…"). In-game instructions use second-person imperative ("Encuentra la llave", "Examina el archivador").
- **Emoji:** Never. The aesthetic is retro-institutional — emoji would break the illusion.
- **Punctuation:** Spanish inverted marks required: `¿` `¡`. Em-dashes for dramatic pauses: `—`.
- **Casing:** Title case for proper nouns and location names (`Sala de Profesores`, `Laboratorio de Ciencias`). ALL CAPS reserved for UI labels only (`CARGANDO...`, `CONTINUAR`).
- **Numbers:** Rooms numbered in the floor plan use Arabic numerals. Dates and years spelled out in lore (`más de 100 años`).
- **Quotes:** Typographic Spanish quotes: `"…"` or guillemets `«…»` for flavor text.

### Tone Examples

| Context | Example |
|---|---|
| Lore (mysterious) | *"El Instituto Newton no presume de secretos. Pero tampoco los niega."* |
| NPC quote | *"Anne, Profesora de Química"* — authoritative, terse |
| UI action | *CARGANDO...* — brief, uppercase, no period except ellipsis |
| Mission brief | Urgent but structured; bullet points or numbered steps |
| Humor | Dry, situational — never slapstick in text form |

---

## VISUAL FOUNDATIONS

### Colors

- **Deep Navy `#013E70`** — primary background; commands authority, institutional depth
- **Sky Blue `#0276D6`** — interactive primary; blueprint lines, highlights, buttons
- **Warm Cream `#E2D6AF`** — body text, warm contrast; aged-paper warmth against cool blue
- **Logo Gold `#F5B800`** — accent only; reserved for the logo shield and high-priority callouts
- **Blueprint Line `#1A5FA8`** — mid-tone blue for grid lines, dividers, secondary containers
- **White `#FFFFFF`** — headings on dark backgrounds; icon fills
- **Near-Black `#050F1A`** — deep shadow, overlay backgrounds

### Typography

- **Display / Headings:** League Spartan — Bold, condensed, high x-height. Geometric but warm. Used ALL CAPS for impact headers.
- **Body:** League Spartan Regular/Light — the same family at smaller sizes keeps cohesion
- **Mono / Technical:** `'Courier New', monospace` — used sparingly for puzzle codes, coordinates, system readouts. Reinforces the "technical blueprint" feel.
- **Scale:** 12 → 14 → 16 → 20 → 24 → 32 → 48 → 64 → 96px
- **Line height:** 1.2 for headings, 1.6 for body

### Backgrounds & Texture

- **Blueprint grid** — repeating fine white/light-blue grid lines on navy; used for map and loading screens
- **Full-bleed dark navy** — default app background
- **Gradient overlays** — `linear-gradient(to right, #013E70 60%, transparent)` over blueprint images for text panels
- **NO photographic backgrounds** — everything is graphic, technical, hand-drafted aesthetic

### Spacing & Layout

- Base unit: **8px**. All spacing in multiples: 4, 8, 16, 24, 32, 48, 64, 96
- Border radius: **4px** for inputs/chips; **8px** for cards; **0px** for major panels (hard, institutional edges)
- Grid: **12-column** with 24px gutters at 1920px; collapses to 4-col on small screens

### Animation

- **Easing:** `cubic-bezier(0.25, 0.1, 0.25, 1)` — smooth, unhurried
- **Duration:** 150ms micro-interactions; 300ms panel transitions; 600ms scene changes
- **Style:** Fade + slight translate (8px). No bounces. No elastic. Institutional gravity.
- **Loading:** Typewriter / scanline reveal for lore text

### Hover / Press States

- **Buttons hover:** Background lightens by ~15%; subtle `box-shadow` in sky blue
- **Buttons press:** Scale down to `0.97`; instant
- **Links hover:** Cream underline slides in from left
- **Cards hover:** `translateY(-2px)` + shadow depth increases

### Borders & Shadows

- **Borders:** 1px `#1A5FA8` for containers; 2px `#0276D6` for active/focus states
- **Shadow system:** `0 2px 8px rgba(1,62,112,0.4)` card shadow; `0 0 24px rgba(2,118,214,0.3)` glow for active elements
- **No inner shadows.** Clean, flat institutional surfaces.

### Corner Radii

- `0px` — main panels, modals, loading bars
- `4px` — badges, tags, small chips
- `8px` — cards, tooltips
- `50%` — avatar/portrait circles only

### Cards

- Background: `#012E55` (slightly lighter than navy)
- Border: `1px solid #1A5FA8`
- Padding: `24px`
- Border radius: `8px`
- Shadow: `0 2px 8px rgba(1,62,112,0.4)`

### Imagery & Illustration

- **Blueprint style** — architectural line drawings, floor plans, schematic diagrams
- **Color vibe:** Cool blue dominant; cream/gold highlights; no warm photography
- **Grain/texture:** Subtle noise optional on blueprint backgrounds
- **No stock photography.** Illustrations only — line-weight consistent with blueprint aesthetic.

### Transparency & Blur

- Blur used sparingly for overlay modals: `backdrop-filter: blur(8px)` on semi-transparent panels
- `rgba(1,62,112,0.85)` for overlay backgrounds

---

## ICONOGRAPHY

- **Style:** Thin-to-medium stroke line icons (1.5–2px stroke weight); no fills
- **Set:** Lucide Icons (CDN) — matches the clean, geometric, slightly technical aesthetic
- **Size:** 16px (inline), 24px (UI), 32px (feature icons)
- **Color:** White `#FFFFFF` or Cream `#E2D6AF` on dark backgrounds; Navy `#013E70` on light
- **Logo:** Shield + atom + "N" glyph — see `assets/LoadingScreen_Newton.png` for reference
- **Emoji:** Never used
- **Unicode chars as icons:** Never used
- **Custom illustrations:** Blueprint-style architectural drawings (rooms, objects, schematics)

---

## FILES

```
README.md                    ← This file
SKILL.md                     ← Agent skill definition
colors_and_type.css          ← CSS custom properties (colors + typography)
assets/
  LoadingScreen_Newton.png   ← Loading screen (1920×1080)
fonts/                       ← Font files (Google Fonts CDN used; see note)
preview/
  colors-primary.html        ← Primary color swatches
  colors-neutral.html        ← Neutral & semantic colors
  type-scale.html            ← Typography scale
  type-specimens.html        ← Type specimens
  spacing.html               ← Spacing tokens
  components-buttons.html    ← Button variants
  components-inputs.html     ← Input fields
  components-cards.html      ← Card variants
  components-badges.html     ← Badges & tags
  brand-logo.html            ← Logo usage
  brand-loading.html         ← Loading screen reference
ui_kits/
  game/
    README.md
    index.html               ← Main game UI kit
    MainMenu.jsx
    HUD.jsx
    MissionBrief.jsx
    LoreCard.jsx
```

> **Font note:** League Spartan is loaded via Google Fonts CDN. If you have local `.woff2` files, drop them into `fonts/` and update `colors_and_type.css` to reference them.
