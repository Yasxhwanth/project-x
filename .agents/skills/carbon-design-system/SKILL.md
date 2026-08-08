---
name: carbon-design-system
description: Authoritative IBM Carbon Design System guidelines, component schemas, tokens, and UI layout rules for enterprise React applications.
---

# IBM Carbon Design System Skill & Rules

Use this skill when building or styling UI components with `@carbon/react`, `@carbon/icons-react`, and `@carbon/styles`.

## 🎨 Theme Tokens & Palette (Gray 100 Dark Mode `cds--g100`)

| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `background` | `#161616` | Main App Page & Canvas |
| `layer-01` | `#262626` | Card Tiles, Modals, Forms |
| `layer-02` | `#393939` | Active Hover State, Inputs |
| `primary` | `#0f62fe` | Carbon Blue Action Buttons |
| `support-success` | `#42be65` | Green (Verified Deals, Payouts) |
| `support-warning` | `#f1c21b` | Yellow (Pending Counter-Offers) |
| `support-error` | `#da1e28` | Red (Failed Audits, Rejections) |

---

## 📐 Layout & Component Best Practices

1. **Vertical Navigation (`SideNav`)**:
   - Always use fixed vertical `SideNav` (`SideNavItems`, `SideNavLink`) instead of horizontal overflow tabs to prevent horizontal scroll bars.

2. **Responsive 16-Column Grid (`Grid` / `Column`)**:
   ```jsx
   <Grid style={{ padding: 0, rowGap: '1.25rem', columnGap: '1.25rem' }}>
     <Column lg={8} md={4} sm={4}>
       <Tile style={{ background: '#262626' }}>...</Tile>
     </Column>
   </Grid>
   ```

3. **Status Badges (`Tag`)**:
   - Use Carbon `<Tag>` with `size="sm"` or `"md"` for status indicators (`blue`, `green`, `purple`, `teal`, `yellow`).
