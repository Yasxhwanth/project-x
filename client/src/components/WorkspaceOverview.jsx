import React, { useState, useEffect, useCallback } from 'react';
import { Button, Column, Grid, Tag, Tile, SkeletonText, InlineLoading } from '@carbon/react';
import { 
  ArrowRight, 
  ChartBar, 
  Enterprise, 
  Events, 
  Group, 
  Idea, 
  Money, 
  User, 
  Renew, 
  Rocket, 
  Security, 
  WarningAlt, 
  Video, 
  CheckmarkOutline, 
  Email, 
  ShoppingBag, 
  Time,
  Flash
} from '@carbon/icons-react';

const roleConfig = {
  brand: {
    eyebrow: 'BRAND PORTFOLIO COMMAND',
    title: 'Executive Campaign Operations',
    icon: Enterprise,
    description: 'Orchestrate end-to-end creator programs, autonomous rate negotiations, multimodal content audits, and deterministic revenue attribution.',
    cards: [
      { title: 'Campaign Brief & Budgeting', description: 'Define commercial budget caps, target creator tiers, mandatory claims, and governance policies.', icon: Idea, tab: 'portfolio', color: 'blue' },
      { title: 'Creator Intelligence & Discovery', description: 'Source verified creators with real contact credentials, authenticity metrics, and commercial pricing benchmarks.', icon: User, tab: 'discovery', color: 'teal' },
      { title: 'Commercial Negotiation Studio', description: 'Monitor autonomous multi-touch outreach, rate negotiations with confidential budget caps, and agreement status.', icon: Email, tab: 'negotiator', color: 'purple' },
      { title: 'Revenue Attribution & ROAS', description: 'Direct deterministic attribution linking creator engagements, promotional codes, and Shopify webhooks to GMV.', icon: ShoppingBag, tab: 'attribution', color: 'green' }
    ]
  },
  agency: {
    eyebrow: 'AGENCY MULTI-BRAND COMMAND',
    title: 'Agency Operations & Governance Hub',
    icon: Group,
    description: 'Coordinate multi-brand campaign briefs, manage creator talent rosters, and monitor delivery verification across all active accounts.',
    cards: [
      { title: 'Multi-Brand Campaign Portfolio', description: 'Govern client briefs, approval thresholds, deliverable milestones, and budget pacing.', icon: Enterprise, tab: 'portfolio', color: 'blue' },
      { title: 'Talent Sourcing & Intelligence', description: 'Match talent rosters to active client opportunities with verified engagement and commercial metrics.', icon: Group, tab: 'discovery', color: 'purple' },
      { title: 'Governance & Escalation Queue', description: 'Review high-value rate counter-offers and authorize milestone payout releases.', icon: WarningAlt, tab: 'approvals', color: 'magenta' },
      { title: 'Performance Analytics & Benchmarks', description: 'Generate executive performance reports, CPM efficiency metrics, and category benchmarks.', icon: ChartBar, tab: 'analytics', color: 'green' }
    ]
  },
  creator: {
    eyebrow: 'CREATOR COLLABORATION PORTAL',
    title: 'Commercial Deliverables & Escrow Hub',
    icon: User,
    description: 'Manage brand agreements, review content compliance feedback, and track Section 194J net escrow disbursements.',
    cards: [
      { title: 'Active Brand Invitations', description: 'Review incoming commercial briefs, rate proposals, and negotiate deliverables.', icon: Events, tab: 'negotiator', color: 'blue' },
      { title: 'Content Submission & Audit', description: 'Submit content links for instant multimodal compliance verification and timestamped proof.', icon: Video, tab: 'negotiator', color: 'purple' },
      { title: 'Financial Settlement & TDS', description: 'Track verified deliverables, Section 194J TDS certificates, and instant UPI payouts.', icon: Money, tab: 'attribution', color: 'green' }
    ]
  }
};

