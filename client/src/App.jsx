import React, { useState, useEffect } from 'react';
import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SideNav,
  SideNavItems,
  SideNavLink,
  Tag,
  Theme,
  SkipToContent,
} from '@carbon/react';
import {
  Search,
  Email,
  Video,
  Currency,
  Idea,
  ChartBar,
  Enterprise,
  UserAvatar,
  Settings,
  Security,
  ShoppingBag,
  Rocket,
  WarningAltFilled,
  DocumentDownload,
  ChevronRight,
  OverflowMenuHorizontal,
  CheckmarkFilled,
  Renew,
  Launch,
} from '@carbon/icons-react';

import CreatorSearch from './components/CreatorSearch';
import CreatorCrmPipeline from './components/CreatorCrmPipeline';
import CampaignStrategyGenerator from './components/CampaignStrategyGenerator';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import CampaignBuilder from './components/CampaignBuilder';
import EmailNegotiator from './components/EmailNegotiator';
import VideoVerification from './components/VideoVerification';
import PayoutDashboard from './components/PayoutDashboard';
import AgentControlPlane from './components/AgentControlPlane';
import HITLApprovalInbox from './components/HITLApprovalInbox';
import AttributionDashboard from './components/AttributionDashboard';
import AuthModal from './components/AuthModal';
import OrgSettingsModal from './components/OrgSettingsModal';
import WelcomeLaunchpad from './components/WelcomeLaunchpad';
import WorkspaceOverview from './components/WorkspaceOverview';
import AgencyCommandCenter from './components/AgencyCommandCenter';
import CampaignPortfolioModal from './components/CampaignPortfolioModal';
import CampaignCloseoutReport from './components/CampaignCloseoutReport';

// ─── Nav Schema ─────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    id: 'workspace',
    label: 'WORKSPACE',
    items: [
      { id: 'overview',   label: 'Dashboard',         icon: Rocket,           description: 'Campaign operations & telemetry' },
    ],
  },
  {
    id: 'campaigns',
    label: 'CAMPAIGNS',
    items: [
      { id: 'portfolio',    label: 'Campaigns Hub',     icon: Enterprise,       description: 'Manage briefs & budget pacing' },
      { id: 'discovery',    label: 'Creator Discovery', icon: Search,           description: 'Find verified talent' },
      { id: 'negotiator',   label: 'Outreach & Deals',  icon: Email,            badgeKey: 'deals', description: 'Commercial email negotiations' },
      { id: 'verification', label: 'Video QA & ASCI',   icon: Video,            badgeKey: 'videos', description: 'Multimodal content compliance' },
      { id: 'payouts',      label: 'Payouts & TDS',     icon: Currency,         description: 'Section 194J escrow settlement' },
    ],
  },
  {
    id: 'approvals',
    label: 'APPROVALS & GOVERNANCE',
    items: [
      { id: 'approvals', label: 'Approval Inbox', icon: WarningAltFilled, badgeKey: 'approvals', description: 'Human-in-the-loop escalation queue' },
    ],
  },
  {
    id: 'insights',
    label: 'INSIGHTS & REPORTING',
    items: [
      { id: 'closeout',     label: 'Closeout Report',  icon: DocumentDownload, description: 'Executive stakeholder report' },
      { id: 'attribution',  label: 'Attribution',      icon: ShoppingBag,      description: 'Shopify GMV & ROAS tracking' },
      { id: 'analytics',    label: 'Analytics',        icon: ChartBar,         description: 'Market benchmarks & performance' },
    ],
  },
  {
    id: 'system',
    label: 'AUTONOMOUS SYSTEM',
    items: [
      { id: 'strategy',      label: 'AI Strategy',    icon: Idea,     description: 'Creator portfolio mix generator' },
      { id: 'control_plane', label: 'AI Governance',  icon: Security, description: 'State machines & event stream' },
    ],
  },
];

const PAGE_TITLES = {
  overview:      'Dashboard',
  portfolio:     'Campaigns Hub',
  discovery:     'Creator Discovery',
  negotiator:    'Outreach & Deals',
  verification:  'Video QA & ASCI Compliance',
  payouts:       'Payouts & 194J TDS',
  approvals:     'Approval Inbox',
  closeout:      'Client Closeout Report',
  attribution:   'Revenue Attribution',
  analytics:     'Analytics',
  strategy:      'AI Strategy',
  control_plane: 'AI Governance',
};

const VALID_TABS = Object.keys(PAGE_TITLES);

