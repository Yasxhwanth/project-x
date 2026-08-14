import React, { useState, useEffect } from 'react';
import {
  Grid, Column, Tile, Button, Tag,
  Tabs, TabList, Tab, TabPanels, TabPanel,
  StructuredListWrapper, StructuredListHead, StructuredListRow,
  StructuredListCell, StructuredListBody,
  Breadcrumb, BreadcrumbItem,
  ProgressIndicator, ProgressStep,
  InlineNotification
} from '@carbon/react';
import {
  ArrowLeft, Idea, UserFollow, Email, Video, Currency, Renew,
  CheckmarkFilled, Enterprise, ChevronRight
} from '@carbon/icons-react';
import CreatorCrmPipeline from './CreatorCrmPipeline';
import EmailNegotiator from './EmailNegotiator';
import VideoVerification from './VideoVerification';
import PayoutDashboard from './PayoutDashboard';

export default function CampaignWorkspaceView({ campaign, onBack }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (campaign?.id) fetchCampaignDeals();
  }, [campaign?.id]);

  const fetchCampaignDeals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deals?campaignId=${campaign.id}`);
      if (res.ok) {
        const data = await res.json();
        setDeals(Array.isArray(data) ? data : data.deals || []);
      }
    } catch (err) { console.error('Failed to load campaign deals:', err); }
    finally { setLoading(false); }
  };

  if (!campaign) return null;

  const brand = campaign.brand_name || campaign.brandName || 'Brand';
  const product = campaign.product_name || campaign.productName || 'Campaign';
  const promo = campaign.promo_code || campaign.promoCode || 'N/A';
  const budgetCap = campaign.max_budget_per_creator || campaign.maxBudgetPerCreator || 50000;
  const phrases = campaign.mandatory_phrases || campaign.mandatoryPhrases || '';

  const totalNegotiating = deals.filter(d => ['NEGOTIATING', 'COUNTER_OFFER_RECEIVED', 'COUNTER_OFFER'].includes(d.status)).length;
  const totalAgreed = deals.filter(d => ['AGREED', 'DEAL_AGREED', 'ACCEPTED'].includes(d.status)).length;
  const totalVideos = deals.filter(d => ['VIDEO_SUBMITTED', 'QA_PASSED', 'VERIFIED'].includes(d.status)).length;
  const totalPaid = deals.filter(d => ['PAID', 'PAYOUT_COMPLETED'].includes(d.status)).length;
  const totalSpend = deals.reduce((acc, d) => acc + (d.current_agreed_price || d.currentAgreedPrice || d.offered_price || 0), 0);

  // ProgressIndicator current step: 0=Brief, 1=Sourcing, 2=Outreach, 3=Video, 4=Payments
  const currentStep = totalPaid > 0 ? 4 : totalVideos > 0 ? 3 : totalNegotiating > 0 || totalAgreed > 0 ? 2 : deals.length > 0 ? 1 : 0;

  return (
    <div>
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: '1.25rem' }}>
        <BreadcrumbItem onClick={onBack} style={{ cursor: 'pointer' }}>All Campaigns</BreadcrumbItem>
        <BreadcrumbItem>{brand}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{product}</BreadcrumbItem>
      </Breadcrumb>

      {/* Campaign Header — Glassmorphic Layer 01 Tile */}
      <Tile style={{ background: 'linear-gradient(135deg, rgba(15, 98, 254, 0.08) 0%, rgba(26, 26, 26, 0.95) 100%)', border: '1px solid rgba(255, 255, 255, 0.08)', borderTop: '3px solid #0f62fe', padding: '1.75rem 2rem', marginBottom: '1.5rem', borderRadius: 8, backdropFilter: 'blur(8px)' }}>
        <Grid style={{ padding: 0 }}>
          {/* Left: Identity + Tags */}
          <Column lg={10} md={5} sm={4}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="live-indicator-dot" style={{ width: 6, height: 6 }} />
              <p style={{ fontSize: '0.7rem', letterSpacing: '1.5px', color: '#4589ff', textTransform: 'uppercase', fontWeight: '700', margin: 0 }}>
                {brand}
              </p>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '400', color: '#f4f4f4', margin: '0 0 0.85rem 0', letterSpacing: '-0.02em' }}>{product}</h1>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Tag type="teal" size="sm">Promo: {promo}</Tag>
              <Tag type="blue" size="sm">Cap ₹{(budgetCap / 1000).toFixed(0)}K / creator</Tag>
              <Tag type="green" size="sm">Active Campaign</Tag>
            </div>
          </Column>

          {/* Right: Live Metrics */}
          <Column lg={6} md={3} sm={4}>
            <Grid style={{ padding: 0, columnGap: '0.75rem' }}>
              {[
                { label: 'DEALS', value: deals.length, color: '#f4f4f4', glow: 'transparent' },
                { label: 'OUTREACH', value: totalNegotiating, color: '#f1c21b', glow: 'rgba(241, 194, 27, 0.15)' },
                { label: 'AGREED', value: totalAgreed, color: '#42be65', glow: 'rgba(66, 190, 101, 0.15)' },
                { label: 'VIDEOS', value: totalVideos, color: '#78a9ff', glow: 'rgba(120, 169, 255, 0.15)' },
              ].map((m, i) => (
                <Column key={i} lg={4} md={2} sm={2}>
                  <div style={{ background: 'rgba(20, 20, 20, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '0.85rem 0.5rem', textAlign: 'center', transition: 'all 0.2s ease', boxShadow: `0 0 12px ${m.glow}` }}>
                    <div style={{ fontSize: '1.45rem', fontWeight: '700', color: m.color, lineHeight: 1 }}>{m.value}</div>
                    <div style={{ fontSize: '0.625rem', color: '#8d8d8d', letterSpacing: '0.8px', marginTop: '0.4rem', textTransform: 'uppercase', fontWeight: 600 }}>{m.label}</div>
                  </div>
                </Column>
              ))}
            </Grid>
          </Column>
        </Grid>

        {/* Phase Progress */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '1px', color: '#8d8d8d', textTransform: 'uppercase', margin: '0 0 1rem 0', fontWeight: 600 }}>
            CAMPAIGN LIFECYCLE PROGRESS
          </p>
          <ProgressIndicator currentIndex={currentStep} spaceEqually>
            <ProgressStep label="Brief Set" description="Campaign parameters configured" />
            <ProgressStep label="Sourcing" description="Creators discovered & shortlisted" />
            <ProgressStep label="Outreach" description="Negotiations in progress" />
            <ProgressStep label="Video QA" description="Content submitted & verified" />
            <ProgressStep label="Payouts" description="Payments & TDS completed" />
          </ProgressIndicator>
        </div>
      </Tile>

      {/* Sub-Workspace Tabs */}
      <Tabs selectedIndex={activeTab} onChange={({ selectedIndex }) => setActiveTab(selectedIndex)}>
        <TabList aria-label="Campaign workspace sections" style={{ background: '#262626', borderBottom: '1px solid #393939' }}>
          <Tab renderIcon={Idea}>Brief & Strategy</Tab>
          <Tab renderIcon={UserFollow}>Creator Sourcing ({deals.length})</Tab>
          <Tab renderIcon={Email}>Outreach & Deals ({totalNegotiating + totalAgreed})</Tab>
          <Tab renderIcon={Video}>Video QA ({totalVideos})</Tab>
          <Tab renderIcon={Currency}>Payments ({totalPaid})</Tab>
        </TabList>

        <TabPanels>
          {/* Tab 0: Brief & Strategy */}
          <TabPanel style={{ padding: '1.5rem 0' }}>
            <Grid style={{ padding: 0, rowGap: '1rem', columnGap: '1rem' }}>
              <Column lg={8} md={4} sm={4}>
                <Tile style={{ background: '#262626', padding: '1.25rem' }}>
                  <p style={{ fontSize: '0.65rem', letterSpacing: '1px', color: '#8d8d8d', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>Mandatory Spoken Phrase</p>
                  <p style={{ color: '#78a9ff', fontStyle: 'italic', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                    "{phrases || 'Must mention promo code'}"
                  </p>
                </Tile>
              </Column>
              <Column lg={8} md={4} sm={4}>
                <Tile style={{ background: '#262626', padding: '1.25rem' }}>
                  <p style={{ fontSize: '0.65rem', letterSpacing: '1px', color: '#8d8d8d', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>Promo Code</p>
                  <p style={{ color: '#42be65', fontWeight: '700', fontSize: '1.5rem', letterSpacing: '2px', margin: 0 }}>{promo}</p>
                </Tile>
              </Column>
              <Column lg={16} md={8} sm={4}>
                <Tile style={{ background: '#262626', padding: '1.25rem' }}>
                  <p style={{ fontSize: '0.65rem', letterSpacing: '1px', color: '#8d8d8d', textTransform: 'uppercase', margin: '0 0 0.75rem 0' }}>Campaign Guidelines & Script Notes</p>
                  <p style={{ color: '#c6c6c6', lineHeight: 1.7, fontSize: '0.9rem', margin: 0 }}>
                    {campaign.guidelines || 'Highlight product features clearly. Show unboxing or usage in first 15 seconds. Include promo code in video description.'}
                  </p>
                </Tile>
              </Column>
              <Column lg={5} md={2} sm={4}>
                <Tile style={{ background: '#262626', padding: '1rem' }}>
                  <p style={{ fontSize: '0.65rem', letterSpacing: '0.8px', color: '#8d8d8d', textTransform: 'uppercase', margin: '0 0 0.3rem 0' }}>Budget Cap / Creator</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#f1c21b', margin: 0 }}>₹{budgetCap.toLocaleString('en-IN')}</p>
                </Tile>
              </Column>
              <Column lg={5} md={2} sm={4}>
                <Tile style={{ background: '#262626', padding: '1rem' }}>
                  <p style={{ fontSize: '0.65rem', letterSpacing: '0.8px', color: '#8d8d8d', textTransform: 'uppercase', margin: '0 0 0.3rem 0' }}>Campaign ID</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#a8a8a8', margin: 0 }}>#{campaign.id}</p>
                </Tile>
              </Column>
              <Column lg={6} md={4} sm={4}>
                <Tile style={{ background: '#262626', padding: '1rem' }}>
                  <p style={{ fontSize: '0.65rem', letterSpacing: '0.8px', color: '#8d8d8d', textTransform: 'uppercase', margin: '0 0 0.3rem 0' }}>Created On</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#a8a8a8', margin: 0 }}>
                    {new Date(campaign.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </Tile>
              </Column>
              <Column lg={16} md={8} sm={4}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button kind="ghost" size="sm" renderIcon={Renew} onClick={fetchCampaignDeals}>Sync Workspace Data</Button>
                </div>
              </Column>
            </Grid>
          </TabPanel>

          {/* Tab 1: Creator Sourcing */}
          <TabPanel style={{ padding: '1.5rem 0' }}>
            <Tile style={{ background: '#262626', padding: '1.25rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#c6c6c6', margin: 0 }}>
                All sourced creators and CRM deal pipeline for <strong style={{ color: '#f4f4f4' }}>{product}</strong>. Click a deal row to open its outreach thread.
              </p>
            </Tile>
            <CreatorCrmPipeline
              campaignId={campaign.id}
              onSelectDealForNegotiation={() => setActiveTab(2)}
              onSelectDealForVideo={() => setActiveTab(3)}
              onSelectDealForPayout={() => setActiveTab(4)}
            />
          </TabPanel>

          {/* Tab 2: Email Outreach */}
          <TabPanel style={{ padding: '1.5rem 0' }}>
            <Tile style={{ background: '#262626', padding: '1.25rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#c6c6c6', margin: 0 }}>
                All email negotiation threads scoped to <strong style={{ color: '#f4f4f4' }}>{product}</strong>. Select a deal below to compose or review messages.
              </p>
            </Tile>
            <EmailNegotiator campaignId={campaign.id} />
          </TabPanel>

          {/* Tab 3: Video QA */}
          <TabPanel style={{ padding: '1.5rem 0' }}>
            <Tile style={{ background: '#262626', padding: '1.25rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#c6c6c6', margin: 0 }}>
                Review submitted draft videos and run AI transcript verification for <strong style={{ color: '#f4f4f4' }}>{product}</strong>.
              </p>
            </Tile>
            <VideoVerification campaignId={campaign.id} />
          </TabPanel>

          {/* Tab 4: Payments */}
          <TabPanel style={{ padding: '1.5rem 0' }}>
            <Tile style={{ background: '#262626', padding: '1.25rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#c6c6c6', margin: 0 }}>
                Payout management for <strong style={{ color: '#f4f4f4' }}>{product}</strong>. TDS auto-deducted at 10% per Section 194J on all creator invoices.
              </p>
            </Tile>
            <PayoutDashboard campaignId={campaign.id} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
