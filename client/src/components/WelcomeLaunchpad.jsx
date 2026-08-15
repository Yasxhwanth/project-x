import React, { useState, useEffect } from 'react';
import { Tile, Grid, Column, Tag, Button, ProgressBar, InlineNotification } from '@carbon/react';
import { 
  Rocket, 
  Search, 
  Application, 
  Idea, 
  Email, 
  Video, 
  ShoppingBag, 
  ChartBar, 
  Security, 
  Currency, 
  CheckmarkFilled, 
  ArrowRight, 
  Enterprise, 
  User, 
  Settings,
  Locked
} from '@carbon/icons-react';

export default function WelcomeLaunchpad({ session, activeCampaign, onNavigate, onOpenOrgSettings, onOpenAuthModal }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWelcomeStats();
  }, []);

  const fetchWelcomeStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/summary');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch welcome stats', err);
    } finally {
      setLoading(false);
    }
  };

  const userName = session?.user?.name || 'Creator Marketer';
  const orgName  = session?.organization?.name || activeCampaign?.brand_name || 'Brand Workspace';
  const planName = session?.organization?.plan || 'Enterprise Plan';

  const kpi = stats?.kpiOverview;

  return (
    <div className="welcome-launchpad-module" style={{ color: '#ffffff', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero Welcome Banner */}
      <Tile style={{ padding: '2rem', background: '#262626', marginBottom: '2rem', borderLeft: '4px solid #0f62fe', borderRadius: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Tag type="blue" size="md" style={{ fontWeight: '600' }}>v3 Autonomous OS</Tag>
              <Tag type="green" size="md" style={{ fontWeight: '600' }}>System Ready</Tag>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '300', color: '#ffffff', margin: '0.25rem 0 0.5rem 0' }}>
              Namaste, <strong style={{ fontWeight: '600', color: '#4589ff' }}>{userName}</strong> 👋
            </h1>
            <p style={{ color: '#c6c6c6', fontSize: '1rem', maxWidth: '750px', lineHeight: '1.5', margin: 0 }}>
              Welcome to <strong style={{ color: '#ffffff' }}>Project X</strong> — the verified creator campaign operating system for <strong style={{ color: '#4589ff' }}>{orgName}</strong>. Run end-to-end campaigns from brief creation to VideoIntel verification and instant Razorpay UPI payouts.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '220px' }}>
            <Button size="md" kind="primary" renderIcon={Rocket} onClick={() => onNavigate(2)}>
              + Create New Campaign
            </Button>
            <Button size="md" kind="tertiary" renderIcon={Settings} onClick={onOpenOrgSettings}>
              Organization & AI Settings
            </Button>
          </div>
        </div>
      </Tile>

      {/* Active Campaign Quick Status Bar */}
      <Tile style={{ padding: '1.25rem 1.5rem', background: '#161616', border: '1px solid #393939', marginBottom: '2rem', borderRadius: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Idea size={24} style={{ color: '#f1c21b' }} />
            <div>
              <span style={{ fontSize: '0.75rem', color: '#a8a8a8', textTransform: 'uppercase' }}>Active Campaign Workspace</span>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>
                {activeCampaign ? (activeCampaign.productName || activeCampaign.product_name || activeCampaign.brand_name) : 'Select a Campaign from Campaigns Hub'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {activeCampaign?.promo_code || activeCampaign?.promoCode ? (
              <Tag type="teal" size="md">
                Promo Code: {activeCampaign?.promoCode || activeCampaign?.promo_code}
              </Tag>
            ) : null}
            <Tag type="purple" size="md">
              Max Creator Cap: ₹{(activeCampaign?.maxBudgetPerCreator || activeCampaign?.max_budget_per_creator || 50000).toLocaleString('en-IN')}
            </Tag>
            <Button size="sm" kind="ghost" renderIcon={ArrowRight} onClick={() => onNavigate(2)}>
              Manage Brief
            </Button>
          </div>
        </div>
      </Tile>

      {/* 4 Launchpad Action Cards */}
      <h3 style={{ fontSize: '1.25rem', fontWeight: '400', color: '#edf5ff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Rocket size={20} style={{ color: '#0f62fe' }} /> Launchpad & Quick Actions
      </h3>

      <Grid style={{ padding: 0, marginBottom: '2rem', rowGap: '1.25rem', columnGap: '1.25rem' }}>
        {/* Card 1: Create Campaign */}
        <Column lg={8} md={4} sm={4}>
          <Tile 
            style={{ 
              background: '#262626', 
              padding: '1.5rem', 
              cursor: 'pointer', 
              border: '1px solid #393939', 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              transition: 'border-color 0.2s ease'
            }}
            onClick={() => onNavigate(2)}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <Tag type="blue" size="sm">Layer 2: Brief & Mix</Tag>
                <Idea size={24} style={{ color: '#0f62fe' }} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#ffffff', marginBottom: '0.5rem' }}>
                1. Campaign Hub & Brief Builder
              </h4>
              <p style={{ color: '#a8a8a8', fontSize: '0.875rem', lineHeight: '1.4' }}>
                Define product briefs, budget caps in INR (₹), micro/mid/macro creator mix, mandatory spoken keyphrases, and promo codes.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f62fe', fontWeight: '600', fontSize: '0.9rem' }}>
              Create / Switch Campaign <ArrowRight size={16} />
            </div>
          </Tile>
        </Column>

        {/* Card 2: Creator Discovery */}
        <Column lg={8} md={4} sm={4}>
          <Tile 
            style={{ 
              background: '#262626', 
              padding: '1.5rem', 
              cursor: 'pointer', 
              border: '1px solid #393939', 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between'
            }}
            onClick={() => onNavigate(0)}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <Tag type="teal" size="sm">Layer 1: AI Search</Tag>
                <Search size={24} style={{ color: '#008d8a' }} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#ffffff', marginBottom: '0.5rem' }}>
                2. Creator Discovery & Sourcing
              </h4>
              <p style={{ color: '#a8a8a8', fontSize: '0.875rem', lineHeight: '1.4' }}>
                Search 50+ pre-vetted Indian Instagram & YouTube creators, view engagement rates, or run live YouTube search scraping.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#008d8a', fontWeight: '600', fontSize: '0.9rem' }}>
              Search & Scrape Creators <ArrowRight size={16} />
            </div>
          </Tile>
        </Column>

        {/* Card 3: VideoDB Audit & Payout */}
        <Column lg={8} md={4} sm={4}>
          <Tile 
            style={{ 
              background: '#262626', 
              padding: '1.5rem', 
              cursor: 'pointer', 
              border: '1px solid #393939', 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between'
            }}
            onClick={() => onNavigate(4)}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <Tag type="purple" size="sm">Layer 3: VideoDB AI</Tag>
                <Video size={24} style={{ color: '#be95ff' }} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#ffffff', marginBottom: '0.5rem' }}>
                3. VideoDB Audit & Instant UPI Payouts
              </h4>
              <p style={{ color: '#a8a8a8', fontSize: '0.875rem', lineHeight: '1.4' }}>
                Run speech-to-text transcript matching on published Reels, verify promo codes, and trigger Razorpay UPI payouts with 10% Sec 194J TDS receipts.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#be95ff', fontWeight: '600', fontSize: '0.9rem' }}>
              Verify Video & Pay <ArrowRight size={16} />
            </div>
          </Tile>
        </Column>

        {/* Card 4: Shopify ROAS & Attribution */}
        <Column lg={8} md={4} sm={4}>
          <Tile 
            style={{ 
              background: '#262626', 
              padding: '1.5rem', 
              cursor: 'pointer', 
              border: '1px solid #393939', 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between'
            }}
            onClick={() => onNavigate(5)}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <Tag type="green" size="sm">Layer 3: Revenue ROAS</Tag>
                <ShoppingBag size={24} style={{ color: '#42be65' }} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#ffffff', marginBottom: '0.5rem' }}>
                4. Shopify ROAS & Order Attribution
              </h4>
              <p style={{ color: '#a8a8a8', fontSize: '0.875rem', lineHeight: '1.4' }}>
                Track real-time D2C order webhooks, verified GMV revenue, per-creator ROAS (e.g. 7.89x), and customer acquisition costs.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#42be65', fontWeight: '600', fontSize: '0.9rem' }}>
              View Order Attribution <ArrowRight size={16} />
            </div>
          </Tile>
        </Column>
      </Grid>

      {/* System Readiness Checklist */}
      <Tile style={{ padding: '1.5rem', background: '#262626', marginBottom: '2rem' }}>
        <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#edf5ff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckmarkFilled size={20} style={{ color: '#42be65' }} /> Autonomous Execution Pipeline Readiness
        </h4>

        <Grid style={{ padding: 0, rowGap: '1rem', columnGap: '1rem' }}>
          <Column lg={4} md={4} sm={4}>
            <div style={{ background: '#161616', padding: '1rem', borderRadius: '4px', borderLeft: '3px solid #42be65' }}>
              <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '0.9rem' }}>1. Strategy & Brief</div>
              <div style={{ fontSize: '0.8rem', color: '#a8a8a8', marginTop: '0.25rem' }}>Brief & tier budget mix configured</div>
              <Tag type="green" size="sm" style={{ marginTop: '0.5rem' }}>Ready</Tag>
            </div>
          </Column>

          <Column lg={4} md={4} sm={4}>
            <div style={{ background: '#161616', padding: '1rem', borderRadius: '4px', borderLeft: '3px solid #42be65' }}>
              <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '0.9rem' }}>2. Hinglish Negotiator</div>
              <div style={{ fontSize: '0.8rem', color: '#a8a8a8', marginTop: '0.25rem' }}>Gemini AI & 10% TDS policy active</div>
              <Tag type="green" size="sm" style={{ marginTop: '0.5rem' }}>Active</Tag>
            </div>
          </Column>

          <Column lg={4} md={4} sm={4}>
            <div style={{ background: '#161616', padding: '1rem', borderRadius: '4px', borderLeft: '3px solid #42be65' }}>
              <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '0.9rem' }}>3. Multimodal VideoDB</div>
              <div style={{ fontSize: '0.8rem', color: '#a8a8a8', marginTop: '0.25rem' }}>Audio transcript & promo search ready</div>
              <Tag type="green" size="sm" style={{ marginTop: '0.5rem' }}>Indexed</Tag>
            </div>
          </Column>

          <Column lg={4} md={4} sm={4}>
            <div style={{ background: '#161616', padding: '1rem', borderRadius: '4px', borderLeft: '3px solid #0f62fe' }}>
              <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '0.9rem' }}>4. Control Plane</div>
              <div style={{ fontSize: '0.8rem', color: '#a8a8a8', marginTop: '0.25rem' }}>Human risk classifier & audit trail</div>
              <Tag type="blue" size="sm" style={{ marginTop: '0.5rem' }}>Governed</Tag>
            </div>
          </Column>
        </Grid>
      </Tile>
    </div>
  );
}