// ─── User Initials Avatar ────────────────────────────────────────────────────
function UserInitialsAvatar({ name, size = 28 }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';
  return (
    <span
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg, #0f62fe 0%, #0043ce 100%)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 700, color: '#ffffff',
        flexShrink: 0, letterSpacing: '0.02em',
        boxShadow: '0 0 0 2px rgba(15,98,254,0.4)',
      }}
    >
      {initials}
    </span>
  );
}

// ─── Active Campaign Header Button ───────────────────────────────────────────
function CampaignPill({ campaign, onClick }) {
  if (!campaign) return null;
  const name = campaign.productName || campaign.product_name || 'Active Campaign';
  const brand = campaign.brandName || campaign.brand_name || 'Brand';
  return (
    <button
      onClick={onClick}
      className="topbar-campaign-pill"
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0 0.85rem', height: '2.1rem',
        background: 'rgba(15, 98, 254, 0.08)',
        border: '1px solid rgba(15, 98, 254, 0.28)',
        borderRadius: '2rem',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        marginRight: '0.5rem',
      }}
      title="Click to switch campaign brief"
    >
      <span className="live-indicator-dot" />
      <span style={{ fontSize: '0.75rem', color: '#8fb4ff', fontWeight: 600 }}>
        {brand}
      </span>
      <ChevronRight size={10} style={{ color: 'rgba(143,180,255,0.5)' }} />
      <span style={{ fontSize: '0.75rem', color: '#f4f4f4', fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
      <OverflowMenuHorizontal size={14} style={{ color: '#78a9ff', marginLeft: 2 }} />
    </button>
  );
}

