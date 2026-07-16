---
name: Ethereal Lens
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#bac9cc'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#849396'
  outline-variant: '#3b494c'
  surface-tint: '#00daf3'
  primary: '#c3f5ff'
  on-primary: '#00363d'
  primary-container: '#00e5ff'
  on-primary-container: '#00626e'
  inverse-primary: '#006875'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#efeceb'
  on-tertiary: '#313030'
  tertiary-container: '#d2d0cf'
  on-tertiary-container: '#5a5959'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9cf0ff'
  primary-fixed-dim: '#00daf3'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Noto Serif
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Noto Serif
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0.01em
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.2em
  ui-button:
    fontFamily: Manrope
    fontSize: 15px
    fontWeight: '600'
    lineHeight: '1.0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  section-padding: 80px
  stack-sm: 16px
  stack-md: 32px
---

## Brand & Style

The brand personality of this design system is sophisticated, artistic, and cinematic. It is designed for photography enthusiasts, professional artists, and curators who value visual storytelling over cluttered functional interfaces. The emotional response is one of "quiet focus"—where the UI recedes to let the high-resolution imagery lead the experience.

The design style is a blend of **Minimalism** and **Modern Editorial**. It leverages a deep, monochromatic foundation to create a "darkroom" atmosphere. High-contrast typography and generous whitespace ensure that every piece of content feels intentional and curated. The aesthetic is punctuated by precise, luminous accents that guide the user's attention without disrupting the visual harmony.

## Colors

The color palette is rooted in a pure dark mode experience. The primary background uses a near-black neutral to provide maximum depth.

- **Primary**: A vibrant cyan/teal (#00E5FF) used sparingly for active states, primary actions, and highlights. It represents light cutting through darkness.
- **Secondary**: Pure White (#FFFFFF) for high-contrast typography and primary UI elements like selected tabs.
- **Tertiary**: A muted off-white or light gray for secondary text and inactive chip backgrounds to maintain hierarchy.
- **Neutral**: The foundation is a deep black (#000000) for the background, with dark grays (#1A1A1A) used for subtle container differentiation.

## Typography

The typography strategy relies on a sharp contrast between an elegant, literary serif and a technical, modern sans-serif.

- **Headlines**: Use **Noto Serif** for all major headings and display text. It provides a timeless, editorial feel. Use tight letter-spacing for large display sizes to create a "high-fashion" impact.
- **Body & UI**: Use **Manrope** for body text and navigation. Its balanced, modern proportions ensure readability against dark backgrounds.
- **Overlines & Metadata**: Use **Space Grotesk** in all-caps for small labels, photography metadata, and categories to introduce a subtle technical/scientific undertone.

## Layout & Spacing

The design system utilizes a **Fixed Grid** model for large screens to maintain an editorial layout, transitioning to a fluid model for smaller devices.

- **Grid**: A 12-column grid for desktop with 24px gutters. Content is centered with a maximum width of 1200px.
- **Whitespace**: Generous vertical spacing (80px+) between sections is mandatory to allow the eyes to rest and the photos to breathe.
- **Responsive Behavior**: On mobile, margins reduce to 20px, and section spacing scales down to 48px. Image galleries should reflow from 3 columns to 1 column to maximize image size on narrow screens.

## Elevation & Depth

Depth in this system is achieved through **Tonal Layers** and **Backdrop Blurs** rather than traditional shadows.

- **Surfaces**: High-level containers (like navigation bars or hovering cards) use a semi-transparent black background with a heavy background blur (20px+) to create a "glass" effect that suggests they are floating above the content.
- **Outlines**: Use ultra-thin, low-opacity white borders (0.5px - 1px) to define boundaries between dark elements without adding visual weight.
- **Active States**: Elevation is signaled by luminosity. An active element is "brighter" (White or Cyan) than its inactive counterpart (Dark Gray).

## Shapes

The shape language is sophisticated and modern, favoring soft corners that contrast against the sharp edges of professional photography frames.

- **Primary Elements**: Buttons and tags use a "Rounded" (0.5rem) radius for a friendly yet professional feel.
- **Image Containers**: Photography cards utilize a larger `rounded-xl` (1.5rem) radius to soften the visual impact of the gallery and create a "smooth" viewport into the image.
- **Navigation Containers**: Use pill-shaped (full rounded) geometry for top-level navigation switchers to distinguish them from content-driven elements.

## Components

### Buttons & Chips
- **Primary (Active)**: Solid fill of Cyan or White. Text should be high-contrast (Black on Cyan, Black on White).
- **Secondary (Ghost)**: Transparent background with a thin 1px white border.
- **Filtering Chips**: Pill-shaped with a light gray background (#E0E0E0) for inactive states and primary fill for the active state.

### Cards
- **Image Cards**: Should be borderless with a subtle gradient overlay at the bottom to ensure white text (titles/metadata) remains legible over the photo.
- **Hover States**: Cards should subtly scale up (1.02x) on hover with an increased backdrop blur on text overlays.

### Navigation
- **Top Bar**: A floating, centered container with a blurred background. Use icons paired with labels for clarity. Icons should be thin-line style to match the refined typography.

### Input Fields
- Dark backgrounds with bottom-only borders are preferred for a minimalist look. Focus states use the Primary Cyan accent.