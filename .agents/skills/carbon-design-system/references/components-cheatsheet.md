# IBM Carbon React Component API Cheatsheet (Carbon v11)

This reference lists practical code examples for all major `@carbon/react` and `@carbon/icons-react` components used across the project.

---

## 1. Buttons & Action Icons

```jsx
import { Button, IconButton } from '@carbon/react';
import { Send, Add, TrashCan, Download } from '@carbon/icons-react';

// Primary Action
<Button kind="primary" size="md" renderIcon={Send} onClick={handleSend}>
  Send Proposal
</Button>

// Secondary / Cancel
<Button kind="secondary" size="md" onClick={handleSaveDraft}>
  Save as Draft
</Button>

// Ghost (Toolbar & Icons)
<Button kind="ghost" size="sm" renderIcon={Download} hasIconOnly iconDescription="Export CSV" />

// Danger
<Button kind="danger" size="sm" renderIcon={TrashCan}>
  Revoke Deal
</Button>
```

---

## 2. Form Controls & Inputs

```jsx
import { TextInput, NumberInput, TextArea, Select, SelectItem, Checkbox } from '@carbon/react';

// Text Input
<TextInput
  id="creator-email"
  labelText="Creator Email Address"
  placeholder="e.g. business@creator.in"
  helperText="Will be used for autonomous email negotiations."
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// Number Input (Rates & Caps)
<NumberInput
  id="offered-fee"
  label="Agreed Deliverable Fee (INR)"
  min={1000}
  max={5000000}
  step={5000}
  value={fee}
  onChange={(e, { value }) => setFee(value)}
/>

// Text Area (Briefs & Content Guidelines)
<TextArea
  id="campaign-brief"
  labelText="Mandatory Deliverable Guidelines"
  placeholder="Mention 3 key USPs and display promo code in description..."
  rows={4}
  value={brief}
  onChange={(e) => setBrief(e.target.value)}
/>

// Select Dropdown
<Select id="payout-type" labelText="Settlement Method" defaultValue="escrow">
  <SelectItem value="escrow" text="Verified Milestone Escrow" />
  <SelectItem value="instant" text="Direct UPI Instant Transfer" />
  <SelectItem value="neft" text="Corporate Bank Wire (NEFT/RTGS)" />
</Select>
```

---

## 3. Data Presentation & Tables

```jsx
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  TableToolbar,
  TableToolbarSearch,
  TableToolbarContent,
  Tag
} from '@carbon/react';

const headers = [
  { key: 'creator', header: 'Creator' },
  { key: 'niche', header: 'Niche' },
  { key: 'status', header: 'Status' },
  { key: 'payout', header: 'Agreed Payout' }
];

const rows = [
  {
    id: '1',
    creator: 'Tanmay Bhat',
    niche: 'Comedy',
    status: <Tag type="green">Approved</Tag>,
    payout: 'Rs. 70,000'
  }
];

<DataTable rows={rows} headers={headers}>
  {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
    <TableContainer title="Active Creator Deliverables" description="Real-time status of pipeline deals">
      <Table {...getTableProps()} size="lg">
        <TableHead>
          <TableRow>
            {headers.map(header => (
              <TableHeader {...getHeaderProps({ header })} key={header.key}>
                {header.header}
              </TableHeader>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow {...getRowProps({ row })} key={row.id}>
              {row.cells.map(cell => (
                <TableCell key={cell.id}>{cell.value}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )}
</DataTable>
```

---

## 4. Notifications & User Feedback

```jsx
import { InlineNotification, ToastNotification, ActionableNotification } from '@carbon/react';

// Status Alert inside view
<InlineNotification
  kind="success"
  title="Verification Passed"
  subtitle="VideoIntel detected promo code and ASCI disclosure at 01:24."
  onCloseButtonClick={() => setAlert(null)}
/>

// Risk Alert
<InlineNotification
  kind="error"
  title="Non-Compliant Content"
  subtitle="Competitor brand mention detected at 00:45. Deal marked for human review."
/>
```

---

## 5. Modals & Dialogs

```jsx
import { Modal } from '@carbon/react';

<Modal
  open={isOpen}
  modalHeading="Configure Escrow Payout"
  primaryButtonText="Authorize Release"
  secondaryButtonText="Cancel"
  onRequestSubmit={handleAuthorize}
  onRequestClose={() => setIsOpen(false)}
  size="md"
>
  <p style={{ marginBottom: '1rem', color: '#c6c6c6' }}>
    Authorizing this payment will instantly wire net fees after 10% Section 194J TDS deduction.
  </p>
  {/* Modal body inputs */}
</Modal>
```
