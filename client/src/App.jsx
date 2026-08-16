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
  Theme
} from '@carbon/react';
import { 
  Search, 
  Email, 
  Video, 
  Currency, 
  Application, 
  Idea, 
  ChartBar, 
  Enterprise, 
  User, 
  Switcher, 
  Settings,
  Security,
  ShoppingBag,
  Rocket,
  WarningAlt,
  DocumentDownload
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

export default function App() {
  // Restore active tab from URL hash or localStorage on page load/refresh
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#', '').trim();
    const validTabs = ['overview', 'campaigns', 'portfolio', 'discovery', 'deals', 'negotiator', 'approvals', 'analytics', 'attribution', 'strategy', 'control_plane', 'verification', 'payouts', 'closeout', 'crm', 'agency'];
    if (hash && validTabs.includes(hash)) return hash;
    const saved = localStorage.getItem('cc_active_tab');
    if (saved && validTabs.includes(saved)) return saved;
    return 'overview';
  };

  const [currentTab, setCurrentTab] = useState(getInitialTab);
  const [activeDeal, setActiveDeal] = useState(null);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  
  // Modals & Auth State
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOrgSettingsOpen, setIsOrgSettingsOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [workspaceMode, setWorkspaceMode] = useState(() => localStorage.getItem('cc_workspace_mode') || 'brand');

  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [forceCreateNewCampaign, setForceCreateNewCampaign] = useState(false);
  const [selectedWorkspaceCampaign, setSelectedWorkspaceCampaign] = useState(null);

  // Sync tab changes to URL hash and localStorage
  useEffect(() => {
    localStorage.setItem('cc_active_tab', currentTab);
    if (window.location.hash.replace('#', '') !== currentTab) {
      window.location.hash = currentTab;
    }
  }, [currentTab]);

  // Sync workspace mode to localStorage
  useEffect(() => {
    localStorage.setItem('cc_workspace_mode', workspaceMode);
  }, [workspaceMode]);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      const validTabs = ['overview', 'campaigns', 'discovery', 'deals', 'approvals', 'analytics', 'attribution', 'strategy', 'governance', 'verification', 'payouts', 'crm', 'agency'];
      if (hash && validTabs.includes(hash) && hash !== currentTab) {
        setCurrentTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentTab]);

  useEffect(() => {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('gmail_status') || params.get('gmail_error')) {
        const cleanUrl = window.location.pathname + (window.location.hash || '');
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
    fetchSession();
    fetchActiveCampaign();
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingCount = async () => {
    try {
      const res = await fetch('/api/agents/escalations');
      if (!res.ok) return;
      const data = await res.json();
      const pending = Array.isArray(data) ? data.filter(t => t.status === 'PENDING').length : 0;
      setPendingApprovals(pending);
    } catch (e) { /* silently fail */ }
  };

  const fetchSession = async () => {
    try {
      const token = localStorage.getItem('cc_token');
      if (!token) return;
      const res = await fetch('/api/auth/session', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data);
        if (data.user.role === 'Agency Admin') setWorkspaceMode('agency');
        if (data.user.role === 'Creator') setWorkspaceMode('creator');
      } else {
        setSession(null);
      }
    } catch (err) {
      console.error("Failed to fetch session", err);
      setSession(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cc_token');
    setSession(null);
    setIsAuthModalOpen(true);
  };

  const handleSetActiveCampaign = (c) => {
    if (c) {
      setActiveCampaign(c);
      if (c.id) {
        localStorage.setItem('cc_active_campaign_id', c.id);
      }
    }
  };

  const fetchActiveCampaign = async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      const list = data?.campaigns || data;
      if (Array.isArray(list) && list.length > 0) {
        setCampaigns(list);
        const savedId = localStorage.getItem('cc_active_campaign_id');
        const matched = savedId ? list.find(c => c.id === savedId) : null;
        setActiveCampaign(matched || list[0]);
      }
    } catch (err) {
      console.error("Failed to load active campaign", err);
    }
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
        if (res.ok) {
          const camp = await res.json();
          setActiveCampaign(camp);
        }
      } catch (err) {
        console.error('Failed to load campaign for deal', err);
      }
    }
    setCurrentTab('negotiator');
  };

  const navSections = [
    {
      category: 'WORKSPACE',
      items: [
        { id: 'overview', label: 'Dashboard', icon: Rocket },
      ]
    },
    {
      category: 'CAMPAIGNS',
      items: [
        { id: 'portfolio', label: 'Campaigns', icon: Enterprise },
        { id: 'discovery', label: 'Creator Discovery', icon: Search },
        { id: 'negotiator', label: 'Outreach & Deals', icon: Email },
        { id: 'verification', label: 'Video QA & ASCI', icon: Video },
        { id: 'payouts', label: 'Payouts & TDS (194J)', icon: Currency },
      ]
    },
    {
      category: 'APPROVALS',
      items: [
        { id: 'approvals', label: 'Approval Inbox', icon: WarningAlt, badge: pendingApprovals },
      ]
    },
    {
      category: 'INSIGHTS',
      items: [
        { id: 'closeout', label: 'Client Closeout Report', icon: DocumentDownload },
        { id: 'attribution', label: 'Revenue Attribution', icon: ShoppingBag },
        { id: 'analytics', label: 'Analytics', icon: ChartBar },
      ]
    },
    {
      category: 'SYSTEM',
      items: [
        { id: 'strategy', label: 'AI Strategy', icon: Idea },
        { id: 'control_plane', label: 'AI Governance', icon: Security },
      ]
    }
  ];

  // Find active nav item details for breadcrumb
  let activeNavItem = null;
  for (const sec of navSections) {
    const found = sec.items.find(i => i.id === currentTab);
    if (found) {
      activeNavItem = { ...found, category: sec.category };
      break;
    }
  }

  // Page titles for breadcrumb
  const PAGE_TITLES = {
    overview: 'Dashboard',
    portfolio: 'Campaigns',
    discovery: 'Creator Discovery',
    negotiator: 'Outreach & Deals',
    verification: 'Video QA & ASCI Compliance',
    payouts: 'Payouts & Section 194 TDS Settlement',
    approvals: 'Approval Inbox',
    closeout: 'Branded Client Closeout Report',
    attribution: 'Revenue Attribution',
    analytics: 'Analytics',
    strategy: 'AI Strategy',
    control_plane: 'AI Governance'
  };

  return (
    <Theme theme="g100">
      <div className="cds--g100 creatorconnect-app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Carbon UI Clean Header */}
        <Header aria-label="Project X" style={{ background: 'rgba(20, 20, 20, 0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <HeaderName href="#" prefix="" style={{ fontSize: '1.05rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ background: 'linear-gradient(135deg, #0f62fe 0%, #0043ce 100%)', width: '22px', height: '22px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800', color: '#ffffff' }}>X</span>
            <span>Project X</span>
            <span style={{ color: '#4589ff', marginLeft: '0.2rem', fontWeight: '400', fontSize: '0.85rem' }}>OS</span>
          </HeaderName>

          <HeaderGlobalBar>
            {/* Active Campaign Quick Badge */}
            {activeCampaign && (
              <div 
                onClick={() => setIsCampaignModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.3rem 0.85rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  marginRight: '0.75rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <span className="live-indicator-dot" />
                <span style={{ fontSize: '0.8rem', color: '#f4f4f4', fontWeight: '500' }}>
                  {activeCampaign.brandName || activeCampaign.brand_name} — {activeCampaign.productName || activeCampaign.product_name}
                </span>
                <Switcher size={14} style={{ color: '#8d8d8d' }} />
              </div>
            )}

            {/* Auth / Account Profile Button */}
            <HeaderGlobalAction
              aria-label="User Profile"
              tooltipAlignment="end"
              onClick={() => session?.user ? setIsOrgSettingsOpen(true) : setIsAuthModalOpen(true)}
            >
              <User size={20} style={{ color: session?.user ? '#4589ff' : '#ffffff' }} />
            </HeaderGlobalAction>

            {/* Organization Settings */}
            <HeaderGlobalAction 
              aria-label="Organization Settings" 
              tooltipAlignment="end"
              onClick={() => setIsOrgSettingsOpen(true)}
            >
              <Settings size={20} />
            </HeaderGlobalAction>
          </HeaderGlobalBar>
        </Header>

        {/* Campaign Portfolio & Switcher Modal */}
        <CampaignPortfolioModal
          isOpen={isCampaignModalOpen}
          onClose={() => setIsCampaignModalOpen(false)}
          campaigns={campaigns}
          activeCampaign={activeCampaign}
          onSelectCampaign={(c) => handleSetActiveCampaign(c)}
          onCampaignCreated={(c) => {
            setCampaigns([c, ...campaigns]);
            handleSetActiveCampaign(c);
          }}
        />

        {/* Organization Profile & AI Settings Modal */}
        <OrgSettingsModal
          isOpen={isOrgSettingsOpen}
          onClose={() => setIsOrgSettingsOpen(false)}
          session={session}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Auth & Login Modal */}
        <AuthModal 
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={(newSession) => {
            setSession(newSession);
            setWorkspaceMode(newSession.user?.role === 'Agency Admin' ? 'agency' : newSession.user?.role === 'Creator' ? 'creator' : 'brand');
            setCurrentTab('overview');
          }}
        />

        {/* Main Workspace Layout with Fixed SideNav */}
        <div style={{ display: 'flex', flex: 1, marginTop: '3rem' }}>
          
          {/* Left Vertical SideNav */}
          <SideNav
            aria-label="Side Navigation"
            expanded={true}
            isFixedNav
            className="workspace-sidenav"
            style={{ width: '240px', top: '3rem', background: '#161616', borderRight: '1px solid #262626', display: 'flex', flexDirection: 'column' }}
          >
            <SideNavItems>
              {navSections.map((sec) => (
                <div key={sec.category} style={{ padding: '0.5rem 0 0.25rem 0' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#525252', padding: '0 1rem 0.4rem 1rem', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                    {sec.category}
                  </div>
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <SideNavLink
                        key={item.id}
                        renderIcon={Icon}
                        isActive={isActive}
                        onClick={() => setCurrentTab(item.id)}
                        style={{
                          borderLeft: isActive ? '3px solid #0f62fe' : '3px solid transparent',
                          background: isActive ? '#1c3a6e20' : 'transparent',
                          color: isActive ? '#78a9ff' : '#c6c6c6',
                          fontWeight: isActive ? '600' : '400',
                          fontSize: '0.875rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span>{item.label}</span>
                          {item.badge > 0 && (
                            <span style={{ 
                              background: '#da1e28', color: '#fff', 
                              borderRadius: '10px', padding: '0 6px', 
                              fontSize: '0.7rem', fontWeight: 'bold' 
                            }}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </SideNavLink>
                    );
                  })}
                </div>
              ))}
            </SideNavItems>

            {/* Signed-in user indicator at nav bottom */}
            {session?.user && (
              <div style={{
                padding: '0.75rem 1rem', marginTop: 'auto',
                borderTop: '1px solid #262626',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <User size={14} style={{ color: '#4589ff', flexShrink: 0 }} />
                <div style={{ fontSize: '0.75rem', minWidth: 0 }}>
                  <div style={{ color: '#f4f4f4', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.user.name}</div>
                  <div style={{ color: '#525252', fontSize: '0.65rem' }}>{session.user.role || 'Brand Manager'}</div>
                </div>
              </div>
            )}
          </SideNav>

          {/* Main Panel Content Area */}
          <main style={{ marginLeft: '240px', flex: 1, padding: '1.75rem 2.5rem', width: 'calc(100% - 240px)', background: '#161616', minHeight: 'calc(100vh - 3rem)' }}>
            
            {/* Top Breadcrumb Header Bar */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #262626', paddingBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#525252', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#6f6f6f' }}>Project X</span>
                <span style={{ color: '#393939' }}>/</span>
                <span style={{ color: '#a8a8a8' }}>{activeNavItem?.category}</span>
                <span style={{ color: '#393939' }}>/</span>
                <span style={{ color: '#f4f4f4', fontWeight: '600' }}>{PAGE_TITLES[currentTab] || activeNavItem?.label}</span>
              </div>

              {activeCampaign && (
                <div
                  onClick={() => setIsCampaignModalOpen(true)}
                  style={{ fontSize: '0.8rem', color: '#a8a8a8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span style={{ color: '#42be65', fontWeight: '600' }}>Active:</span>
                  <span>{activeCampaign.productName || activeCampaign.product_name}</span>
                  <Switcher size={12} style={{ color: '#525252' }} />
                </div>
              )}
            </div>

            {/* Page View Routing */}
            {currentTab === 'overview' && (
              workspaceMode === 'agency' ? (
                <AgencyCommandCenter
                  onOpenCampaign={(campaign) => {
                    setActiveCampaign({ id: campaign.campaign_id, brandName: campaign.client_name, productName: campaign.campaign_name });
                    setCurrentTab('negotiator');
                  }}
                />
              ) : (
                <WorkspaceOverview
                  mode={workspaceMode}
                  session={session}
                  onNavigate={(tabTarget) => {
                    if (typeof tabTarget === 'string') {
                      setCurrentTab(tabTarget);
                    } else {
                      const tabMap = ['overview', 'discovery', 'pipeline', 'portfolio', 'negotiator', 'video_qa', 'attribution', 'analytics', 'control_plane', 'strategy', 'payouts'];
                      setCurrentTab(tabMap[tabTarget] || 'overview');
                    }
                  }}
                />
              )
            )}

            {currentTab === 'discovery' && (
              <CreatorSearch 
                onSelectCreator={handleSelectCreatorForOutreach} 
                onViewDeal={handleViewDeal}
                activeCampaign={activeCampaign}
              />
            )}

            {currentTab === 'negotiator' && (
              <EmailNegotiator 
                activeDeal={activeDeal}
                campaignId={activeCampaign?.id}
                onDealUpdated={() => fetchActiveCampaign()}
                onNavigateToDiscovery={() => setCurrentTab('discovery')}
              />
            )}

            {currentTab === 'verification' && (
              <VideoVerification activeDeal={activeDeal} />
            )}

            {currentTab === 'payouts' && (
              <PayoutDashboard activeDeal={activeDeal} />
            )}

            {currentTab === 'closeout' && (
              <CampaignCloseoutReport defaultCampaignId={activeCampaign?.id || 'camp_01'} />
            )}

            {currentTab === 'portfolio' && (
              <CampaignBuilder 
                activeCampaign={activeCampaign}
                forceCreateNew={forceCreateNewCampaign}
                initialWorkspaceCampaign={selectedWorkspaceCampaign}
                onCampaignSaved={(c) => {
                  setActiveCampaign(c);
                  fetchActiveCampaign();
                  setForceCreateNewCampaign(false);
                }}
                onSwitchCampaign={(c) => {
                  setActiveCampaign(c);
                  setSelectedWorkspaceCampaign(c);
                }}
              />
            )}

            {currentTab === 'attribution' && (
              <AttributionDashboard campaignId={activeCampaign?.id} />
            )}

            {currentTab === 'analytics' && (
              <AnalyticsDashboard />
            )}

            {currentTab === 'control_plane' && (
              <AgentControlPlane />
            )}

            {currentTab === 'approvals' && (
              <HITLApprovalInbox session={session} />
            )}

            {currentTab === 'strategy' && (

              <CampaignStrategyGenerator 
                onLaunchPortfolio={() => setCurrentTab('negotiator')}
              />
            )}
          </main>
        </div>
      </div>
    </Theme>
  );
}
