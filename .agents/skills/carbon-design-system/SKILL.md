---
name: carbon-design-system
description: Authoritative and comprehensive IBM Carbon Design System (Carbon v11) guidelines, design tokens, component schemas, grid architecture, accessibility requirements, and styling best practices for enterprise React applications.
---

# IBM Carbon Design System (Carbon v11) Master Guide & Skill

This skill is the authoritative guide for building, refactoring, and maintaining enterprise React interfaces utilizing `@carbon/react`, `@carbon/icons-react`, and `@carbon/styles`.

---

## 🏛️ 1. Core Design Philosophy

IBM Carbon is built upon three fundamental tenets:
1. **Clarity & Purpose**: Every pixel, spacing unit, and token has deliberate functional intent. Avoid decorative fluff; prioritize information hierarchy, scannability, and high-density enterprise utility.
2. **Systemic Consistency**: Always use design tokens (`$layer-01`, `$layer-02`, `$support-success`, `$interactive-01`) rather than arbitrary hex values.
3. **Accessibility First (WCAG 2.1 AA)**: 4.5:1 minimum contrast for normal text, keyboard navigability on every interactive element, descriptive ARIA attributes, and explicit focus rings (`#0f62fe`).

---

## 🎨 2. Design Tokens & Theme Matrix (Gray 100 Dark Mode `cds--g100`)

The project standard is **Gray 100 (`g100`)**, IBM Carbon's deep dark theme.

| Carbon Token | Hex Code | Purpose & Component Usage |
| :--- | :--- | :--- |
| `$background` | `#161616` | Root app background, page canvas |
| `$layer-01` | `#262626` | First elevation surface: Card Tiles, Data Tables, Modals, SideNav |
| `$layer-02` | `#393939` | Second elevation surface: Dropdowns, Text Inputs, Nested Containers |
| `$layer-03` | `#525252` | Third elevation: Inner active surfaces, tooltips |
| `$field-01` | `#262626` | Input fields resting on `$background` |
| `$field-02` | `#393939` | Input fields resting on `$layer-01` tiles |
| `$border-subtle` | `#262626` / `rgba(255,255,255,0.06)` | Dividing lines, card borders |
| `$border-strong` | `#393939` / `rgba(255,255,255,0.16)` | Input bottom borders, active card borders |
| `$text-primary` | `#f4f4f4` | Page titles, card headers, primary values |
| `$text-secondary` | `#c6c6c6` | Body text, descriptions, metric labels |
| `$text-placeholder` | `#6f6f6f` | Input placeholders, inactive metadata |
| `$interactive-01` | `#0f62fe` | Primary action buttons, active navigation indicator |
| `$interactive-02` | `#393939` | Secondary action buttons |
| `$support-success` | `#42be65` | Verified deals, ASCI pass, successful transactions |
| `$support-warning` | `#f1c21b` | Pending review, counter-offers, warning notices |
| `$support-error` | `#da1e28` | Blocked creators, failed compliance, rejected payouts |
| `$support-info` | `#4589ff` | System status, agent insight badges |
| `$purple-60` | `#8a3ffc` | AI strategy, autonomous agents, neural analysis |

---

## 📐 3. The 2x Grid System (16-Column Responsive Grid)

Carbon uses a strict 16-column grid with a 4px base unit.

### Breakpoints & Columns
- **Small (`sm`)**: `< 672px` (4 columns, 16px gutter)
- **Medium (`md`)**: `672px - 1056px` (8 columns, 16px gutter)
- **Large (`lg`)**: `1056px - 1312px` (16 columns, 16px gutter)
- **Extra Large (`xlg`)**: `1312px - 1584px` (16 columns, 16px gutter)
- **Max (`max`)**: `≥ 1584px` (16 columns, 24px gutter)

### Grid Pattern in React
```jsx
import { Grid, Column, Tile } from '@carbon/react';

<Grid fullWidth style={{ padding: 0, rowGap: '1.25rem', columnGap: '1.25rem' }}>
  {/* 4-column KPI Card on desktop, 8-column on tablet, full width on mobile */}
  <Column lg={4} md={4} sm={4}>
    <Tile style={{ background: '#262626', borderRadius: 6 }}>
      <div className="metric-label">Active Campaigns</div>
      <div className="metric-value">12</div>
    </Tile>
  </Column>
  <Column lg={12} md={8} sm={4}>
    <Tile style={{ background: '#262626', borderRadius: 6 }}>
      {/* Main Data View */}
    </Tile>
  </Column>
</Grid>
```

---

## 📏 4. Spacing Scale (4px Base Units)

Never use arbitrary pixel margins or paddings.

