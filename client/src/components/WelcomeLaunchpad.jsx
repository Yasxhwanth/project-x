import React, { useState, useEffect } from 'react';
import { Tile, Grid, Column, Button, Tag, InlineNotification } from '@carbon/react';
import { 
  Rocket, 
  Search, 
  Video, 
  ShoppingBag, 
  Email, 
  CheckmarkFilled, 
  ArrowRight, 
  Settings, 
  Idea, 
  Enterprise,
  Money,
  Security
} from '@carbon/icons-react';

export default function WelcomeLaunchpad({ onNavigate, onOpenOrgSettings, activeCampaign }) {
  const [orgName, setOrgName] = useState('Brand Partner');
  const [userName, setUserName] = useState('Campaign Executive');

  useEffect(() => {
    try {
      const userJson = localStorage.getItem('cc_user');
      if (userJson) {
        const u = JSON.parse(userJson);
        if (u.name) setUserName(u.name);
        if (u.orgName) setOrgName(u.orgName);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div style={{ color: '#ffffff', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Hero Executive Welcome Banner */}
      <Tile style={{ padding: '2rem', background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '2rem', borderLeft: '4px solid #0f62fe', borderRadius: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Tag type="blue" size="md" style={{ fontWeight: 600 }}>Enterprise Platform</Tag>
              <Tag type="green" size="md" style={{ fontWeight: 600 }}>Autonomous Engine Online</Tag>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 600, color: '#ffffff', margin: '0.25rem 0 0.5rem 0' }}>
              Campaign Operations & Executive Launchpad
            </h1>
            <p style={{ color: '#a8a8a8', fontSize: '0.95rem', maxWidth: 750, lineHeight: 1.5, margin: 0 }}>
              Operating system for <strong style={{ color: '#ffffff' }}>{orgName}</strong>. Orchestrate creator discovery, autonomous commercial negotiations, multimodal ASCI compliance verification, and statutory Section 194J escrow settlements.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 220 }}>
            <Button size="md" kind="primary" renderIcon={Rocket} onClick={() => onNavigate(2)}>
              + Create Campaign Brief
            </Button>
            <Button size="md" kind="tertiary" renderIcon={Settings} onClick={onOpenOrgSettings}>
              Organization & Model Settings
            </Button>
          </div>
        </div>
      </Tile>

      {/* Active Campaign Quick Status Bar */}
      <Tile style={{ padding: '1.25rem 1.5rem', background: '#111111', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '2rem', borderRadius: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Idea size={24} style={{ color: '#f1c21b' }} />
            <div>
              <span style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Campaign Brief</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff' }}>
                {activeCampaign ? (activeCampaign.productName || activeCampaign.product_name || activeCampaign.brand_name) : 'Select a Campaign Workspace'}
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
              Max Budget Cap: ₹{(activeCampaign?.maxBudgetPerCreator || activeCampaign?.max_budget_per_creator || 50000).toLocaleString('en-IN')}
            </Tag>
            <Button size="sm" kind="ghost" renderIcon={ArrowRight} onClick={() => onNavigate(2)}>
              Manage Brief
            </Button>
          </div>
        </div>
      </Tile>

      {/* Core Workflow Modules Grid */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#edf5ff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Rocket size={20} style={{ color: '#0f62fe' }} /> Core Operational Modules
      </h3>

      <Grid fullWidth style={{ padding: 0, marginBottom: '2rem', rowGap: '1.25rem', columnGap: '1.25rem' }}>
        {/* Card 1: Create Campaign */}
        <Column lg={8} md={4} sm={4}>
          <Tile 
            style={{ 
              background: 'var(--color-surface)', 
              padding: '1.5rem', 
              cursor: 'pointer', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: 6,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onClick={() => onNavigate(2)}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <Tag type="blue" size="sm">Workspace & Briefs</Tag>
                <Idea size={24} style={{ color: '#0f62fe' }} />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
                1. Campaign Portfolio & Brief Management
              </h4>
              <p style={{ color: '#a8a8a8', fontSize: '0.875rem', lineHeight: 1.45 }}>
                Define commercial guardrails, mandatory spoken keyphrases, target creator tier allocations, and budget caps in INR (₹).
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f62fe', fontWeight: 600, fontSize: '0.875rem' }}>
              Open Campaign Hub <ArrowRight size={16} />
            </div>
          </Tile>
        </Column>

        {/* Card 2: Creator Discovery */}
        <Column lg={8} md={4} sm={4}>
          <Tile 
            style={{ 
              background: 'var(--color-surface)', 
              padding: '1.5rem', 
              cursor: 'pointer', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: 6,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onClick={() => onNavigate(0)}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <Tag type="teal" size="sm">Intelligence & Sourcing</Tag>
                <Search size={24} style={{ color: '#008d8a' }} />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
                2. Creator Intelligence & Talent Discovery
              </h4>
              <p style={{ color: '#a8a8a8', fontSize: '0.875rem', lineHeight: 1.45 }}>
                Access 500+ verified Indian Instagram and YouTube creators with authenticated email contacts, engagement rates, and authenticity scores.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#008d8a', fontWeight: 600, fontSize: '0.875rem' }}>
              Discover Creators <ArrowRight size={16} />
            </div>
          </Tile>
        </Column>

        {/* Card 3: VideoDB Audit & Payout */}
        <Column lg={8} md={4} sm={4}>
          <Tile 
            style={{ 
              background: 'var(--color-surface)', 
              padding: '1.5rem', 
              cursor: 'pointer', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: 6,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onClick={() => onNavigate(4)}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <Tag type="purple" size="sm">QA & Settlement</Tag>
                <Video size={24} style={{ color: '#be95ff' }} />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
                3. Content QA & Section 194J TDS Settlement
              </h4>
              <p style={{ color: '#a8a8a8', fontSize: '0.875rem', lineHeight: 1.45 }}>
                Multimodal keyframe inspection, speech-to-text verification, statutory 10% TDS withholding, and instant Razorpay UPI payouts.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#be95ff', fontWeight: 600, fontSize: '0.875rem' }}>
              Verify Video & Settle <ArrowRight size={16} />
            </div>
          </Tile>
        </Column>

        {/* Card 4: Shopify ROAS & Attribution */}
        <Column lg={8} md={4} sm={4}>
          <Tile 
            style={{ 
              background: 'var(--color-surface)', 
              padding: '1.5rem', 
              cursor: 'pointer', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: 6,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onClick={() => onNavigate(5)}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <Tag type="green" size="sm">Revenue Attribution</Tag>
                <ShoppingBag size={24} style={{ color: '#42be65' }} />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
                4. Revenue Attribution & ROAS Analytics
              </h4>
              <p style={{ color: '#a8a8a8', fontSize: '0.875rem', lineHeight: 1.45 }}>
                Direct deterministic conversion attribution linking creator engagements, promotional codes, and Shopify webhooks to GMV.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#42be65', fontWeight: 600, fontSize: '0.875rem' }}>
              View Order Attribution <ArrowRight size={16} />
            </div>
          </Tile>
        </Column>
      </Grid>

      {/* System Operational Readiness */}
      <Tile style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, marginBottom: '2rem' }}>
        <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#edf5ff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckmarkFilled size={20} style={{ color: '#42be65' }} /> Autonomous Execution Infrastructure
        </h4>

        <Grid fullWidth style={{ padding: 0, rowGap: '1rem', columnGap: '1rem' }}>
          <Column lg={4} md={4} sm={4}>
            <div style={{ background: '#111111', padding: '1rem', borderRadius: 4, borderLeft: '3px solid #42be65', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>1. Campaign Brief Engine</div>
              <div style={{ fontSize: '0.8rem', color: '#8d8d8d', marginTop: '0.25rem' }}>Brief & tier budget mix active</div>
              <Tag type="green" size="sm" style={{ marginTop: '0.5rem' }}>Operational</Tag>
            </div>
          </Column>

          <Column lg={4} md={4} sm={4}>
            <div style={{ background: '#111111', padding: '1rem', borderRadius: 4, borderLeft: '3px solid #42be65', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>2. Commercial Negotiator</div>
              <div style={{ fontSize: '0.8rem', color: '#8d8d8d', marginTop: '0.25rem' }}>Gemini AI & 10% TDS policy active</div>
              <Tag type="green" size="sm" style={{ marginTop: '0.5rem' }}>Active</Tag>
            </div>
          </Column>

          <Column lg={4} md={4} sm={4}>
            <div style={{ background: '#111111', padding: '1rem', borderRadius: 4, borderLeft: '3px solid #42be65', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>3. Multimodal VideoIntel</div>
              <div style={{ fontSize: '0.8rem', color: '#8d8d8d', marginTop: '0.25rem' }}>Keyframe & speech indexing ready</div>
              <Tag type="green" size="sm" style={{ marginTop: '0.5rem' }}>Indexed</Tag>
            </div>
          </Column>

          <Column lg={4} md={4} sm={4}>
            <div style={{ background: '#111111', padding: '1rem', borderRadius: 4, borderLeft: '3px solid #0f62fe', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>4. Governance & Policy</div>
              <div style={{ fontSize: '0.8rem', color: '#8d8d8d', marginTop: '0.25rem' }}>Escalation queue & audit trail</div>
              <Tag type="blue" size="sm" style={{ marginTop: '0.5rem' }}>Governed</Tag>
            </div>
          </Column>
        </Grid>
      </Tile>
    </div>
  );
}
