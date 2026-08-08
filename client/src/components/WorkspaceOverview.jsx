import React from 'react';
import { Button, Column, Grid, Tag, Tile } from '@carbon/react';
import { ArrowRight, ChartBar, Enterprise, Events, Group, Idea, Money, User } from '@carbon/icons-react';

const roleConfig = {
  brand: {
    eyebrow: 'Brand workspace', title: 'Move campaigns from brief to revenue.', icon: Enterprise,
    description: 'Plan creator programs, approve work, and see the commercial outcome in one governed workspace.',
    metrics: [['Active campaigns', '03'], ['Creators in pipeline', '42'], ['Verified ROAS', '7.89×']],
    cards: [
      ['Create a campaign', 'Set the brief, budget cap, audience, product claims, and approval rules.', Idea, 3, 'blue'],
      ['Source creators', 'Find vetted creators that fit your audience, reach, and performance targets.', User, 1, 'teal'],
      ['Measure revenue', 'Tie creator links and promo codes to conversion and ROAS.', ChartBar, 6, 'green']
    ]
  },
  agency: {
    eyebrow: 'Agency workspace', title: 'Operate every client and talent relationship with clarity.', icon: Group,
    description: 'Coordinate client campaigns, manage creator relationships, and protect delivery margins without spreadsheet handoffs.',
    metrics: [['Client workspaces', '06'], ['Talent on roster', '124'], ['Margin at risk', '₹1.2L']],
    cards: [
      ['Manage client campaigns', 'Switch between client briefs, approvals, spend, and delivery timelines.', Enterprise, 3, 'blue'],
      ['Run your talent roster', 'Match creators, track availability, and keep negotiation context together.', Group, 2, 'purple'],
      ['Track margin & reporting', 'Review fees, expected margin, client-ready outcomes, and attribution.', Money, 7, 'green']
    ]
  },
  creator: {
    eyebrow: 'Creator studio', title: 'Know what is due, what needs approval, and when you get paid.', icon: User,
    description: 'Your live collaboration hub for offers, content deliverables, feedback, performance, and payout status.',
    metrics: [['Open opportunities', '04'], ['Due this week', '02'], ['Available to withdraw', '₹48K']],
    cards: [
      ['Review opportunities', 'See brand briefs, proposed rates, deliverables, and negotiation status.', Events, 4, 'blue'],
      ['Deliver content', 'Submit video links, see compliance feedback, and handle revisions quickly.', Idea, 5, 'purple'],
      ['Payouts & performance', 'Follow verification, payout status, and results from your published content.', Money, 10, 'green']
    ]
  }
};

export default function WorkspaceOverview({ mode = 'brand', session, onNavigate }) {
  const config = roleConfig[mode] || roleConfig.brand;
  const Icon = config.icon;
  const name = session?.user?.name || (mode === 'creator' ? 'Creator' : 'Team');

  return <div style={{ color: '#fff', maxWidth: 1200, margin: '0 auto' }}>
    <Tile style={{ background: '#262626', borderLeft: '4px solid #0f62fe', padding: '2rem', marginBottom: '1.5rem' }}>
      <Tag type="blue" size="sm">{config.eyebrow}</Tag>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'start', marginTop: '1rem' }}>
        <div><h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 400 }}>Hi {name}, {config.title}</h1><p style={{ color: '#c6c6c6', maxWidth: 700, lineHeight: 1.5 }}>{config.description}</p></div>
        <Icon size={36} style={{ color: '#78a9ff', flexShrink: 0 }} />
      </div>
    </Tile>
    <Grid style={{ padding: 0, marginBottom: '1.5rem', rowGap: '1rem' }}>
      {config.metrics.map(([label, value]) => <Column key={label} lg={5} md={4} sm={4}><Tile style={{ background: '#262626', padding: '1.25rem' }}><div style={{ color: '#a8a8a8', fontSize: '.8rem' }}>{label}</div><div style={{ fontSize: '1.75rem', marginTop: '.4rem' }}>{value}</div></Tile></Column>)}
    </Grid>
    <h2 style={{ fontSize: '1.25rem', fontWeight: 400 }}>Your next actions</h2>
    <Grid style={{ padding: 0, rowGap: '1rem' }}>
      {config.cards.map(([title, description, CardIcon, tab, tag]) => <Column key={title} lg={5} md={4} sm={4}><Tile style={{ background: '#262626', padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column' }}><CardIcon size={24} style={{ color: '#78a9ff' }} /><h3 style={{ marginBottom: '.4rem' }}>{title}</h3><p style={{ color: '#a8a8a8', lineHeight: 1.45, flex: 1 }}>{description}</p><Button kind="ghost" size="sm" renderIcon={ArrowRight} onClick={() => onNavigate(tab)}>Open</Button></Tile></Column>)}
    </Grid>
  </div>;
}