| Spacing Token | Pixels | Rem | Typical Usage |
| :--- | :--- | :--- | :--- |
| `$spacing-01` | `2px` | `0.125rem` | Micro-offsets, border widths |
| `$spacing-02` | `4px` | `0.25rem` | Badge padding, icon-to-text gap |
| `$spacing-03` | `8px` | `0.5rem` | Inline button gap, tag margin |
| `$spacing-04` | `12px` | `0.75rem` | Compact list item padding |
| `$spacing-05` | `16px` | `1rem` | Card internal padding, form row spacing |
| `$spacing-06` | `24px` | `1.5rem` | Section spacing, container gutters |
| `$spacing-07` | `32px` | `2rem` | Page margins, major section dividers |
| `$spacing-08` | `40px` | `2.5rem` | Hero banner padding |
| `$spacing-09` | `48px` | `3rem` | Header height (`top: 3rem`) |

---

## 🧩 5. Component Library Standard Usage (`@carbon/react`)

### 1. **Buttons (`Button`)**
```jsx
import { Button } from '@carbon/react';
import { Send, Add } from '@carbon/icons-react';

<Button kind="primary" size="md" renderIcon={Send}>
  Send Proposal
</Button>
<Button kind="secondary" size="md">
  Save Draft
</Button>
<Button kind="ghost" size="sm" renderIcon={Add} hasIconOnly iconDescription="Add item" />
<Button kind="danger" size="sm">
  Revoke Access
</Button>
```

### 2. **Status Badges (`Tag`)**
Use Carbon tags with consistent semantic color associations:
- `Tag type="green"`: Live, Verified, Paid, Approved
- `Tag type="blue"`: Active, Campaign In Progress, Default Platform
- `Tag type="purple"`: AI Agent, VideoIntel, ML Analysis
- `Tag type="yellow"`: Pending Counter-Offer, Escalation Required
- `Tag type="red"`: Failed Audit, Blocked, Risk Policy Triggered
- `Tag type="cool-gray"`: Draft, Archived, Idle

### 3. **Tiles & Cards (`Tile`, `ExpandableTile`, `ClickableTile`)**
```jsx
import { Tile, ClickableTile } from '@carbon/react';

<Tile className="surface-card" style={{ padding: '1.25rem' }}>
  <div style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase' }}>Audited CPM</div>
  <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f4f4f4' }}>Rs. 18.50</div>
</Tile>
```

### 4. **Vertical Navigation (`SideNav`)**
- Always keep navigation fixed vertical with `width: 236px` and `top: 3rem`.
- Use `SideNavItems`, `SideNavLink`, with Carbon icons.
- Avoid top horizontal scroll tabs for primary application routing.

### 5. **Data Table (`DataTable`)**
- Use Carbon's built-in sorting, filtering, and batch action toolbar.
- Header background should be `#1a1a1a`, with row hover `#262626`.

### 6. **Modals (`Modal`)**
- Always include `primaryButtonText`, `secondaryButtonText`, `onRequestSubmit`, `onRequestClose`.
- Body content should use `$layer-01` background and high-contrast inputs.

---

## 🚫 6. Carbon Anti-Patterns (What to Avoid)

1. ❌ **Arbitrary Non-Token Hex Colors**:
   - BAD: `background: #112233; color: #abcdef;`
   - GOOD: `background: var(--color-surface); color: var(--color-text);`
2. ❌ **Horizontal Tab Overflow**:
   - BAD: Stacking 15 tabs in a horizontal header bar with a horizontal scrollbar.
   - GOOD: Fixed vertical `SideNav` grouped by semantic categories (`WORKSPACE`, `CAMPAIGNS`, `APPROVALS`, `INSIGHTS`, `SYSTEM`).
3. ❌ **Unstyled HTML Inputs**:
   - BAD: `<input type="text" />`
   - GOOD: `<TextInput id="deal-price" labelText="Agreed Fee" placeholder="Rs. 50,000" />`
4. ❌ **Low-Contrast Gray-on-Gray Text**:
   - BAD: `#444444` text on `#161616` background (fails WCAG contrast).
   - GOOD: `#c6c6c6` (secondary) or `#f4f4f4` (primary) on `#161616`.
5. ❌ **Inline Alert Dialogs instead of Notifications**:
   - BAD: `window.alert('Saved!')`
   - GOOD: `<InlineNotification kind="success" title="Deal Saved" subtitle="Proposal dispatched to creator." />`

---

## 📚 7. Detailed References

For specialized component schemas and styling bridges, see:
- [Design Tokens & Themes Reference](./references/tokens-and-themes.md)
- [Carbon React Components Cheatsheet](./references/components-cheatsheet.md)
- [Enterprise Layout Patterns](./references/enterprise-patterns.md)