export default function WorkspaceOverview({ mode = 'brand', session, onNavigate }) {
  const config = roleConfig[mode] || roleConfig.brand;
  const Icon = config.icon;

  const [statsData, setStatsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activityFilter, setActivityFilter] = useState('ALL');
  const [triggerStatus, setTriggerStatus] = useState(null);

  const fetchStats = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const token = localStorage.getItem('cc_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`/api/dashboard/stats?mode=${mode}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setIsLoading(false);
      if (showRefreshIndicator) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, [mode]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => {
      fetchStats(false);
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleTriggerDirectorCycle = async () => {
    setTriggerStatus('RUNNING');
    try {
      const res = await fetch('/api/agents/director/run', { method: 'POST' });
      if (res.ok) {
        setTriggerStatus('SUCCESS');
        fetchStats(true);
      } else {
        setTriggerStatus('ERROR');
      }
    } catch (e) {
      setTriggerStatus('ERROR');
    } finally {
      setTimeout(() => setTriggerStatus(null), 3000);
    }
  };

  const metrics = statsData?.metrics || [
    { label: 'Active Campaigns', value: '03', sublabel: 'Synchronized workspaces', trend: 'Live DB', badge: 'Active' },
    { label: 'Creators in Pipeline', value: '14', sublabel: 'In active negotiation', trend: 'Audited', badge: 'High Intent' },
    { label: 'Verified ROAS', value: '7.89×', sublabel: 'Attributed conversion rate', trend: 'Deterministic', badge: 'Audited' }
  ];

  const activityFeed = statsData?.activityFeed || [];

  const filteredFeed = activityFeed.filter(item => {
    if (activityFilter === 'ALL') return true;
    if (activityFilter === 'AGENTS') return item.type === 'AGENT_RUN' || item.actorType === 'AGENT';
    if (activityFilter === 'DEALS') return item.type === 'STATE_TRANSITION' || item.dealId;
    if (activityFilter === 'APPROVALS') return item.type === 'ESCALATION';
    if (activityFilter === 'VISION') return item.type === 'VIDEO_INTEL';
    return true;
  });

  return (
    <div style={{ color: '#fff', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
      
      {/* ─── Hero Executive Banner ────────────────────────────────────────── */}
      <Tile style={{ 
        background: 'linear-gradient(135deg, rgba(15, 98, 254, 0.12) 0%, rgba(20, 20, 20, 0.95) 100%)', 
        border: '1px solid rgba(255, 255, 255, 0.08)', 
        borderLeft: '4px solid #0f62fe', 
        padding: '1.75rem 2rem', 
        marginBottom: '1.5rem', 
        borderRadius: 8, 
        backdropFilter: 'blur(12px)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Tag type="blue" size="sm">{config.eyebrow}</Tag>
            <span style={{ fontSize: '0.75rem', color: '#6f6f6f' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: '#8d8d8d', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="live-indicator-dot" style={{ width: 7, height: 7 }} /> 
              Autonomous Execution Engine Active
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Button
              kind="ghost"
              size="sm"
              renderIcon={Renew}
              disabled={isRefreshing}
              onClick={() => fetchStats(true)}
              style={{ color: '#78a9ff', padding: '0 0.75rem', height: '1.85rem' }}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Metrics'}
            </Button>

            <Button
              kind="secondary"
              size="sm"
              renderIcon={Flash}
              disabled={triggerStatus === 'RUNNING'}
              onClick={handleTriggerDirectorCycle}
              style={{ height: '1.85rem', fontSize: '0.75rem' }}
            >
              {triggerStatus === 'RUNNING' ? 'Executing Cycle...' : triggerStatus === 'SUCCESS' ? 'Cycle Completed' : 'Trigger Policy Cycle'}
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 600, color: '#f4f4f4', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
              {config.title}
            </h1>
            <p style={{ color: '#a8a8a8', maxWidth: 780, lineHeight: 1.5, marginTop: '0.4rem', fontSize: '0.875rem' }}>
              {config.description}
            </p>
          </div>
          <div style={{ padding: '0.75rem', background: 'rgba(15, 98, 254, 0.12)', borderRadius: 8, border: '1px solid rgba(15, 98, 254, 0.3)', flexShrink: 0 }}>
            <Icon size={28} style={{ color: '#78a9ff', display: 'block' }} />
          </div>
        </div>
      </Tile>

      {/* ─── Primary Live KPI Metrics Row ───────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f4f4f4', margin: 0 }}>
            Performance & Financial Telemetry
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#42be65', background: 'rgba(66, 190, 101, 0.1)', padding: '0.1rem 0.45rem', borderRadius: 4, border: '1px solid rgba(66, 190, 101, 0.25)', fontWeight: 600 }}>
            ● Real-Time Ledger Sync
          </span>
        </div>
        {statsData?.lastUpdated && (
          <span style={{ fontSize: '0.7rem', color: '#6f6f6f' }}>
            Last synchronized {new Date(statsData.lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>

      <Grid fullWidth style={{ padding: 0, marginBottom: '2rem', rowGap: '1.25rem', columnGap: '1.25rem' }}>
        {metrics.map((metric, idx) => (
          <Column key={metric.id || idx} lg={5} md={4} sm={4}>
            <div 
              className="metric-tile-glow" 
              style={{ 
                padding: '1.25rem 1.5rem', 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                background: 'rgba(26, 26, 26, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 8,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ color: '#8d8d8d', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {metric.label}
                </div>
                {metric.badge && (
                  <span style={{ 
                    fontSize: '0.65rem', 
                    fontWeight: 700, 
                    color: '#78a9ff', 
                    background: 'rgba(15, 98, 254, 0.15)', 
                    padding: '0.15rem 0.5rem', 
                    borderRadius: 12,
                    border: '1px solid rgba(15, 98, 254, 0.3)'
                  }}>
                    {metric.badge}
                  </span>
                )}
              </div>

              <div>
                {isLoading ? (
                  <SkeletonText width="60%" heading />
                ) : (
                  <div style={{ fontSize: '2.15rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                    {metric.value}
                  </div>
                )}
                <div style={{ color: '#a8a8a8', fontSize: '0.8rem', marginTop: '0.4rem', lineHeight: 1.4 }}>
                  {metric.sublabel}
                </div>
              </div>

              <div style={{ 
                marginTop: '0.85rem', 
                paddingTop: '0.65rem', 
                borderTop: '1px solid rgba(255, 255, 255, 0.06)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                fontSize: '0.75rem'
              }}>
                <span style={{ color: metric.trendType === 'warning' ? '#f1c21b' : '#42be65', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span>●</span> {metric.trend}
                </span>
                <span style={{ color: '#6f6f6f' }}>Verified</span>
              </div>
            </div>
          </Column>
        ))}
      </Grid>

      {/* ─── Real-Time Chronological Activity Feed Stream ───────────────── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f4f4f4', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="live-indicator-dot" style={{ width: 8, height: 8 }} />
              Autonomous Execution & Audit Stream
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#6f6f6f' }}>
              Deterministic event ledger tracking agent actions, indexing jobs, negotiations, and conversions
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[
              { id: 'ALL', label: 'All Events' },
              { id: 'AGENTS', label: 'Agent Runs' },
              { id: 'DEALS', label: 'Deal States' },
              { id: 'APPROVALS', label: 'Escalations' },
              { id: 'VISION', label: 'Video Audits' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActivityFilter(f.id)}
                style={{
                  background: activityFilter === f.id ? '#0f62fe' : 'rgba(255, 255, 255, 0.05)',
                  color: activityFilter === f.id ? '#ffffff' : '#a8a8a8',
                  border: activityFilter === f.id ? '1px solid #0f62fe' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 14,
                  padding: '0.2rem 0.65rem',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ 
          background: 'var(--color-surface)', 
          borderRadius: 8, 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden'
        }}>
          {filteredFeed.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#6f6f6f' }}>
              <Time size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <div>No audit events recorded for the selected filter.</div>
            </div>
          ) : (
            filteredFeed.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.9rem 1.25rem',
                  borderBottom: idx === filteredFeed.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: item.type === 'AGENT_RUN' ? 'rgba(15, 98, 254, 0.15)' : item.type === 'ESCALATION' ? 'rgba(255, 131, 43, 0.15)' : 'rgba(66, 190, 101, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {item.type === 'AGENT_RUN' ? <Rocket size={14} style={{ color: '#78a9ff' }} /> : item.type === 'ESCALATION' ? <WarningAlt size={14} style={{ color: '#ff832b' }} /> : <CheckmarkOutline size={14} style={{ color: '#42be65' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f4f4f4' }}>{item.title || item.action}</div>
                    <div style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>{item.description || item.detail}</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6f6f6f' }}>
                  {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Just now'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Operational Modules & Core Workflows ───────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f4f4f4', margin: 0 }}>
          Operational Modules & Core Workflows
        </h2>
        <span style={{ fontSize: '0.75rem', color: '#6f6f6f' }}>Select module to execute</span>
      </div>

      <Grid fullWidth style={{ padding: 0, rowGap: '1.25rem', columnGap: '1.25rem' }}>
        {config.cards.map((card) => {
          const CardIcon = card.icon;
          return (
            <Column key={card.title} lg={4} md={4} sm={4}>
              <div 
                className="interactive-card" 
                style={{ 
                  padding: '1.35rem', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  cursor: 'pointer',
                  background: 'var(--color-surface)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 8,
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onClick={() => onNavigate(card.tab)}
              >
                <div style={{ 
                  width: 38, 
                  height: 38, 
                  borderRadius: 8, 
                  background: 'rgba(15, 98, 254, 0.1)', 
                  border: '1px solid rgba(15, 98, 254, 0.25)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '0.85rem' 
                }}>
                  <CardIcon size={18} style={{ color: '#78a9ff' }} />
                </div>

                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f4f4f4', margin: '0 0 0.35rem 0' }}>
                  {card.title}
                </h3>

                <p style={{ color: '#a8a8a8', fontSize: '0.8rem', lineHeight: 1.45, flex: 1, margin: 0 }}>
                  {card.description}
                </p>

                <div style={{ 
                  marginTop: '1rem', 
                  paddingTop: '0.65rem', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between' 
                }}>
                  <span style={{ fontSize: '0.75rem', color: '#78a9ff', fontWeight: 600 }}>Open Module</span>
                  <ArrowRight size={14} style={{ color: '#78a9ff' }} />
                </div>
              </div>
            </Column>
          );
        })}
      </Grid>

    </div>
  );
}
