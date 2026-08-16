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
      { id: 'overview',   label: 'Dashboard',         icon: Rocket,           description: 'Campaign overview' },
    ],
  },
  {
    id: 'campaigns',
    label: 'CAMPAIGNS',
    items: [
      { id: 'portfolio',    label: 'Campaigns',         icon: Enterprise,       description: 'Manage campaigns' },
      { id: 'discovery',    label: 'Creator Discovery', icon: Search,           description: 'Find creators' },
      { id: 'negotiator',   label: 'Outreach & Deals',  icon: Email,            description: 'Email & negotiate' },
      { id: 'verification', label: 'Video QA & ASCI',   icon: Video,            description: 'Compliance check' },
      { id: 'payouts',      label: 'Payouts & TDS',     icon: Currency,         description: 'Section 194J' },
    ],
  },
  {
    id: 'approvals',
    label: 'APPROVALS',
    items: [
      { id: 'approvals', label: 'Approval Inbox', icon: WarningAltFilled, hasBadge: true, description: 'Pending actions' },
    ],
  },
  {
    id: 'insights',
    label: 'INSIGHTS',
    items: [
      { id: 'closeout',     label: 'Closeout Report',  icon: DocumentDownload, description: 'Client reporting' },
      { id: 'attribution',  label: 'Attribution',      icon: ShoppingBag,      description: 'Revenue tracking' },
      { id: 'analytics',    label: 'Analytics',        icon: ChartBar,         description: 'Performance data' },
    ],
  },
  {
    id: 'system',
    label: 'AI SYSTEM',
    items: [
      { id: 'strategy',      label: 'AI Strategy',    icon: Idea,     description: 'Campaign AI' },
      { id: 'control_plane', label: 'AI Governance',  icon: Security, description: 'Agent oversight' },
    ],
  },
];

const PAGE_TITLES = {
  overview:      'Dashboard',
  portfolio:     'Campaigns',
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
        boxShadow: '0 0 0 2px rgba(15,98,254,0.35)',
      }}
    >
      {initials}
    </span>
  );
}

// ─── Active Campaign Pill ────────────────────────────────────────────────────
function CampaignPill({ campaign, onClick }) {
  if (!campaign) return null;
  const name = campaign.productName || campaign.product_name || '—';
  const brand = campaign.brandName || campaign.brand_name || '';
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0 0.9rem', height: '2rem',
        background: 'rgba(15,98,254,0.1)',
        border: '1px solid rgba(15,98,254,0.3)',
        borderRadius: '1rem',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        marginRight: '0.5rem',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(15,98,254,0.18)';
        e.currentTarget.style.borderColor = 'rgba(15,98,254,0.55)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(15,98,254,0.1)';
        e.currentTarget.style.borderColor = 'rgba(15,98,254,0.3)';
      }}
    >
      <span className="live-indicator-dot" />
      {brand && (
        <span style={{ fontSize: '0.75rem', color: '#8fb4ff', fontWeight: 500 }}>
          {brand}
        </span>
      )}
      <ChevronRight size={10} style={{ color: 'rgba(15,98,254,0.6)' }} />
      <span style={{ fontSize: '0.75rem', color: '#d0e2ff', fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
      <OverflowMenuHorizontal size={14} style={{ color: '#4589ff', marginLeft: 2 }} />
    </button>
  );
}

