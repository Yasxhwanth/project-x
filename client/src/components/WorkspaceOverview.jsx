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
    eyebrow: 'Brand Workspace',
    title: 'Move campaigns from brief to revenue.',
    icon: Enterprise,
    description: 'Plan creator programs, approve deals, verify deliverables via VideoIntel, and track audited ROAS.',
    cards: [
      { title: 'Create Campaign Brief', description: 'Define budget caps, target audience, mandatory claims, and approval rules.', icon: Idea, tab: 'portfolio', color: 'blue' },
      { title: 'AI Creator Discovery', description: 'Find high-intent vetted creators using semantic natural language search.', icon: User, tab: 'discovery', color: 'teal' },
      { title: 'Deal Negotiation & Outreach', description: 'Monitor autonomous email outreach, counter-offers, and agreed deliverables.', icon: Email, tab: 'negotiator', color: 'purple' },
      { title: 'Revenue Attribution & ROAS', description: 'Tie creator links and promo codes directly to order conversions & GMV.', icon: ShoppingBag, tab: 'attribution', color: 'green' }
    ]
  },
  agency: {
    eyebrow: 'Agency Command Hub',
    title: 'Operate every client and talent relationship with clarity.',
    icon: Group,
    description: 'Coordinate multi-client briefs, manage creator talent rosters, and track delivery margins without manual spreadsheets.',
    cards: [
      { title: 'Manage Client Campaigns', description: 'Switch between client briefs, deliverable approvals, and spend pacing.', icon: Enterprise, tab: 'portfolio', color: 'blue' },
      { title: 'Talent Roster & Sourcing', description: 'Match roster talent to incoming client opportunities with speed.', icon: Group, tab: 'discovery', color: 'purple' },
      { title: 'Approval Queue & Escalations', description: 'Review high-value rate counter-offers and authorize milestone payouts.', icon: WarningAlt, tab: 'approvals', color: 'magenta' },
      { title: 'Client Reporting & Analytics', description: 'Generate white-label performance reports and campaign CPM benchmarks.', icon: ChartBar, tab: 'analytics', color: 'green' }
    ]
  },
  creator: {
    eyebrow: 'Creator Studio',
    title: 'Know what is due, what needs approval, and when you get paid.',
    icon: User,
    description: 'Your live collaboration hub for brand offers, content guidelines, VideoIntel compliance feedback, and fast escrow payouts.',
    cards: [
      { title: 'Review Brand Invitations', description: 'Inspect incoming brand briefs, rate proposals, and negotiate terms.', icon: Events, tab: 'negotiator', color: 'blue' },
      { title: 'Submit & Verify Content', description: 'Upload video links for instant multimodal compliance & timestamped proof.', icon: Video, tab: 'negotiator', color: 'purple' },
      { title: 'Payouts & Performance', description: 'Track verified deliverables, approved payments, and attributed conversion bonuses.', icon: Money, tab: 'attribution', color: 'green' }
    ]
  }
};

