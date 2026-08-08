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
  Rocket
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
import AttributionDashboard from './components/AttributionDashboard';
import AuthModal from './components/AuthModal';
import OrgSettingsModal from './components/OrgSettingsModal';
import WelcomeLaunchpad from './components/WelcomeLaunchpad';
import WorkspaceOverview from './components/WorkspaceOverview';
import AgencyCommandCenter from './components/AgencyCommandCenter';
import CampaignPortfolioModal from './components/CampaignPortfolioModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState('overview');
  const [activeDeal, setActiveDeal] = useState(null);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  
  // Modals & Auth State
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOrgSettingsOpen, setIsOrgSettingsOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [workspaceMode, setWorkspaceMode] = useState('brand');

  useEffect(() => {
    fetchSession();
    fetchActiveCampaign();
  }, []);

  const fetchSession = async () => {
    try {
      const token = localStorage.getItem('cc_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch('/api/auth/me', { headers });
      const data = await res.json();
      if (data && data.user) {
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

  const fetchActiveCampaign = async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      const list = data?.campaigns || data;
      if (Array.isArray(list) && list.length > 0) {
        setCampaigns(list);
        setActiveCampaign(list[0]);
      }
    } catch (err) {
      console.error("Failed to load active campaign", err);
    }
  };

  const handleSelectCreatorForOutreach = (deal) => {
    setActiveDeal(deal);
    setCurrentTab('negotiator');
  };

  const navSections = [
    {
      category: 'MAIN WORKSPACE',
      items: [
        { id: 'overview', label: 'Launchpad & Overview', icon: Rocket },
        { id: 'discovery', label: 'Creator Discovery Engine', icon: Search },
        { id: 'pipeline', label: 'CRM Deal Pipeline', icon: Application }
      ]
    },
    {
      category: 'AUTONOMOUS EXECUTION',
      items: [
        { id: 'negotiator', label: 'AI Email Negotiator', icon: Email },
        { id: 'video_qa', label: 'VideoDB AI Multimodal Audit', icon: Video },
        { id: 'payouts', label: 'Instant UPI & Tax Ledger', icon: Currency }
      ]
    },
    {
      category: 'CAMPAIGNS & STRATEGY',
      items: [
        { id: 'portfolio', label: 'Campaign Portfolio Studio', icon: Idea },
        { id: 'strategy', label: 'AI Strategy Assistant', icon: Idea }
      ]
    },
    {
      category: 'MEASURE & GOVERN',
      items: [
        { id: 'attribution', label: 'Shopify Attribution & Orders', icon: ShoppingBag },
        { id: 'analytics', label: 'ROI Analytics Dashboard', icon: ChartBar },
        { id: 'control_plane', label: 'AI Governance Control Plane', icon: Security }
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

  return (
    <Theme theme="g100">
      <div className="cds--g100 creatorconnect-app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Carbon UI Clean Header */}
        <Header aria-label="Project X Header">
          <HeaderName href="#" prefix="" style={{ fontSize: '1rem', fontWeight: '600' }}>
            Project X <span style={{ color: '#0f62fe', marginLeft: '0.25rem', fontWeight: '400' }}>Autonomous OS</span>
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
                  padding: '0.25rem 0.75rem',
                  background: '#161616',
                  borderRadius: '16px',
                  border: '1px solid #393939',
                  cursor: 'pointer',
                  marginRight: '0.5rem'
                }}
              >
                <Tag type="green" size="sm" style={{ margin: 0 }}>Active</Tag>
                <span style={{ fontSize: '0.85rem', color: '#f4f4f4', fontWeight: '500' }}>
                  {activeCampaign.brandName} ({activeCampaign.productName})
                </span>
                <Switcher size={16} style={{ color: '#a8a8a8' }} />
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
          onSelectCampaign={(c) => setActiveCampaign(c)}
          onCampaignCreated={(c) => setCampaigns([c, ...campaigns])}
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
            style={{ width: '256px', top: '3rem', background: '#161616', borderRight: '1px solid #393939' }}
          >
            <SideNavItems>
              {navSections.map((sec) => (
                <div key={sec.category} style={{ padding: '0.75rem 0 0.25rem 0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6f6f6f', padding: '0 1rem 0.5rem 1rem', letterSpacing: '0.5px' }}>
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
                          borderLeft: isActive ? '4px solid #0f62fe' : '4px solid transparent',
                          background: isActive ? '#262626' : 'transparent',
                          fontWeight: isActive ? '600' : '400'
                        }}
                      >
                        {item.label}
                      </SideNavLink>
                    );
                  })}
                </div>
              ))}
            </SideNavItems>
          </SideNav>

          {/* Main Panel Content Area */}
          <main style={{ marginLeft: '256px', flex: 1, padding: '2rem 2.5rem', width: 'calc(100% - 256px)', background: '#161616', minHeight: 'calc(100vh - 3rem)' }}>
            
            {/* Top Breadcrumb Header Bar */}
            <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #262626', paddingBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#8d8d8d', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Rocket size={14} style={{ color: '#0f62fe' }} />
                <span>Project X</span>
                <span>/</span>
                <span>{activeNavItem?.category}</span>
                <span>/</span>
                <span style={{ color: '#ffffff', fontWeight: '600' }}>{activeNavItem?.label}</span>
              </div>

              {session?.user && (
                <div style={{ fontSize: '0.8rem', color: '#a8a8a8' }}>
                  Signed in as <span style={{ color: '#4589ff', fontWeight: '500' }}>{session.user.name}</span>
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
                  onNavigate={(tabIdx) => {
                    const tabMap = ['overview', 'discovery', 'pipeline', 'portfolio', 'negotiator', 'video_qa', 'attribution', 'analytics', 'control_plane', 'strategy', 'payouts'];
                    setCurrentTab(tabMap[tabIdx] || 'overview');
                  }}
                />
              )
            )}

            {currentTab === 'discovery' && (
              <CreatorSearch 
                onSelectCreator={handleSelectCreatorForOutreach} 
                activeCampaign={activeCampaign}
              />
            )}

            {currentTab === 'pipeline' && (
              <CreatorCrmPipeline 
                onSelectDealForNegotiation={(deal) => {
                  setActiveDeal(deal);
                  setCurrentTab('negotiator');
                }}
                onSelectDealForVideo={(deal) => {
                  setActiveDeal(deal);
                  setCurrentTab('video_qa');
                }}
                onSelectDealForPayout={(deal) => {
                  setActiveDeal(deal);
                  setCurrentTab('payouts');
                }}
              />
            )}

            {currentTab === 'portfolio' && (
              <CampaignBuilder 
                activeCampaign={activeCampaign}
                onCampaignSaved={(c) => {
                  setActiveCampaign(c);
                  fetchActiveCampaign();
                }}
                onSwitchCampaign={(c) => {
                  setActiveCampaign(c);
                }}
              />
            )}

            {currentTab === 'negotiator' && (
              <EmailNegotiator 
                activeDeal={activeDeal}
                activeCampaign={activeCampaign}
                onDealUpdated={setActiveDeal}
              />
            )}

            {currentTab === 'video_qa' && (
              <VideoVerification 
                activeDeal={activeDeal}
                activeCampaign={activeCampaign}
                onVerificationComplete={setActiveDeal}
              />
            )}

            {currentTab === 'payouts' && (
              <PayoutDashboard 
                activeDeal={activeDeal}
                activeCampaign={activeCampaign}
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
