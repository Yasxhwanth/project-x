import React, { useState, useEffect } from 'react';
import {
  Grid, Column, Tile, ClickableTile, Button, Tag,
  InlineNotification, TextInput, TextArea, NumberInput,
  StructuredListWrapper, StructuredListHead, StructuredListRow,
  StructuredListCell, StructuredListBody,
  Loading
} from '@carbon/react';
import {
  Launch, Add, Idea, CheckmarkFilled, Checkmark, Renew,
  ChevronRight, Currency, UserFollow, Enterprise, View
} from '@carbon/icons-react';
import CampaignWorkspaceView from './CampaignWorkspaceView';

export default function CampaignBuilder({ activeCampaign, onCampaignSaved, onSwitchCampaign, forceCreateNew }) {
  const [campaignsList, setCampaignsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedWorkspaceCampaign, setSelectedWorkspaceCampaign] = useState(null);

  // Form state
  const [brandName, setBrandName] = useState('boAt Lifestyle');
  const [productName, setProductName] = useState('boAt Airdopes Pro Max 500');
  const [totalBudget, setTotalBudget] = useState(1000000);
  const [maxBudget, setMaxBudget] = useState(50000);
  const [mandatoryPhrases, setMandatoryPhrases] = useState('Use code SAVER20 for 20% off on boAt-lifestyle.com');
  const [promoCode, setPromoCode] = useState('SAVER20');
  const [guidelines, setGuidelines] = useState('Show active noise cancellation test, battery life demo, link in description. Mention 1-year warranty.');
  const [microCount, setMicroCount] = useState(20);
  const [midCount, setMidCount] = useState(5);
  const [macroCount, setMacroCount] = useState(1);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (forceCreateNew) setIsCreatingNew(true); }, [forceCreateNew]);
  useEffect(() => { fetchCampaigns(); }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaignsList(Array.isArray(data) ? data : (data.campaigns || []));
      }
    } catch (err) { console.error('Failed to load campaigns', err); }
    finally { setLoading(false); }
  };

  const estReachMillions = ((microCount * 150000 + midCount * 450000 + macroCount * 1800000) / 1000000).toFixed(1);
  const estSpentINR = microCount * 18000 + midCount * 45000 + macroCount * 120000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName, productName, maxBudgetPerCreator: Number(maxBudget), mandatoryPhrases, promoCode, guidelines })
      });
      if (!res.ok) throw new Error('Failed to save');
      const newCamp = await res.json();
      setSavedSuccess(true);
      onCampaignSaved(newCamp);
      fetchCampaigns();
      setIsCreatingNew(false);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) { console.error('Save campaign error', err); }
    finally { setSubmitting(false); }
  };

  if (selectedWorkspaceCampaign) {
    return (
      <CampaignWorkspaceView
        campaign={selectedWorkspaceCampaign}
        onBack={() => setSelectedWorkspaceCampaign(null)}
      />
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '300', color: '#f4f4f4', margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Enterprise size={24} style={{ color: '#0f62fe' }} />
            Campaign Hub
          </h2>
          <p style={{ color: '#8d8d8d', fontSize: '0.875rem', margin: 0 }}>
            Each campaign is a fully isolated workspace — sourcing, outreach, video QA, and payments are scoped per campaign.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button kind="ghost" size="md" renderIcon={Renew} onClick={fetchCampaigns} hasIconOnly iconDescription="Refresh" />
          <Button
            kind={isCreatingNew ? 'secondary' : 'primary'}
            size="md"
            renderIcon={isCreatingNew ? Checkmark : Add}
            onClick={() => setIsCreatingNew(!isCreatingNew)}
          >
            {isCreatingNew ? 'View Campaigns' : 'New Campaign'}
          </Button>
        </div>
      </div>

      {savedSuccess && (
        <InlineNotification
          kind="success"
          title="Campaign created!"
          subtitle="New campaign is live. Open its workspace to start sourcing creators."
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      {/* ── CAMPAIGN LIST VIEW ── */}
      {!isCreatingNew && (
        <>
          {/* Summary strip */}
          {campaignsList.length > 0 && (
            <Grid style={{ padding: 0, marginBottom: '1.5rem', columnGap: '1rem' }}>
              {[
                { label: 'Total Campaigns', value: campaignsList.length, color: '#78a9ff' },
                { label: 'Active Workspaces', value: campaignsList.length, color: '#42be65' },
                { label: 'Combined Budget Cap', value: `₹${(campaignsList.reduce((s, c) => s + (c.max_budget_per_creator || c.maxBudgetPerCreator || 50000), 0) / 100000).toFixed(1)}L`, color: '#f1c21b' }
              ].map((stat, i) => (
                <Column key={i} lg={5} md={2} sm={4}>
                  <Tile style={{ background: '#262626', padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.65rem', letterSpacing: '1px', color: '#8d8d8d', textTransform: 'uppercase', marginBottom: '0.4rem' }}>{stat.label}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '600', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                  </Tile>
                </Column>
              ))}
            </Grid>
          )}

          {loading ? (
            <Tile style={{ background: '#262626', padding: '3rem', textAlign: 'center' }}>
              <Loading withOverlay={false} small description="Loading campaigns..." />
            </Tile>
          ) : campaignsList.length === 0 ? (
            <Tile style={{ background: '#262626', padding: '3rem 2rem', textAlign: 'center' }}>
              <Idea size={40} style={{ color: '#0f62fe', marginBottom: '1rem' }} />
              <h3 style={{ color: '#f4f4f4', fontSize: '1.1rem', fontWeight: '400', marginBottom: '0.5rem' }}>No campaigns yet</h3>
              <p style={{ color: '#8d8d8d', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                Launch your first campaign to start sourcing creators with AI agents.
              </p>
              <Button kind="primary" renderIcon={Add} onClick={() => setIsCreatingNew(true)}>
                Create First Campaign
              </Button>
            </Tile>
          ) : (
            <Grid style={{ padding: 0, rowGap: '1rem', columnGap: '1rem' }}>
              {campaignsList.map(c => {
                const budget = c.maxBudgetPerCreator || c.max_budget_per_creator || 50000;
                const promo = c.promoCode || c.promo_code || 'N/A';
                const brand = c.brandName || c.brand_name || 'Brand';
                const product = c.productName || c.product_name || 'Campaign';
                return (
                  <Column key={c.id} lg={8} md={8} sm={4}>
                    <ClickableTile
                      style={{ background: '#262626', borderTop: '3px solid #0f62fe', padding: '1.5rem' }}
                      onClick={() => { onSwitchCampaign(c); setSelectedWorkspaceCampaign(c); }}
                    >
                      {/* Brand label */}
                      <p style={{ fontSize: '0.7rem', letterSpacing: '1.5px', color: '#4589ff', textTransform: 'uppercase', fontWeight: '600', margin: '0 0 0.3rem 0' }}>{brand}</p>
                      {/* Campaign title */}
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '400', color: '#f4f4f4', margin: '0 0 1rem 0' }}>{product}</h3>

                      {/* Metric row */}
                      <Grid style={{ padding: 0, marginBottom: '1rem' }}>
                        <Column lg={5} md={2} sm={2} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#f1c21b' }}>₹{(budget / 1000).toFixed(0)}K</div>
                          <div style={{ fontSize: '0.65rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Per Creator</div>
                        </Column>
                        <Column lg={5} md={2} sm={2} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#78a9ff' }}>0</div>
                          <div style={{ fontSize: '0.65rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Deals</div>
                        </Column>
                        <Column lg={6} md={4} sm={4} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#42be65' }}>0</div>
                          <div style={{ fontSize: '0.65rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Videos Done</div>
                        </Column>
                      </Grid>

                      {/* Footer row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #393939' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <Tag type="teal" size="sm">{promo}</Tag>
                          <Tag type="green" size="sm">Active</Tag>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#4589ff', fontWeight: '500' }}>
                          Open Workspace <ChevronRight size={14} />
                        </div>
                      </div>
                    </ClickableTile>
                  </Column>
                );
              })}
            </Grid>
          )}
        </>
      )}

      {/* ── CREATE CAMPAIGN FORM ── */}
      {isCreatingNew && (
        <>
          {/* Estimate banner */}
          <Tile style={{ background: '#262626', borderLeft: '4px solid #0f62fe', padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#8d8d8d', margin: '0 0 0.25rem 0', letterSpacing: '0.5px' }}>CAMPAIGN BUDGET ESTIMATE</p>
                <p style={{ fontSize: '1rem', fontWeight: '400', color: '#f4f4f4', margin: 0 }}>
                  ₹{(totalBudget / 100000).toFixed(1)}L budget · {microCount} Micro + {midCount} Mid + {macroCount} Macro creators
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Tag type="teal" size="md">~{estReachMillions}M Est. Views</Tag>
                <p style={{ fontSize: '0.75rem', color: '#f1c21b', margin: '0.25rem 0 0 0' }}>
                  Spend: ₹{estSpentINR.toLocaleString('en-IN')} / ₹{totalBudget.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </Tile>

          <Tile style={{ background: '#262626', padding: '2rem' }}>
            <form onSubmit={handleSubmit}>
              {/* Section: Brand & Product */}
              <p style={{ fontSize: '0.75rem', letterSpacing: '1px', color: '#4589ff', textTransform: 'uppercase', fontWeight: '600', margin: '0 0 1rem 0' }}>Brand & Product</p>
              <Grid style={{ padding: 0, marginBottom: '1.5rem', columnGap: '1rem' }}>
                <Column lg={8} md={4} sm={4}>
                  <TextInput id="brand-name" labelText="Brand / Company Name" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. boAt, Mamaearth, Lenskart" required />
                </Column>
                <Column lg={8} md={4} sm={4}>
                  <TextInput id="product-name" labelText="Product / Service Title" value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. boAt Wave Smartwatch 2026" required />
                </Column>
              </Grid>

              {/* Section: Budget */}
              <p style={{ fontSize: '0.75rem', letterSpacing: '1px', color: '#4589ff', textTransform: 'uppercase', fontWeight: '600', margin: '0 0 1rem 0' }}>Budget Configuration</p>
              <Grid style={{ padding: 0, marginBottom: '1rem', columnGap: '1rem' }}>
                <Column lg={8} md={4} sm={4}>
                  <NumberInput id="total-budget" label="Total Campaign Budget (₹ INR)" value={totalBudget} onChange={(e, { value }) => setTotalBudget(value)} min={50000} max={10000000} step={50000} />
                </Column>
                <Column lg={8} md={4} sm={4}>
                  <NumberInput id="max-budget" label="Max Budget Cap per Creator (₹ INR)" value={maxBudget} onChange={(e, { value }) => setMaxBudget(value)} min={5000} max={500000} step={5000} />
                </Column>
              </Grid>

              {/* Tier distribution */}
              <Tile style={{ background: '#161616', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#8d8d8d', margin: '0 0 1rem 0' }}>Creator Tier Distribution</p>
                <Grid style={{ padding: 0, columnGap: '1rem' }}>
                  <Column lg={5} md={2} sm={4}>
                    <NumberInput id="micro-count" label="Micro (<500K followers)" value={microCount} onChange={(e, { value }) => setMicroCount(value)} min={0} max={100} />
                  </Column>
                  <Column lg={5} md={2} sm={4}>
                    <NumberInput id="mid-count" label="Mid-Tier (500K–2M)" value={midCount} onChange={(e, { value }) => setMidCount(value)} min={0} max={50} />
                  </Column>
                  <Column lg={6} md={4} sm={4}>
                    <NumberInput id="macro-count" label="Macro (>2M followers)" value={macroCount} onChange={(e, { value }) => setMacroCount(value)} min={0} max={10} />
                  </Column>
                </Grid>
              </Tile>

              {/* Section: Guardrails */}
              <p style={{ fontSize: '0.75rem', letterSpacing: '1px', color: '#4589ff', textTransform: 'uppercase', fontWeight: '600', margin: '0 0 1rem 0' }}>Campaign Guardrails</p>
              <Grid style={{ padding: 0, marginBottom: '1rem', columnGap: '1rem' }}>
                <Column lg={11} md={5} sm={4}>
                  <TextInput id="mandatory-phrase" labelText="Mandatory Spoken Phrase (AI-verified in video)" helperText="Creator MUST say this verbatim. Verified by transcript audit." value={mandatoryPhrases} onChange={e => setMandatoryPhrases(e.target.value)} required />
                </Column>
                <Column lg={5} md={3} sm={4}>
                  <TextInput id="promo-code" labelText="Promo / Affiliate Code" value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="e.g. SAVER20" />
                </Column>
              </Grid>
              <div style={{ marginBottom: '1.5rem' }}>
                <TextArea id="guidelines" labelText="Product Guidelines & Usage Rights" helperText="Key features to highlight, visual angles, organic rights period, and description link requirements." rows={3} value={guidelines} onChange={e => setGuidelines(e.target.value)} />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #393939' }}>
                <Button type="submit" kind="primary" renderIcon={CheckmarkFilled} size="lg" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save & Activate Campaign'}
                </Button>
                <Button kind="ghost" size="lg" onClick={() => setIsCreatingNew(false)}>Cancel</Button>
              </div>
            </form>
          </Tile>
        </>
      )}
    </div>
  );
}