// ─── Nav Section Divider ─────────────────────────────────────────────────────
function NavSectionLabel({ label }) {
  return (
    <div style={{
      padding: '1rem 1rem 0.3rem',
      fontSize: '0.6rem',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: '#4c4c4c',
      userSelect: 'none',
    }}>
      {label}
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
  const [pendingApprovals, setPendingApprovals]       = useState(0);
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
    fetchPendingCount();
    const iv = setInterval(fetchPendingCount, 20000);
    return () => clearInterval(iv);
  }, []);

  const fetchPendingCount = async () => {
    try {
      const res = await fetch('/api/agents/escalations');
      if (!res.ok) return;
      const data = await res.json();
      setPendingApprovals(Array.isArray(data) ? data.filter(t => t.status === 'PENDING').length : 0);
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
          <HeaderName href="#overview" prefix="" style={{ gap: '0.6rem', fontWeight: 600 }}>
            <span className="app-logo-mark">X</span>
            <span style={{ color: '#f4f4f4', fontSize: '0.925rem', letterSpacing: '-0.01em' }}>Project X</span>
            <Tag type="blue" size="sm" style={{ marginLeft: '0.15rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700 }}>OS</Tag>
          </HeaderName>

          <HeaderGlobalBar>
            {/* Active Campaign Switcher */}
            <CampaignPill campaign={activeCampaign} onClick={() => setIsCampaignModalOpen(true)} />

            {/* Pending Approvals Bell */}
            {pendingApprovals > 0 && (
              <HeaderGlobalAction
                aria-label={`${pendingApprovals} pending approvals`}
                tooltipAlignment="end"
                onClick={() => setCurrentTab('approvals')}
                style={{ position: 'relative' }}
              >
                <WarningAltFilled size={20} style={{ color: '#f1c21b' }} />
                <span className="header-badge">{pendingApprovals}</span>
              </HeaderGlobalAction>
            )}

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
                <div key={sec.id} style={{ borderTop: si > 0 ? '1px solid #1f1f1f' : 'none', paddingBottom: '0.25rem' }}>
                  <NavSectionLabel label={sec.label} />

                  {sec.items.map((item) => {
                    const Icon    = item.icon;
                    const isActive = currentTab === item.id;
                    const isHovered = navHovered === item.id;
                    const badge = item.hasBadge ? pendingApprovals : 0;

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
                            ? '2px solid #0f62fe'
                            : '2px solid transparent',
                          background: isActive
                            ? 'rgba(15,98,254,0.1)'
                            : isHovered
                            ? 'rgba(255,255,255,0.04)'
                            : 'transparent',
                          color: isActive ? '#78a9ff' : isHovered ? '#e8e8e8' : '#a8a8a8',
                          fontWeight: isActive ? 600 : 400,
                          fontSize: '0.85rem',
                          minHeight: '2.25rem',
                          paddingLeft: '0.85rem',
                          transition: 'all 0.15s ease',
                          outline: 'none',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: '0.5rem' }}>
                          <span>{item.label}</span>
                          {badge > 0 && (
                            <Tag type="red" size="sm" style={{ minWidth: 0, padding: '0 6px', height: '1.1rem', fontSize: '0.65rem', fontWeight: 700, lineHeight: '1.1rem' }}>
                              {badge}
                            </Tag>
                          )}
                          {isActive && !badge && (
                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#0f62fe', flexShrink: 0 }} />
                          )}
                        </span>
                      </SideNavLink>
                    );
                  })}
                </div>
              ))}
            </SideNavItems>

            {/* ── Nav Footer: User info ─────────────────────────── */}
            <div className="nav-footer">
              {session?.user ? (
                <button
                  className="nav-user-row"
                  onClick={() => setIsOrgSettingsOpen(true)}
                >
                  <UserInitialsAvatar name={session.user.name} size={28} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="nav-user-name">{session.user.name}</div>
                    <div className="nav-user-role">{session.user.role || 'Brand Manager'}</div>
                  </div>
                  <Settings size={14} style={{ color: '#525252', flexShrink: 0 }} />
                </button>
              ) : (
                <button
                  className="nav-signin-btn"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  <UserAvatar size={16} />
                  <span>Sign in</span>
                </button>
              )}
            </div>
          </SideNav>

          {/* ── Main Content Panel ───────────────────────────────── */}
          <main className="workspace-main">

            {/* Top Page Header Bar */}
            <div className="page-header-bar">
              <div className="page-breadcrumb">
                <span className="crumb-root">Project X</span>
                <ChevronRight size={12} style={{ color: '#3d3d3d' }} />
                <span className="crumb-section">{activeSectionLabel}</span>
                <ChevronRight size={12} style={{ color: '#3d3d3d' }} />
                <span className="crumb-current">{PAGE_TITLES[currentTab]}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {activeCampaign && (
                  <button
                    className="active-campaign-bar-btn"
                    onClick={() => setIsCampaignModalOpen(true)}
                  >
                    <CheckmarkFilled size={12} style={{ color: '#42be65' }} />
                    <span className="acb-label">Active</span>
                    <span className="acb-name">
                      {activeCampaign.productName || activeCampaign.product_name}
                    </span>
                    <OverflowMenuHorizontal size={14} style={{ color: '#525252' }} />
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
