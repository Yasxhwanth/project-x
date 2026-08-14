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

  return (
    <div style={{ color: '#fff', maxWidth: 1280, margin: '0 auto' }}>
      {/* Hero Welcome Banner */}
      <Tile style={{ background: 'linear-gradient(135deg, rgba(15, 98, 254, 0.08) 0%, rgba(26, 26, 26, 0.95) 100%)', border: '1px solid rgba(255, 255, 255, 0.08)', borderLeft: '4px solid #0f62fe', padding: '2rem 2.25rem', marginBottom: '1.75rem', borderRadius: 8, backdropFilter: 'blur(8px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <Tag type="blue" size="sm">{config.eyebrow}</Tag>
          <span style={{ fontSize: '0.75rem', color: '#6f6f6f' }}>•</span>
          <span style={{ fontSize: '0.75rem', color: '#8d8d8d', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span className="live-indicator-dot" style={{ width: 6, height: 6 }} /> 24/7 Autonomous AI Engine Online
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 300, color: '#f4f4f4', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
              Hi {name}, <span style={{ fontWeight: 600, color: '#ffffff' }}>{config.title}</span>
            </h1>
            <p style={{ color: '#a8a8a8', maxWidth: 740, lineHeight: 1.55, marginTop: '0.5rem', fontSize: '0.925rem' }}>
              {config.description}
            </p>
          </div>
          <div style={{ padding: '0.75rem', background: 'rgba(15, 98, 254, 0.1)', borderRadius: '12px', border: '1px solid rgba(15, 98, 254, 0.25)', flexShrink: 0 }}>
            <Icon size={32} style={{ color: '#78a9ff', display: 'block' }} />
          </div>
        </div>
      </Tile>

      {/* Primary KPI Metrics Row */}
      <Grid style={{ padding: 0, marginBottom: '2rem', rowGap: '1.25rem', columnGap: '1.25rem' }}>
        {config.metrics.map(([label, value]) => (
          <Column key={label} lg={5} md={4} sm={4}>
            <div className="metric-tile-glow" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ color: '#8d8d8d', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {label}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: '#ffffff', marginTop: '0.4rem', letterSpacing: '-0.02em' }}>
                {value}
              </div>
            </div>
          </Column>
        ))}
      </Grid>

      {/* Recommended Next Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 500, color: '#f4f4f4', margin: 0 }}>
          Your Next Actions & Workflows
        </h2>
        <span style={{ fontSize: '0.75rem', color: '#6f6f6f' }}>Select a workflow to launch</span>
      </div>

      <Grid style={{ padding: 0, rowGap: '1.25rem', columnGap: '1.25rem' }}>
        {config.cards.map(([title, description, CardIcon, tab]) => (
          <Column key={title} lg={5} md={4} sm={4}>
            <div 
              className="interactive-card" 
              style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
              onClick={() => onNavigate(tab)}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(15, 98, 254, 0.1)', border: '1px solid rgba(15, 98, 254, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <CardIcon size={20} style={{ color: '#78a9ff' }} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f4f4f4', margin: '0 0 0.4rem 0' }}>
                {title}
              </h3>
              <p style={{ color: '#a8a8a8', fontSize: '0.85rem', lineHeight: 1.5, flex: 1, margin: 0 }}>
                {description}
              </p>
              <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#78a9ff', fontWeight: 600 }}>Launch Module</span>
                <ArrowRight size={16} style={{ color: '#78a9ff' }} />
              </div>
            </div>
          </Column>
        ))}
      </Grid>
    </div>
  );
}
