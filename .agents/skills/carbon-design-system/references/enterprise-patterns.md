# IBM Carbon Enterprise UX Patterns

This guide outlines standard architectural patterns for complex two-sided marketplace interfaces (Brands, Agencies, Creators) built with IBM Carbon.

---

## 1. Master-Detail & Sidebar Layout

In high-density workflows (like Email Negotiations and Video QA):
- **Left Panel (Master List)**: 320px-360px wide list of active creator deals with status tags and search filtering.
- **Right Panel (Detail Studio)**: Flex-grow main pane showing the live email negotiation thread, AI reasoning logs, or multimodal video inspector.

```
+------------------+------------------------------------------------------+
| Deal List (340px)| Negotiation & Multimodal Inspector (Flex 1)          |
| [Search Deals  ] | +--------------------------------------------------+ |
| • Tanmay Bhat    | | Creator: Tanmay Bhat | Fee: Rs. 70,000           | |
| • Komal Pandey   | | [Live Email Thread]                              | |
| • Yashwanth      | | > AI: Sent brief for boAt Nirvana               | |
|                  | | < Creator: Counter-offer Rs. 75k                 | |
|                  | +--------------------------------------------------+ |
+------------------+------------------------------------------------------+
```

---

## 2. Real-Time KPI Cards (`metric-tile-glow`)

Metric tiles must clearly present:
1. **Category Label**: 12px uppercase, text-secondary (`#8d8d8d`).
2. **Primary Metric**: 24px-32px bold, text-primary (`#f4f4f4`).
3. **Trend or Context**: Micro-badge or subtitle indicating audit status, live DB sync, or attribution rate.
4. **Accent Glow Top Bar**: 1px gradient indicator on hover.

```jsx
<Tile className="metric-tile-glow" style={{ padding: '1.25rem' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: '0.75rem', color: '#8d8d8d', fontWeight: 600, textTransform: 'uppercase' }}>
      Audited ROAS
    </span>
    <Tag type="green" size="sm">Audited</Tag>
  </div>
  <div style={{ fontSize: '1.75rem', fontWeight: 600, color: '#f4f4f4', margin: '0.5rem 0' }}>
    7.89×
  </div>
  <div style={{ fontSize: '0.75rem', color: '#42be65' }}>
    +14.2% vs previous campaign
  </div>
</Tile>
```

---

## 3. Two-Sided Marketplace Status Tag Matrix

Maintain consistent status vocabulary across all tabs:

| Lifecycle State | Tag Type | Visual Meaning |
| :--- | :--- | :--- |
| **DISCOVERY** | `Tag type="blue"` | Creator sourced, profile parsed |
| **OUTREACH_SENT** | `Tag type="teal"` | Autonomous proposal emailed |
| **COUNTER_OFFER** | `Tag type="yellow"` | Rate negotiation in progress |
| **ESCALATED** | `Tag type="magenta"` | Exceeds autonomous threshold; needs human review |
| **AGREED** | `Tag type="purple"` | Deliverables & fee locked |
| **SUBMITTED** | `Tag type="cyan"` | Video draft uploaded for inspection |
| **VERIFIED** | `Tag type="green"` | Multimodal perception approved (ASCI + claims) |
| **PAID** | `Tag type="cool-gray"` | Section 194J TDS settled, escrow released |
| **REJECTED / BLOCKED** | `Tag type="red"` | Compliance violation or creator blocked |

---

## 4. Accessibility & Keyboard Navigation Checklist

1. **Focus Ring Visibility**: Ensure custom CSS doesn't suppress `outline: 2px solid #0f62fe` on interactive controls.
2. **Screen Reader Labels**: Provide `aria-label` or `labelText` on all icon-only buttons and form controls.
3. **Color Independence**: Never convey status exclusively with color — always pair color with text or an icon (`CheckmarkOutline` for pass, `WarningAlt` for warning).
4. **Target Sizing**: Keep all clickable touch targets at least 32px × 32px.