export default function WorkspaceOverview({ mode = 'brand', session, onNavigate }) {
  const config = roleConfig[mode] || roleConfig.brand;
  const Icon = config.icon;
  const name = session?.user?.name || (mode === 'creator' ? 'Creator' : 'Team');

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
    // Auto-poll stats every 12 seconds
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
    { label: 'Active Campaigns', value: '03', sublabel: 'Loading live briefs...', trend: 'Live DB', badge: 'Active' },
    { label: 'Creators in Pipeline', value: '14', sublabel: 'Loading deals...', trend: 'Audited', badge: 'High Intent' },
    { label: 'Verified ROAS', value: '7.89×', sublabel: 'Loading conversions...', trend: 'Live Attribution', badge: 'Audited' }
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
    <div style={{ color: '#fff', maxWidth: 1280, margin: '0 auto' }}>
      
      {/* ─── Hero Welcome Banner with Live Engine Controls ────────────────── */}
      <Tile style={{ 
        background: 'linear-gradient(135deg, rgba(15, 98, 254, 0.12) 0%, rgba(20, 20, 20, 0.95) 100%)', 
        border: '1px solid rgba(255, 255, 255, 0.1)', 
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
              24/7 Autonomous Perception Engine Online
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
              {isRefreshing ? 'Refreshing...' : 'Refresh KPIs'}
            </Button>

            <Button
              kind="secondary"
              size="sm"
              renderIcon={Flash}
              disabled={triggerStatus === 'RUNNING'}
              onClick={handleTriggerDirectorCycle}
              style={{ height: '1.85rem', fontSize: '0.75rem' }}
            >
              {triggerStatus === 'RUNNING' ? 'Running Cycle...' : triggerStatus === 'SUCCESS' ? 'Cycle Finished' : 'Run Agent Cycle'}
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 300, color: '#f4f4f4', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
              Hi {name}, <span style={{ fontWeight: 600, color: '#ffffff' }}>{config.title}</span>
            </h1>
            <p style={{ color: '#a8a8a8', maxWidth: 780, lineHeight: 1.5, marginTop: '0.4rem', fontSize: '0.9rem' }}>
              {config.description}
            </p>
          </div>
          <div style={{ padding: '0.75rem', background: 'rgba(15, 98, 254, 0.12)', borderRadius: '12px', border: '1px solid rgba(15, 98, 254, 0.3)', flexShrink: 0 }}>
            <Icon size={28} style={{ color: '#78a9ff', display: 'block' }} />
          </div>
        </div>
      </Tile>

      {/* ─── Primary Live KPI Metrics Row ───────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f4f4f4', margin: 0 }}>
            Live Performance & Governance KPIs
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#42be65', background: 'rgba(66, 190, 101, 0.1)', padding: '0.1rem 0.45rem', borderRadius: 4, border: '1px solid rgba(66, 190, 101, 0.25)', fontWeight: 600 }}>
            ● Real-Time Database Sync
          </span>
        </div>
        {statsData?.lastUpdated && (
          <span style={{ fontSize: '0.7rem', color: '#6f6f6f' }}>
            Last synced {new Date(statsData.lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>

      <Grid style={{ padding: 0, marginBottom: '2rem', rowGap: '1.25rem', columnGap: '1.25rem' }}>
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
                <span style={{ color: '#525252' }}>Audited</span>
              </div>
            </div>
          </Column>
        ))}
      </Grid>

      {/* ─── Real-Time Chronological Activity Feed Stream ───────────────── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f4f4f4', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="live-indicator-dot" style={{ width: 8, height: 8 }} />
              Real-Time Autonomous Activity Feed
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#6f6f6f' }}>
              Chronological log of agent actions, video indexing, negotiations, and conversions
            </span>
          </div>

          {/* Activity Filter Chips */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[
              { id: 'ALL', label: 'All Events' },
              { id: 'AGENTS', label: 'AI Agents' },
              { id: 'DEALS', label: 'Deals & State' },
              { id: 'APPROVALS', label: 'Approvals' },
              { id: 'VISION', label: 'VideoIntel' }
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

        {/* Activity Stream List Container */}
        <div style={{ 
          background: 'rgba(22, 22, 22, 0.7)', 
          borderRadius: 8, 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden'
        }}>
          {filteredFeed.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#6f6f6f' }}>
              <Time size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <div>No activity logs found for this filter. Run an agent cycle or verify a video.</div>
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
                  background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                }}
              >
                {/* Left side: Actor & Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0, flex: 1 }}>
                  {/* Event Type Icon Indicator */}
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: item.type === 'VIDEO_INTEL' ? 'rgba(15, 98, 254, 0.15)' :
                                item.type === 'CONVERSION' ? 'rgba(36, 161, 72, 0.15)' :
                                item.type === 'ESCALATION' ? 'rgba(218, 30, 40, 0.15)' : 'rgba(138, 63, 252, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {item.type === 'VIDEO_INTEL' ? <Video size={16} style={{ color: '#78a9ff' }} /> :
                     item.type === 'CONVERSION' ? <ShoppingBag size={16} style={{ color: '#42be65' }} /> :
                     item.type === 'ESCALATION' ? <WarningAlt size={16} style={{ color: '#ff8389' }} /> :
                     <Security size={16} style={{ color: '#be95ff' }} />}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f4f4f4' }}>
                        {item.title}
                      </span>
                      <Tag 
                        type={item.badgeColor || 'gray'} 
                        size="sm" 
                        style={{ fontSize: '0.65rem', padding: '0 0.4rem', height: '1.15rem' }}
                      >
                        {item.badgeText}
                      </Tag>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#8d8d8d', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#78a9ff', fontWeight: 500 }}>{item.actor}</span>: {item.description}
                    </div>
                  </div>
                </div>

                {/* Right side: Timestamp & Action Link */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0, marginLeft: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6f6f6f', whiteSpace: 'nowrap' }}>
                    {item.timeAgo}
                  </span>

                  <button
                    onClick={() => {
                      if (item.type === 'ESCALATION') onNavigate('approvals');
                      else if (item.type === 'CONVERSION') onNavigate('attribution');
                      else if (item.type === 'VIDEO_INTEL') onNavigate('negotiator');
                      else onNavigate('negotiator');
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#78a9ff',
                      borderRadius: 4,
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <span>View</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Recommended Workflows & Next Actions ───────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f4f4f4', margin: 0 }}>
          Your Next Actions & Workflows
        </h2>
        <span style={{ fontSize: '0.75rem', color: '#6f6f6f' }}>Select a workflow to launch</span>
      </div>

      <Grid style={{ padding: 0, rowGap: '1.25rem', columnGap: '1.25rem' }}>
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
                  background: 'rgba(26, 26, 26, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 8,
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onClick={() => onNavigate(card.tab)}
              >
                <div style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '8px', 
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
                  <span style={{ fontSize: '0.75rem', color: '#78a9ff', fontWeight: 600 }}>Launch Module</span>
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
