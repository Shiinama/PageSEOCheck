# Design Tokens (Futuristic Minimal, Borderless)

## Colors (OKLCH)

background: oklch(0.16 0.02 265)
foreground: oklch(0.97 0.01 260)

card: oklch(0.20 0.02 265)
card-foreground: var(--foreground)

popover: oklch(0.20 0.02 265)
popover-foreground: var(--foreground)

sidebar: oklch(0.18 0.02 265)
sidebar-foreground: var(--foreground)

primary: oklch(0.70 0.20 270)
primary-foreground: oklch(0.99 0.01 260)

secondary: oklch(0.30 0.03 260)
secondary-foreground: var(--foreground)

accent: oklch(0.8 0.16 270)
accent-foreground: oklch(0.18 0.03 270)

muted: oklch(0.24 0.02 265)
muted-foreground: oklch(0.72 0.04 265)

destructive: oklch(0.65 0.20 25)

border: oklch(0.35 0.02 265 / 60%)
input: oklch(0.40 0.02 265 / 80%)
ring: var(--primary)

chart-1: oklch(0.70 0.18 255)
chart-2: oklch(0.72 0.16 200)
chart-3: oklch(0.78 0.17 80)
chart-4: oklch(0.68 0.20 310)
chart-5: oklch(0.72 0.17 25)

## Shadows / Glow

shadow-glow: 0 0 20px oklch(0.70 0.20 270 / 0.10)
shadow-primary-glow: 0 0 24px oklch(0.70 0.20 270 / 0.35)
shadow-accent-glow: 0 0 16px oklch(0.78 0.15 210 / 0.30)

## Blur

blur-sm: blur(6px)
blur-md: blur(12px)
blur-lg: blur(20px)

## Radius

radius-sm: 8px
radius-md: 12px
radius-lg: 16px
radius-xl: 20px

## Spacing

space-1: 4px
space-2: 8px
space-3: 12px
space-4: 16px
space-5: 24px
space-6: 32px
space-7: 48px
space-8: 64px

## Typography

font-display: "Space Grotesk", system-ui, sans-serif
font-body: "Inter", system-ui, sans-serif
font-mono: "JetBrains Mono", monospace

## Component Tokens

button-bg: var(--color-primary)
button-fg: var(--color-primary-foreground)
button-glow: var(--shadow-primary-glow)

card-bg: var(--color-card)
card-blur: var(--blur-md)
card-shadow: var(--shadow-glow)

separator-line: var(--color-separator-line)
separator-glow: var(--shadow-separator-glow)

timeline-node-bg: var(--color-primary)
timeline-node-glow: var(--shadow-primary-glow)

input-bg: var(--color-input)
input-shadow-focus: 0 0 0 3px var(--color-ring)

## Motion

ease-orbit: cubic-bezier(0.22, 0.61, 0.36, 1)
ease-float: cubic-bezier(0.4, 0.13, 0.24, 1)

duration-fast: 120ms
duration-normal: 240ms
duration-slow: 420ms

## Global Rules (Very Important)

no-borders: true
no-outlines: true
use-spacing-for-hierarchy: true
use-lightness-contrast: true
use-glow-lines-as-separators: true
cards-are-glass: true
buttons-use-glow: true
all-ui-should-feel-floating: true
strict-theme-colors-only: true
color-usage-description: All colors must come from the @theme inline registered color tokens. If a new color is needed, first add it as a CSS variable under :root, then register it in @theme inline before use.
