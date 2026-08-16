# IBM Carbon Tokens & Themes Deep-Dive

## 1. Theme Family Overview

IBM Carbon supports four standard color themes:
- **`white`**: Light mode, pure white background (`#ffffff`).
- **`g10` (Gray 10)**: Light mode, light gray background (`#f4f4f4`).
- **`g90` (Gray 90)**: Dark mode, dark gray background (`#262626`).
- **`g100` (Gray 100)**: Deep dark mode, black/charcoal background (`#161616`) — **Default for Project X**.

---

## 2. Exhaustive Gray 100 Token Palette

### Background & Surface Layers
| Token | Variable | Hex Value | Role |
| :--- | :--- | :--- | :--- |
| `background` | `$background` | `#161616` | Main window & canvas background |
| `layer-01` | `$layer-01` | `#262626` | Card background, side panels, data table |
| `layer-02` | `$layer-02` | `#393939` | Hover states on cards, nested sub-panels |
| `layer-03` | `$layer-03` | `#525252` | Deeply nested cards, active toolbars |
| `layer-accent-01` | `$layer-accent-01` | `#393939` | Accent border on cards |
| `layer-selected-01` | `$layer-selected-01` | `#393939` | Selected row in table |

### Field & Input Tokens
| Token | Variable | Hex Value | Role |
| :--- | :--- | :--- | :--- |
| `field-01` | `$field-01` | `#262626` | Inputs on `$background` |
| `field-02` | `$field-02` | `#393939` | Inputs on `$layer-01` |
| `focus` | `$focus` | `#0f62fe` | 2px focus border on inputs/buttons |
| `focus-inset` | `$focus-inset` | `#ffffff` | Inset border on dark focus rings |

### Typography Tokens
| Token | Variable | Hex Value | Role |
| :--- | :--- | :--- | :--- |
| `text-primary` | `$text-primary` | `#f4f4f4` | Headings, primary labels, main numbers |
| `text-secondary` | `$text-secondary` | `#c6c6c6` | Body text, captions, secondary stats |
| `text-placeholder` | `$text-placeholder` | `#6f6f6f` | Input hint text, empty states |
| `text-helper` | `$text-helper` | `#8d8d8d` | Small metadata under inputs |
| `text-error` | `$text-error` | `#ff8389` | Validation error messages |
| `link-primary` | `$link-primary` | `#78a9ff` | Hyperlinks in dark mode |
| `link-hover` | `$link-hover` | `#a6c8ff` | Hovered hyperlinks |

### Semantic Feedback Tokens
| Semantic Role | Token | Hex | Associated State |
| :--- | :--- | :--- | :--- |
| **Success** | `$support-success` | `#42be65` | Deal finalized, KYC verified, Video passed |
| **Warning** | `$support-warning` | `#f1c21b` | Counter-offer pending, ASCI warning |
| **Error** | `$support-error` | `#da1e28` | Failed escrow, risk alert, non-compliant video |
| **Information** | `$support-info` | `#4589ff` | System notices, agent logs, sync status |
| **AI / Neural** | `$purple-60` | `#8a3ffc` | LLM reasoning, multimodal vision analysis |

---

## 3. SCSS Bridge & CSS Custom Properties

In `styles.scss`, declare CSS variables bridging Carbon tokens:

```scss
@use '@carbon/styles';

:root {
  --cds-background: #161616;
  --cds-layer-01: #262626;
  --cds-layer-02: #393939;
  --cds-layer-03: #525252;
  --cds-border-subtle: #262626;
  --cds-border-strong: #393939;
  --cds-text-primary: #f4f4f4;
  --cds-text-secondary: #c6c6c6;
  --cds-text-placeholder: #6f6f6f;
  --cds-interactive-01: #0f62fe;
  --cds-support-success: #42be65;
  --cds-support-warning: #f1c21b;
  --cds-support-error: #da1e28;
}
```

---

## 4. Typography Scale (IBM Plex Sans)

Carbon uses **IBM Plex Sans** for UI, **IBM Plex Mono** for code and timestamps, and **IBM Plex Serif** for editorial content.

| Style Name | Font Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `display-01` | `42px (2.625rem)` | `1.15` | `Light (300)` | Hero dashboard numbers |
| `heading-04` | `28px (1.75rem)` | `1.25` | `Regular (400)` | Page titles |
| `heading-03` | `20px (1.25rem)` | `1.30` | `SemiBold (600)` | Section headings, Card headers |
| `heading-02` | `16px (1.0rem)` | `1.35` | `SemiBold (600)` | Tile subtitles, Modal headers |
| `body-long-01`| `14px (0.875rem)`| `1.50` | `Regular (400)` | Paragraphs, deal negotiation chat |
| `body-short-01`| `14px (0.875rem)`| `1.30` | `Regular (400)` | Table cells, dropdown items |
| `label-01` | `12px (0.75rem)` | `1.30` | `Regular (400)` | Form labels, category captions |
| `code-01` | `12px (0.75rem)` | `1.30` | `Regular (400)` | Timestamps, promo codes, transaction IDs |
