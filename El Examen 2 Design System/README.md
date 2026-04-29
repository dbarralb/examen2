# El Examen 2 — Design System

## Overview

**El Examen 2** is a narrative hacking/terminal-based interactive experience with a punk-tech / glitch / neon graffiti visual identity. The UI draws from high-energy competitive shooter interfaces but adapts them to a slower, more cerebral hacking/terminal context. The result is a "structured system with controlled visual chaos layered on top."

**Sources:** No external codebase or Figma was provided. This design system was built entirely from the product brief and visual specification.

---

## Key Design Principle

> "Structured system + controlled visual chaos layered on top."

The interface should feel **alive, slightly unstable, and reactive** — like a system being manipulated in real-time — while remaining readable and functional. Visual chaos is layered *on top* of clean structure; it does not replace it.

---

## CONTENT FUNDAMENTALS

### Voice & Tone
- **Terse, technical, direct.** No fluff. System messages are clipped and urgent.
- **Second person** ("you", "your") for UI copy; first person avoided.
- **Lowercase preferred** for terminal output, log lines, system prompts. Proper casing for headings/labels.
- **No emoji.** This is a terminal — use ASCII symbols, brackets, and punctuation as visual markers: `[OK]`, `[ERR]`, `>>>`, `//`, `--`, `##`.
- **Numerals always as digits** (e.g. "3 attempts remaining", not "three").
- **Urgency is implied by brevity**, not exclamation marks.
- **Redacted/corrupted text** (`[REDACTED]`, `█████`, `???`) is used narratively to imply hidden information.
- **Timestamps and IDs** are visual furniture: `[2026-04-29 03:14:22]`, `ID#7F3A`.

### Example Copy
```
> initiating connection...
> auth handshake failed — 2 attempts remaining
ACCESS DENIED
[TRACE: 0x7f3a2c] module integrity: COMPROMISED
// run diagnostics? [Y/N]
```

---

## VISUAL FOUNDATIONS

### Colors
- **Background:** Deep near-black blue-charcoal (`#080C14`, `#0D1220`, `#131927`). Never pure black.
- **Panel surfaces:** Slightly lighter dark (`#161D2E`, `#1A2235`). Subtle gradient from corner light source.
- **Primary accent:** Neon green (`#00FF87`) — interaction, success, highlights.
- **Secondary accent:** Electric magenta (`#FF2D78`) — warnings, active states, danger.
- **Tertiary accents:** Electric purple (`#9B00FF`), Acid yellow (`#FFEA00`), Cyan (`#00EAFF`).
- **Text:** White (`#FFFFFF`) for primary; light gray (`#A8B4CC`) for secondary; dim gray (`#4A5568`) for disabled/ghost.
- **Neon ONLY for interaction and feedback.** Never full neon backgrounds.

### Typography
- **Display / Headings:** `Bebas Neue` — condensed, high impact, all-caps. Used for titles, section headers.
- **UI / Labels:** `Space Grotesk` — geometric, technical, slightly quirky. Used for labels, nav, body.
- **Terminal / Code:** `JetBrains Mono` — monospaced, clean, developer-grade. Used for all terminal, log, code output.
- Type scale: 11 / 13 / 15 / 18 / 24 / 32 / 48 / 64 / 96px
- Letter-spacing: +0.08em on condensed display; +0.12em on uppercase labels; 0 on mono.

### Layout & Composition
- Strong **diagonal lines** break horizontal layouts. Key panels use `clip-path` polygon cuts on corners.
- **Cut corners:** Typical cut = 12–16px angled at 45°. Applied via `clip-path: polygon(...)`.
- **Asymmetric borders:** Panels may have a neon left/top border only, or a right accent stroke.
- **Visual flow via diagonals:** Angled dividers guide eye; implied motion and tension.
- **Clear hierarchy despite visual noise.** Neon accents guide attention, not distract.
- Grid: 12-column, 24px gutters. Panels are modular "cards" floating in dark space.

### Panels / Cards
- Dark base layer with subtle top-left gradient lighting (`radial-gradient` from corner).
- Neon border: 1px solid neon color, or a neon box-shadow glow (`0 0 8px #00FF87`).
- Cut corners via `clip-path`.
- Panels feel like floating, modular units.
- No heavy drop shadows — use ambient glow instead.
- Corner accent: small neon square/tick at panel corners (decorative element).

### Interaction States
- **Hover:** Neon glow/outline appears (`box-shadow: 0 0 12px <neon>`), slight brightness increase (+10%), optional flicker CSS animation.
- **Active/Selected:** Stronger color fill, neon background tint (`rgba(0,255,135,0.12)`), clear visual confirmation.
- **Disabled:** Dim gray text, no glow, reduced opacity (0.4).
- Feedback: **immediate, slightly exaggerated, "electric"**.

### Graffiti / Hand-drawn Accents
- Irregular neon SVG strokes (scribble underlines, rough brackets, marker highlights).
- Used **sparingly** — to emphasize 1–2 key elements per screen.
- Applied as SVG overlays, not structured UI.
- Feel: manual intervention, like someone drew on the screen.

### Animation
- **Flicker:** 0–2% opacity flicker on neon elements (`@keyframes flicker`).
- **Scan lines:** Subtle horizontal scan line overlay on panels.
- **Glitch offset:** Occasional X/Y translate glitch on key moments.
- **No soft easing** — prefer `linear` or `steps()` for terminal feel.
- **Blink cursor** on terminal elements.
- No spring physics, no bounce. Everything is mechanical.

### Imagery
- No photography in UI components.
- ASCII art / terminal art for decorative elements.
- Occasional glitch-texture overlays (repeating noise pattern, subtle).
- Color treatment if used: desaturated, cool (blue-tinted), high contrast.

### Borders & Radius
- **Corner radius:** 0–2px (near-sharp). Cut corners via `clip-path`, not `border-radius`.
- **Borders:** 1px solid. Neon for active; `#2A3449` (dim) for inactive panels.
- **Accent border:** 2px left or top neon highlight on active panels.

### Shadows & Elevation
- No traditional box shadows.
- Elevation via **neon glow**: `box-shadow: 0 0 8px`, `0 0 20px`, `0 0 40px` with neon color.
- Inner panel lighting: subtle `radial-gradient` in top-left corner.

### Spacing System
- Base unit: 4px. Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128px.

---

## ICONOGRAPHY

No icon system was provided in the source brief. The design system uses:
- **ASCII/Unicode characters** as primary micro-icons: `▸`, `▾`, `◈`, `✕`, `⬡`, `⟨⟩`, `[·]`, `//`.
- **Custom SVG accent shapes** in `assets/accents/`: diagonal cut marks, corner ticks, graffiti strokes.
- **No icon font or external icon CDN** — the terminal aesthetic favors text-symbol constructs.
- Emoji are **never** used.

---

## File Index

| Path | Description |
|------|-------------|
| `README.md` | This file — system overview + foundations |
| `colors_and_type.css` | CSS variables for all color + type tokens |
| `assets/` | Brand assets, accent SVGs |
| `preview/` | Design system preview cards (registered in Design System tab) |
| `ui_kits/app/` | Interactive UI kit — core app screens |
| `SKILL.md` | Agent skill descriptor |
