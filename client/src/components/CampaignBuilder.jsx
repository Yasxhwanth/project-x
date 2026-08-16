import React, { useState, useEffect } from 'react';
import {
  Grid, Column, Tile, ClickableTile, Button, Tag,
  InlineNotification, TextInput, TextArea, NumberInput,
  Loading
} from '@carbon/react';
import {
  Launch, Add, Idea, CheckmarkFilled, Checkmark, Renew,
  ChevronRight, Currency, UserFollow, Enterprise, View
} from '@carbon/icons-react';
import CampaignWorkspaceView from './CampaignWorkspaceView';

export default function CampaignBuilder({ activeCampaign, onCampaignSaved, onSwitchCampaign, forceCreateNew, initialWorkspaceCampaign }) {
  const [campaignsList, setCampaignsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedWorkspaceCampaign, setSelectedWorkspaceCampaign] = useState(initialWorkspaceCampaign || null);

  useEffect(() => {
    if (initialWorkspaceCampaign) {
      setSelectedWorkspaceCampaign(initialWorkspaceCampaign);
    }
  }, [initialWorkspaceCampaign]);

  // Form state
  const [brandName, setBrandName] = useState(activeCampaign?.brand_name || activeCampaign?.brandName || '');
  const [productName, setProductName] = useState(activeCampaign?.product_name || activeCampaign?.productName || '');
  const [totalBudget, setTotalBudget] = useState(500000);
  const [maxBudget, setMaxBudget] = useState(activeCampaign?.max_budget_per_creator || 50000);
  const [mandatoryPhrases, setMandatoryPhrases] = useState(activeCampaign?.mandatory_phrases || '');
  const [promoCode, setPromoCode] = useState(activeCampaign?.promo_code || '');
  const [guidelines, setGuidelines] = useState(activeCampaign?.guidelines || '');
  const [microCount, setMicroCount] = useState(10);
  const [midCount, setMidCount] = useState(3);
  const [macroCount, setMacroCount] = useState(1);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeCampaign && !isCreatingNew) {
      setBrandName(activeCampaign.brand_name || activeCampaign.brandName || '');
      setProductName(activeCampaign.product_name || activeCampaign.productName || '');
      setMaxBudget(activeCampaign.max_budget_per_creator || 50000);
      setMandatoryPhrases(activeCampaign.mandatory_phrases || '');
      setPromoCode(activeCampaign.promo_code || '');
      setGuidelines(activeCampaign.guidelines || '');
    }
  }, [activeCampaign, isCreatingNew]);

  useEffect(() => { 
    if (forceCreateNew) { 
      setIsCreatingNew(true); 
      setBrandName(''); 
      setProductName(''); 
      setMandatoryPhrases(''); 
      setPromoCode(''); 
      setGuidelines(''); 
    } 
  }, [forceCreateNew]);

  useEffect(() => { fetchCampaigns(); }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaignsList(Array.isArray(data) ? data : (data.campaigns || []));
      }
    } catch (err) { 
      console.error('Failed to load campaigns', err); 
    } finally { 
      setLoading(false); 
    }
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
        body: JSON.stringify({ 
          brandName, 
          productName, 
          maxBudgetPerCreator: Number(maxBudget), 
          mandatoryPhrases, 
          promoCode, 
          guidelines 
        })
      });
      if (!res.ok) throw new Error('Failed to save');
      const newCamp = await res.json();
      setSavedSuccess(true);
      onCampaignSaved(newCamp);
      fetchCampaigns();
      setIsCreatingNew(false);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) { 
      console.error('Save campaign error', err); 
    } finally { 
      setSubmitting(false); 
    }
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
    <div style={{ width: '100%' }}>
      {/* ─── Page Hero Header ──────────────────────────────────────────────── */}
      <div className="hero-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Campaign Hub & Brief Workspace</h1>
            <p>
              Each campaign operates as an isolated workspace — creator discovery, autonomous email negotiation, multimodal video QA, and payouts are scoped per campaign brief.
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
      </div>

      {savedSuccess && (
        <InlineNotification
          kind="success"
          title="Campaign created!"
          subtitle="New campaign is live. Open its workspace to start sourcing creators."
          style={{ marginBottom: '1.25rem' }}
        />
      )}

      {/* ── CAMPAIGN LIST VIEW ── */}
      {!isCreatingNew && (
        <>
          {/* Summary KPI Strip */}
          {campaignsList.length > 0 && (
            <Grid fullWidth style={{ padding: 0, marginBottom: '1.5rem', rowGap: '1rem', columnGap: '1rem' }}>
              {[
                { label: 'Total Campaigns', value: campaignsList.length, color: '#78a9ff' },
                { label: 'Active Workspaces', value: campaignsList.length, color: '#42be65' },
                { label: 'Combined Budget Cap', value: `₹${(campaignsList.reduce((s, c) => s + (c.max_budget_per_creator || c.maxBudgetPerCreator || 50000), 0) / 100000).toFixed(1)}L`, color: '#f1c21b' }
              ].map((stat, i) => (
                <Column key={i} lg={5} md={2} sm={4}>
                  <Tile style={{ background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.65rem', letterSpacing: '1px', color: '#8d8d8d', textTransform: 'uppercase', marginBottom: '0.4rem' }}>{stat.label}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 600, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                  </Tile>
                </Column>
              ))}
            </Grid>
          )}

          {loading ? (
            <Tile style={{ background: 'var(--color-surface)', padding: '3rem', textAlign: 'center', borderRadius: 6 }}>
              <Loading withOverlay={false} small description="Loading campaigns..." />
            </Tile>
          ) : campaignsList.length === 0 ? (
            <Tile style={{ background: 'var(--color-surface)', padding: '3.5rem 2rem', textAlign: 'center', borderRadius: 6 }}>
              <Idea size={36} style={{ color: '#0f62fe', marginBottom: '0.75rem' }} />
              <h3 style={{ color: '#f4f4f4', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>No campaigns configured</h3>
              <p style={{ color: '#8d8d8d', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                Launch your first campaign brief to begin sourcing creators with the autonomous AI agent.
              </p>
              <Button kind="primary" renderIcon={Add} onClick={() => setIsCreatingNew(true)}>
                Create First Campaign
              </Button>
            </Tile>
          ) : (
            <Grid fullWidth style={{ padding: 0, rowGap: '1.25rem', columnGap: '1.25rem' }}>
              {campaignsList.map(c => {
                const budget = c.maxBudgetPerCreator || c.max_budget_per_creator || 50000;
                const promo = c.promoCode || c.promo_code || 'N/A';
                const brand = c.brandName || c.brand_name || 'Brand';
                const product = c.productName || c.product_name || 'Campaign';
                return (
                  <Column key={c.id} lg={8} md={8} sm={4}>
                    <ClickableTile
                      style={{ 
                        background: 'var(--color-surface)', 
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderTop: '3px solid #0f62fe', 
                        borderRadius: 6,
                        padding: '1.5rem' 
                      }}
                      onClick={() => { onSwitchCampaign(c); setSelectedWorkspaceCampaign(c); }}
                    >
                      <p style={{ fontSize: '0.7rem', letterSpacing: '1px', color: '#4589ff', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
                        {brand}
                      </p>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f4f4f4', margin: '0 0 1rem 0' }}>
                        {product}
                      </h3>

                      <Grid fullWidth style={{ padding: 0, marginBottom: '1rem' }}>
                        <Column lg={5} md={2} sm={2} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f1c21b' }}>₹{(budget / 1000).toFixed(0)}K</div>
                          <div style={{ fontSize: '0.65rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Per Creator</div>
                        </Column>
                        <Column lg={5} md={2} sm={2} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#78a9ff' }}>0</div>
                          <div style={{ fontSize: '0.65rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Deals</div>
                        </Column>
                        <Column lg={6} md={4} sm={4} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#42be65' }}>0</div>
                          <div style={{ fontSize: '0.65rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Videos Audited</div>
                        </Column>
                      </Grid>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <Tag type="teal" size="sm">{promo}</Tag>
                          <Tag type="green" size="sm">Active</Tag>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#4589ff', fontWeight: 500 }}>
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
          <Tile style={{ background: 'var(--color-surface)', borderLeft: '4px solid #0f62fe', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#8d8d8d', margin: '0 0 0.25rem 0', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Campaign Budget Estimation</p>
                <p style={{ fontSize: '1rem', fontWeight: 500, color: '#f4f4f4', margin: 0 }}>
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

          <Tile style={{ background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '2rem' }}>
            <form onSubmit={handleSubmit}>
              <p style={{ fontSize: '0.75rem', letterSpacing: '1px', color: '#4589ff', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 1rem 0' }}>Brand & Product Profile</p>
              <Grid fullWidth style={{ padding: 0, marginBottom: '1.5rem', rowGap: '1rem', columnGap: '1rem' }}>
                <Column lg={8} md={4} sm={4}>
                  <TextInput id="brand-name" labelText="Brand / Company Name" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. boAt Lifestyle, Nykaa, Zepto" required />
                </Column>
                <Column lg={8} md={4} sm={4}>
                  <TextInput id="product-name" labelText="Product / Campaign Title" value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. boAt Nirvana ANC 2026" required />
                </Column>
              </Grid>

              <p style={{ fontSize: '0.75rem', letterSpacing: '1px', color: '#4589ff', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 1rem 0' }}>Budget & Pacing Controls</p>
              <Grid fullWidth style={{ padding: 0, marginBottom: '1rem', rowGap: '1rem', columnGap: '1rem' }}>
                <Column lg={8} md={4} sm={4}>
                  <NumberInput id="total-budget" label="Total Campaign Budget (₹ INR)" value={totalBudget} onChange={(e, { value }) => setTotalBudget(value)} min={50000} max={10000000} step={50000} />
                </Column>
                <Column lg={8} md={4} sm={4}>
                  <NumberInput id="max-budget" label="Max Budget Cap per Creator (₹ INR)" value={maxBudget} onChange={(e, { value }) => setMaxBudget(value)} min={5000} max={500000} step={5000} />
                </Column>
              </Grid>

              <div style={{ background: '#111111', padding: '1.25rem', borderRadius: 4, border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#8d8d8d', margin: '0 0 1rem 0' }}>Creator Tier Distribution Targets</p>
                <Grid fullWidth style={{ padding: 0, rowGap: '1rem', columnGap: '1rem' }}>
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
              </div>

              <p style={{ fontSize: '0.75rem', letterSpacing: '1px', color: '#4589ff', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 1rem 0' }}>Content Guardrails & Verification Criteria</p>
              <Grid fullWidth style={{ padding: 0, marginBottom: '1rem', rowGap: '1rem', columnGap: '1rem' }}>
                <Column lg={11} md={5} sm={4}>
                  <TextInput id="mandatory-phrase" labelText="Mandatory Spoken Phrase (AI-verified in video audit)" helperText="Creator MUST speak this verbatim. Audited via multimodal speech recognition." placeholder="e.g. Use code NIRVANA20 for 20% off" value={mandatoryPhrases} onChange={e => setMandatoryPhrases(e.target.value)} required />
                </Column>
                <Column lg={5} md={3} sm={4}>
                  <TextInput id="promo-code" labelText="Promo / Tracking Code" value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="e.g. NIRVANA20" />
                </Column>
              </Grid>
              <div style={{ marginBottom: '1.5rem' }}>
                <TextArea id="guidelines" labelText="Deliverable Guidelines & Usage Rights" helperText="Key features to highlight, visual angles, 30-day organic rights period, and description link requirements." rows={3} value={guidelines} onChange={e => setGuidelines(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <Button type="submit" kind="primary" renderIcon={CheckmarkFilled} size="lg" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save & Activate Campaign Brief'}
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
