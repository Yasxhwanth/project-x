import React, { useState, useEffect } from 'react';
import { 
  Header, 
  HeaderName, 
  HeaderNavigation, 
  HeaderMenuItem, 
  HeaderGlobalBar, 
  HeaderGlobalAction,
  SideNav,
  SideNavItems,
  SideNavLink,
  Tag,
  Theme,
  Select,
  SelectItem
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
import OrgEmailSettings from './components/OrgEmailSettings';
import AgentControlPlane from './components/AgentControlPlane';
import AttributionDashboard from './components/AttributionDashboard';
import AuthModal from './components/AuthModal';
import OrgSettingsModal from './components/OrgSettingsModal';
import WelcomeLaunchpad from './components/WelcomeLaunchpad';
import WorkspaceOverview from './components/WorkspaceOverview';
import AgencyCommandCenter from './components/AgencyCommandCenter';
import CampaignPortfolioModal from './components/CampaignPortfolioModal';

export default function App() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [activeDeal, setActiveDeal] = useState(null);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  
  // Auth & Organization Session State
  const [session, setSession] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOrgSettingsOpen, setIsOrgSettingsOpen] = useState(false);
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
    setSelectedTab(3); // Switch to AI Email Negotiation Tab
  };

  const handleLaunchPortfolio = (portfolio) => {
    setSelectedTab(3); // Switch to AI Email Negotiation Tab
  };

  const navByWorkspace = {
    brand: [
      ['Workspace', [{ label: 'Overview', icon: Rocket, tab: 0 }]],
      ['Plan', [{ label: 'Campaigns', icon: Idea, tab: 3 }, { label: 'Creator discovery', icon: Search, tab: 1 }, { label: 'Pipeline', icon: Application, tab: 2 }]],
      ['Execute', [{ label: 'Outreach & deals', icon: Email, tab: 4 }, { label: 'Content review', icon: Video, tab: 5 }, { label: 'Payouts', icon: Currency, tab: 10 }]],
      ['Measure', [{ label: 'Attribution', icon: ShoppingBag, tab: 6 }, { label: 'Analytics', icon: ChartBar, tab: 7 }]],
      ['Automation', [{ label: 'Strategy assistant', icon: Idea, tab: 9 }, { label: 'Control centre', icon: Security, tab: 8 }]]
    ],
    agency: [
      ['Workspace', [{ label: 'Overview', icon: Rocket, tab: 0 }]],
      ['Manage', [{ label: 'Client campaigns', icon: Idea, tab: 3 }, { label: 'Talent roster', icon: Search, tab: 1 }, { label: 'Delivery pipeline', icon: Application, tab: 2 }]],
      ['Deliver', [{ label: 'Negotiations', icon: Email, tab: 4 }, { label: 'Content approvals', icon: Video, tab: 5 }, { label: 'Creator payouts', icon: Currency, tab: 10 }]],
      ['Report', [{ label: 'Client attribution', icon: ShoppingBag, tab: 6 }, { label: 'Performance', icon: ChartBar, tab: 7 }]],
      ['Operations', [{ label: 'Strategy assistant', icon: Idea, tab: 9 }, { label: 'Control centre', icon: Security, tab: 8 }]]
    ],
    creator: [
      ['Studio', [{ label: 'Overview', icon: Rocket, tab: 0 }]],
      ['Work', [{ label: 'Opportunities', icon: Application, tab: 2 }, { label: 'Collaboration messages', icon: Email, tab: 4 }, { label: 'Content submissions', icon: Video, tab: 5 }]],
      ['Earnings', [{ label: 'Payouts', icon: Currency, tab: 10 }, { label: 'Performance', icon: ChartBar, tab: 6 }]]
    ]
  };
  const navSections = navByWorkspace[workspaceMode];

  return (
    <Theme theme="g100">
      <div className="cds--g100 creatorconnect-app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Carbon UI Top Fixed Header */}
      <Header aria-label="Project X Header">
        <HeaderName href="#" prefix="">
          Project X (Autonomous Creator Marketing OS)
        </HeaderName>
        <HeaderNavigation aria-label="Organization Workspace Tag">
          <HeaderMenuItem href="#" onClick={(event) => event.preventDefault()}>
            <Select id="workspace-mode" hideLabel labelText="Workspace mode" value={workspaceMode} onChange={(e) => { setWorkspaceMode(e.target.value); setSelectedTab(0); }} style={{ minWidth: '142px' }}>
              <SelectItem value="brand" text="Brand workspace" />
              <SelectItem value="agency" text="Agency workspace" />
              <SelectItem value="creator" text="Creator studio" />
            </Select>
          </HeaderMenuItem>
          {activeCampaign && (
            <HeaderMenuItem href="#" onClick={() => setIsCampaignModalOpen(true)}>
              <Tag type="green" size="md" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                <Idea size={14} /> Campaign: {activeCampaign.brandName} ({activeCampaign.productName})
              </Tag>
            </HeaderMenuItem>
          )}
          {session?.organization && (
            <HeaderMenuItem href="#" onClick={() => setIsOrgSettingsOpen(true)}>
              <Tag type="blue" size="md" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                <Enterprise size={14} /> Organization: {session.organization.name} ({session.organization.plan || 'Enterprise'})
              </Tag>
            </HeaderMenuItem>
          )}
          <HeaderMenuItem href="#" onClick={() => setIsAuthModalOpen(true)}>
            <Tag type={session?.user ? 'purple' : 'magenta'} size="md" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
              <User size={14} /> {session?.user ? `${session.user.name} (${session.user.role})` : 'Sign In / Register'}
            </Tag>
          </HeaderMenuItem>
        </HeaderNavigation>
        <HeaderGlobalBar>
          <HeaderGlobalAction 
            aria-label="Switch Campaign Portfolio" 
            tooltipAlignment="end"
            onClick={() => setIsCampaignModalOpen(true)}
          >
            <Switcher size={20} />
          </HeaderGlobalAction>
          <HeaderGlobalAction 
            aria-label="Organization & AI Settings" 
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
          setSelectedTab(0);
        }}
      />

      {/* Main Workspace Layout with Left Vertical SideNav */}
      <div style={{ display: 'flex', flex: 1, marginTop: '3rem' }}>
        {/* Left SideNav Sidebar */}
        <SideNav
          aria-label="Side Navigation"
          expanded={true}
          isFixedNav
          className="workspace-sidenav"
          style={{ width: '256px', top: '3rem', background: '#161616', borderRight: '1px solid #393939' }}
        >
          <SideNavItems>
            {navSections.map(([section, items]) => <div className="nav-section" key={section}>
              <div className="nav-section-label">{section}</div>
              {items.map((item) => {
                const Icon = item.icon;
                return <SideNavLink key={item.label} renderIcon={Icon} isActive={selectedTab === item.tab} onClick={() => setSelectedTab(item.tab)}>
                  {item.label}
                </SideNavLink>;
              })}
            </div>)}
          </SideNavItems>
        </SideNav>

        {/* Main Panel Content Area */}
        <main style={{ marginLeft: '256px', flex: 1, padding: '2rem 2.5rem', width: 'calc(100% - 256px)', background: '#161616', minHeight: 'calc(100vh - 3rem)' }}>
          {selectedTab === 0 && (
            workspaceMode === 'agency' ? <AgencyCommandCenter
              onOpenCampaign={(campaign) => { setActiveCampaign({ id: campaign.campaign_id, brandName: campaign.client_name, productName: campaign.campaign_name }); setSelectedTab(3); }}
            /> : <WorkspaceOverview
              mode={workspaceMode}
              session={session}
              onNavigate={(tabIdx) => setSelectedTab(tabIdx)}
            />
          )}

          {selectedTab === 1 && (
            <CreatorSearch 
              onSelectCreator={handleSelectCreatorForOutreach} 
              activeCampaign={activeCampaign}
            />
          )}

          {selectedTab === 2 && (
            <CreatorCrmPipeline 
              onSelectDealForNegotiation={(deal) => {
                setActiveDeal(deal);
                setSelectedTab(4);
              }}
              onSelectDealForVideo={(deal) => {
                setActiveDeal(deal);
                setSelectedTab(5);
              }}
              onSelectDealForPayout={(deal) => {
                setActiveDeal(deal);
                setSelectedTab(10);
              }}
            />
          )}

          {selectedTab === 3 && (
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

          {selectedTab === 4 && (
            <EmailNegotiator 
              activeDeal={activeDeal}
              activeCampaign={activeCampaign}
              onDealUpdated={setActiveDeal}
            />
          )}

          {selectedTab === 5 && (
            <VideoVerification 
              activeDeal={activeDeal}
              activeCampaign={activeCampaign}
              onVerificationComplete={setActiveDeal}
            />
          )}

          {selectedTab === 6 && (
            <AttributionDashboard campaignId={activeCampaign?.id} />
          )}

          {selectedTab === 7 && (
            <AnalyticsDashboard />
          )}

          {selectedTab === 8 && (
            <AgentControlPlane />
          )}

          {selectedTab === 9 && (
            <CampaignStrategyGenerator 
              onLaunchPortfolio={handleLaunchPortfolio}
            />
          )}

          {selectedTab === 10 && (
            <PayoutDashboard 
              activeDeal={activeDeal}
            />
          )}
        </main>
      </div>
    </div>
  </Theme>
);
}