// ─── Nav Section Divider ─────────────────────────────────────────────────────
function NavSectionLabel({ label }) {
  return (
    <div style={{
      padding: '0.85rem 1rem 0.35rem',
      fontSize: '0.625rem',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: '#6f6f6f',
      userSelect: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <span>{label}</span>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && VALID_TABS.includes(hash)) return hash;
    const saved = localStorage.getItem('cc_active_tab');
    if (saved && VALID_TABS.includes(saved)) return saved;
    return 'overview';
  };

  const [currentTab, setCurrentTab] = useState(getInitialTab);
  const [activeDeal, setActiveDeal]           = useState(null);
  const [activeCampaign, setActiveCampaign]   = useState(null);
  const [campaigns, setCampaigns]             = useState([]);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen]         = useState(false);
  const [isOrgSettingsOpen, setIsOrgSettingsOpen]     = useState(false);
  const [session, setSession]                         = useState(null);
  const [workspaceMode, setWorkspaceMode]             = useState(() => localStorage.getItem('cc_workspace_mode') || 'brand');
  const [navCounts, setNavCounts]                     = useState({ approvals: 0, deals: 0, videos: 0 });
  const [forceCreateNewCampaign, setForceCreateNewCampaign]   = useState(false);
  const [selectedWorkspaceCampaign, setSelectedWorkspaceCampaign] = useState(null);
  const [navHovered, setNavHovered] = useState(null);

  // Sync tab to URL and localStorage
  useEffect(() => {
    localStorage.setItem('cc_active_tab', currentTab);
    if (window.location.hash.replace('#', '') !== currentTab) {
      window.location.hash = currentTab;
    }
  }, [currentTab]);

  useEffect(() => {
    localStorage.setItem('cc_workspace_mode', workspaceMode);
  }, [workspaceMode]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && VALID_TABS.includes(hash) && hash !== currentTab) setCurrentTab(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentTab]);

  useEffect(() => {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('gmail_status') || params.get('gmail_error')) {
        window.history.replaceState({}, document.title, window.location.pathname + (window.location.hash || ''));
      }
    }
    fetchSession();
    fetchActiveCampaign();
    fetchNavTelemetry();
    const iv = setInterval(fetchNavTelemetry, 25000);
    return () => clearInterval(iv);
  }, []);

  const fetchNavTelemetry = async () => {
    try {
      // 1. Pending Approvals
      const resEsc = await fetch('/api/agents/escalations');
      let pendingCount = 0;
      if (resEsc.ok) {
        const data = await resEsc.json();
        pendingCount = Array.isArray(data) ? data.filter(t => t.status === 'PENDING').length : 0;
      }

      // 2. Active Deals & Videos
      const resDeals = await fetch('/api/deals');
      let activeDeals = 0;
      let submittedVideos = 0;
      if (resDeals.ok) {
        const dealsData = await resDeals.json();
        const dealList = Array.isArray(dealsData) ? dealsData : dealsData.deals || [];
        activeDeals = dealList.filter(d => d.status === 'NEGOTIATING' || d.status === 'INVITED').length;
        submittedVideos = dealList.filter(d => d.status === 'VIDEO_SUBMITTED').length;
      }

      setNavCounts({
        approvals: pendingCount,
        deals: activeDeals,
        videos: submittedVideos
      });
    } catch {}
  };

  const fetchSession = async () => {
    try {
      const token = localStorage.getItem('cc_token');
      if (!token) return;
      const res = await fetch('/api/auth/session', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setSession(data);
        if (data.user.role === 'Agency Admin') setWorkspaceMode('agency');
        if (data.user.role === 'Creator') setWorkspaceMode('creator');
      } else setSession(null);
    } catch { setSession(null); }
  };

  const fetchActiveCampaign = async () => {
    try {
      const res  = await fetch('/api/campaigns');
      const data = await res.json();
      const list = data?.campaigns || data;
      if (Array.isArray(list) && list.length > 0) {
        setCampaigns(list);
        const savedId = localStorage.getItem('cc_active_campaign_id');
        setActiveCampaign((savedId && list.find(c => c.id === savedId)) || list[0]);
      }
    } catch {}
  };

  const handleSetActiveCampaign = (c) => {
    if (c) { setActiveCampaign(c); if (c.id) localStorage.setItem('cc_active_campaign_id', c.id); }
  };

  const handleSelectCreatorForOutreach = (deal) => {
    if (deal) setActiveDeal(deal);
    setCurrentTab('negotiator');
  };

  const handleViewDeal = async (deal, campaignId) => {
    if (deal) setActiveDeal(deal);
    if (campaignId) {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}`);
        if (res.ok) setActiveCampaign(await res.json());
      } catch {}
    }
    setCurrentTab('negotiator');
  };

  // Find active section for breadcrumb
  let activeSectionLabel = '';
  for (const sec of NAV_SECTIONS) {
    if (sec.items.find(i => i.id === currentTab)) { activeSectionLabel = sec.label; break; }
  }

  return (
    <Theme theme="g100">
      <div className="cds--g100 creatorconnect-app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* ── Carbon Header ────────────────────────────────────────── */}
        <Header aria-label="Project X">
          <SkipToContent />

          {/* Logo + Brand */}
          <HeaderName href="#overview" prefix="" style={{ gap: '0.65rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            <span className="app-logo-mark">X</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ color: '#f4f4f4', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '-0.01em' }}>Project X</span>
              <span style={{ color: '#8d8d8d', fontSize: '0.75rem', fontWeight: 400 }}>OS</span>
            </div>
            <Tag type="blue" size="sm" style={{ marginLeft: '0.25rem', borderRadius: '4px', fontSize: '0.625rem', fontWeight: 700 }}>
              Enterprise
            </Tag>
          </HeaderName>

          <HeaderGlobalBar>
            {/* Active Campaign Switcher */}
            <CampaignPill campaign={activeCampaign} onClick={() => setIsCampaignModalOpen(true)} />

            {/* Workspace Mode Badge / Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', marginRight: '0.75rem' }}>
              <Tag 
                type={workspaceMode === 'agency' ? 'purple' : 'teal'} 
                size="md"
                style={{ cursor: 'pointer', fontWeight: 600, margin: 0 }}
                onClick={() => setWorkspaceMode(workspaceMode === 'brand' ? 'agency' : 'brand')}
                title="Click to toggle Brand / Agency console mode"
              >
                {workspaceMode === 'agency' ? 'Agency Mode' : 'Brand Console'}
              </Tag>
            </div>

            {/* Pending Approvals Bell */}
            <HeaderGlobalAction
              aria-label={`${navCounts.approvals} pending approvals`}
              tooltipAlignment="end"
              onClick={() => setCurrentTab('approvals')}
              style={{ position: 'relative' }}
            >
              <WarningAltFilled size={20} style={{ color: navCounts.approvals > 0 ? '#f1c21b' : '#8d8d8d' }} />
              {navCounts.approvals > 0 && (
                <span className="header-badge">{navCounts.approvals}</span>
              )}
            </HeaderGlobalAction>

            {/* Settings */}
            <HeaderGlobalAction
              aria-label="Settings"
              tooltipAlignment="end"
              onClick={() => setIsOrgSettingsOpen(true)}
            >
              <Settings size={20} />
            </HeaderGlobalAction>

            {/* User Profile Button */}
            <HeaderGlobalAction
              aria-label={session?.user ? session.user.name : 'Sign In'}
              tooltipAlignment="end"
              onClick={() => session?.user ? setIsOrgSettingsOpen(true) : setIsAuthModalOpen(true)}
              style={{ gap: '0.4rem' }}
            >
              {session?.user
                ? <UserInitialsAvatar name={session.user.name} size={26} />
                : <UserAvatar size={20} />
              }
            </HeaderGlobalAction>
          </HeaderGlobalBar>
        </Header>

        {/* ── Modals ───────────────────────────────────────────────── */}
        <CampaignPortfolioModal
          isOpen={isCampaignModalOpen}
          onClose={() => setIsCampaignModalOpen(false)}
          campaigns={campaigns}
          activeCampaign={activeCampaign}
          onSelectCampaign={handleSetActiveCampaign}
          onCampaignCreated={(c) => { setCampaigns([c, ...campaigns]); handleSetActiveCampaign(c); }}
        />
        <OrgSettingsModal
          isOpen={isOrgSettingsOpen}
          onClose={() => setIsOrgSettingsOpen(false)}
          session={session}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={(s) => {
            setSession(s);
            setWorkspaceMode(s.user?.role === 'Agency Admin' ? 'agency' : s.user?.role === 'Creator' ? 'creator' : 'brand');
            setCurrentTab('overview');
          }}
        />

        {/* ── Body: SideNav + Main ─────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, marginTop: '3rem' }}>

          {/* Fixed Left SideNav */}
          <SideNav
            aria-label="Main navigation"
            expanded
            isFixedNav
            className="workspace-sidenav"
          >
            <SideNavItems>
              {NAV_SECTIONS.map((sec, si) => (
                <div key={sec.id} style={{ borderTop: si > 0 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none', paddingBottom: '0.35rem' }}>
                  <NavSectionLabel label={sec.label} />

                  {sec.items.map((item) => {
                    const Icon    = item.icon;
                    const isActive = currentTab === item.id;
                    const isHovered = navHovered === item.id;
                    const badgeCount = item.badgeKey ? navCounts[item.badgeKey] || 0 : 0;

                    return (
                      <SideNavLink
                        key={item.id}
                        renderIcon={Icon}
                        isActive={isActive}
                        onClick={() => setCurrentTab(item.id)}
                        onMouseEnter={() => setNavHovered(item.id)}
                        onMouseLeave={() => setNavHovered(null)}
                        className={isActive ? 'nav-link-active' : ''}
                        style={{
                          position: 'relative',
                          borderLeft: isActive
                            ? '3px solid #0f62fe'
                            : '3px solid transparent',
                          background: isActive
                            ? 'linear-gradient(90deg, rgba(15,98,254,0.16) 0%, rgba(15,98,254,0.03) 100%)'
                            : isHovered
                            ? 'rgba(255,255,255,0.04)'
                            : 'transparent',
                          color: isActive ? '#78a9ff' : isHovered ? '#f4f4f4' : '#a8a8a8',
                          fontWeight: isActive ? 600 : 400,
                          fontSize: '0.85rem',
                          minHeight: '2.35rem',
                          paddingLeft: '0.95rem',
                          transition: 'all 0.15s ease',
                          outline: 'none',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: '0.5rem' }}>
                          <span>{item.label}</span>
                          {badgeCount > 0 && (
                            <Tag 
                              type={item.badgeKey === 'approvals' ? 'red' : item.badgeKey === 'videos' ? 'purple' : 'teal'} 
                              size="sm" 
                              style={{ minWidth: 0, padding: '0 6px', height: '1.15rem', fontSize: '0.65rem', fontWeight: 700, lineHeight: '1.15rem', margin: 0 }}
                            >
                              {badgeCount}
                            </Tag>
                          )}
                          {isActive && badgeCount === 0 && (
                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#0f62fe', flexShrink: 0 }} />
                          )}
                        </span>
                      </SideNavLink>
                    );
                  })}
                </div>
              ))}
            </SideNavItems>

            {/* ── Nav Footer: User info & System Status ───────────── */}
            <div className="nav-footer">
              {session?.user ? (
                <button
                  className="nav-user-row"
                  onClick={() => setIsOrgSettingsOpen(true)}
                  title="Manage user profile and credentials"
                >
                  <UserInitialsAvatar name={session.user.name} size={28} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="nav-user-name">{session.user.name}</div>
                    <div className="nav-user-role">{session.user.role || 'Brand Operations'}</div>
                  </div>
                  <Settings size={14} style={{ color: '#6f6f6f', flexShrink: 0 }} />
                </button>
              ) : (
                <button
                  className="nav-signin-btn"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  <UserAvatar size={16} />
                  <span>Sign in to Workspace</span>
                </button>
              )}

              {/* System Telemetry Indicator Ribbon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.68rem', color: '#6f6f6f' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span className="live-indicator-dot" style={{ width: 6, height: 6 }} />
                  <span>Real-time Sync</span>
                </span>
                <span style={{ fontFamily: 'monospace', color: '#42be65' }}>99.9%</span>
              </div>
            </div>
          </SideNav>

          {/* ── Main Content Panel ───────────────────────────────── */}
          <main className="workspace-main">

            {/* Top Page Header Bar */}
            <div className="page-header-bar">
              <div className="page-breadcrumb">
                <span className="crumb-root" onClick={() => setCurrentTab('overview')} style={{ cursor: 'pointer' }}>
                  Project X
                </span>
                <ChevronRight size={12} style={{ color: '#4c4c4c' }} />
                <span className="crumb-section">{activeSectionLabel}</span>
                <ChevronRight size={12} style={{ color: '#4c4c4c' }} />
                <span className="crumb-current">{PAGE_TITLES[currentTab]}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Tag type="green" size="sm" style={{ margin: 0, fontWeight: 600 }}>
                  ● Ledger Active (₹ INR)
                </Tag>
                {activeCampaign && (
                  <button
                    className="active-campaign-bar-btn"
                    onClick={() => setIsCampaignModalOpen(true)}
                  >
                    <CheckmarkFilled size={12} style={{ color: '#42be65' }} />
                    <span className="acb-label">Brief:</span>
                    <span className="acb-name">
                      {activeCampaign.productName || activeCampaign.product_name}
                    </span>
                    <OverflowMenuHorizontal size={14} style={{ color: '#78a9ff' }} />
                  </button>
                )}
              </div>
            </div>

            {/* ── Page Content Router ───────────────────────────── */}
            {currentTab === 'overview' && (
              workspaceMode === 'agency'
                ? <AgencyCommandCenter onOpenCampaign={(c) => { setActiveCampaign({ id: c.campaign_id, brandName: c.client_name, productName: c.campaign_name }); setCurrentTab('negotiator'); }} />
                : <WorkspaceOverview mode={workspaceMode} session={session}
                    onNavigate={(t) => setCurrentTab(typeof t === 'string' ? t : ['overview','discovery','pipeline','portfolio','negotiator','video_qa','attribution','analytics','control_plane','strategy','payouts'][t] || 'overview')}
                  />
            )}
            {currentTab === 'discovery'    && <CreatorSearch onSelectCreator={handleSelectCreatorForOutreach} onViewDeal={handleViewDeal} activeCampaign={activeCampaign} />}
            {currentTab === 'negotiator'   && <EmailNegotiator activeDeal={activeDeal} campaignId={activeCampaign?.id} onDealUpdated={fetchActiveCampaign} onNavigateToDiscovery={() => setCurrentTab('discovery')} />}
            {currentTab === 'verification' && <VideoVerification activeDeal={activeDeal} />}
            {currentTab === 'payouts'      && <PayoutDashboard activeDeal={activeDeal} />}
            {currentTab === 'closeout'     && <CampaignCloseoutReport defaultCampaignId={activeCampaign?.id || 'camp_01'} />}
            {currentTab === 'portfolio'    && <CampaignBuilder activeCampaign={activeCampaign} forceCreateNew={forceCreateNewCampaign} initialWorkspaceCampaign={selectedWorkspaceCampaign} onCampaignSaved={(c) => { setActiveCampaign(c); fetchActiveCampaign(); setForceCreateNewCampaign(false); }} onSwitchCampaign={(c) => { setActiveCampaign(c); setSelectedWorkspaceCampaign(c); }} />}
            {currentTab === 'attribution'  && <AttributionDashboard campaignId={activeCampaign?.id} />}
            {currentTab === 'analytics'    && <AnalyticsDashboard />}
            {currentTab === 'control_plane'&& <AgentControlPlane />}
            {currentTab === 'approvals'    && <HITLApprovalInbox session={session} />}
            {currentTab === 'strategy'     && <CampaignStrategyGenerator onLaunchPortfolio={() => setCurrentTab('negotiator')} />}
          </main>
        </div>
      </div>
    </Theme>
  );
}
