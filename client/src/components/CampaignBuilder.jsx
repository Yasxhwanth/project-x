import React, { useState, useEffect } from 'react';
import { 
  TextInput, 
  TextArea, 
  NumberInput, 
  Button, 
  Tile, 
  InlineNotification,
  Tag,
  Grid,
  Column,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell
} from '@carbon/react';
import { Launch, CheckmarkFilled, Add, Idea, Currency, Checkmark, Renew } from '@carbon/icons-react';

export default function CampaignBuilder({ activeCampaign, onCampaignSaved, onSwitchCampaign }) {
  const [campaignsList, setCampaignsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form State
  const [brandName, setBrandName] = useState('boAt Lifestyle');
  const [productName, setProductName] = useState('boAt Airdopes Pro Max 500');
  const [totalBudget, setTotalBudget] = useState(1000000);
  const [maxBudget, setMaxBudget] = useState(50000);
  const [mandatoryPhrases, setMandatoryPhrases] = useState('Use code SAVER20 for 20% off on boAt-lifestyle.com');
  const [promoCode, setPromoCode] = useState('SAVER20');
  const [guidelines, setGuidelines] = useState('Show active noise cancellation test, battery life demo, link in description. Mention 1-year warranty.');
  
  // Tier Allocations
  const [microCount, setMicroCount] = useState(20);
  const [midCount, setMidCount] = useState(5);
  const [macroCount, setMacroCount] = useState(1);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaignsList(data);
      }
    } catch (err) {
      console.error("Failed to load campaigns list", err);
    } finally {
      setLoading(false);
    }
  };

  const estReachMillions = ((microCount * 150000 + midCount * 450000 + macroCount * 1800000) / 1000000).toFixed(1);
  const estSpentINR = (microCount * 18000 + midCount * 45000 + macroCount * 120000);

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

      if (!res.ok) throw new Error("Failed to save campaign");
      const newCamp = await res.json();

      setSavedSuccess(true);
      onCampaignSaved(newCamp);
      fetchCampaigns();
      setIsCreatingNew(false);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Save campaign error", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: '#ffffff' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '400', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Idea size={24} style={{ color: '#0f62fe' }} /> Campaign Hub & Brief Builder
          </h2>
          <p style={{ color: '#a8a8a8', fontSize: '0.875rem' }}>
            Create new campaigns, manage budget caps, tier distributions, mandatory spoken keyphrases, and switch active campaign workspace.
          </p>
        </div>
        <Button 
          size="sm" 
          kind={isCreatingNew ? 'secondary' : 'primary'} 
          renderIcon={isCreatingNew ? Checkmark : Add}
          onClick={() => setIsCreatingNew(!isCreatingNew)}
        >
          {isCreatingNew ? 'View Active Campaigns' : '+ Create New Campaign'}
        </Button>
      </div>

      {savedSuccess && (
        <InlineNotification
          kind="success"
          title="Campaign Created & Activated!"
          subtitle="New campaign parameters broadcasted across Discovery, Negotiation, and VideoDB Audit engines."
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      {/* View 1: Active Campaigns Ledger */}
      {!isCreatingNew && (
        <Tile style={{ padding: '1.5rem', background: '#262626', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#edf5ff', margin: 0 }}>
              Active Brand Campaigns ({campaignsList.length})
            </h3>
            <Button size="sm" kind="ghost" renderIcon={Renew} onClick={fetchCampaigns}>Refresh List</Button>
          </div>

          {campaignsList.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#a8a8a8' }}>
              <p>No campaigns created yet. Click "+ Create New Campaign" to launch your first creator campaign!</p>
            </div>
          ) : (
            <Table size="lg">
              <TableHead>
                <TableRow>
                  <TableHeader>Brand & Product</TableHeader>
                  <TableHeader>Max Creator Cap</TableHeader>
                  <TableHeader>Mandatory Spoken Phrase</TableHeader>
                  <TableHeader>Promo Code</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Action</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {campaignsList.map(c => {
                  const isActive = activeCampaign?.id === c.id || (activeCampaign?.brandName === c.brandName && activeCampaign?.productName === c.productName);
                  return (
                    <TableRow key={c.id} style={{ background: isActive ? 'rgba(15, 98, 254, 0.1)' : 'transparent' }}>
                      <TableCell style={{ fontWeight: '600', color: '#ffffff' }}>
                        <div>{c.productName || c.product_name}</div>
                        <span style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>{c.brandName || c.brand_name}</span>
                      </TableCell>
                      <TableCell style={{ color: '#f1c21b', fontWeight: '600' }}>
                        ₹{(c.maxBudgetPerCreator || c.max_budget_per_creator || 50000).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell style={{ color: '#4589ff', fontSize: '0.8rem', maxWidth: '240px' }}>
                        "{c.mandatoryPhrases || c.mandatory_phrases}"
                      </TableCell>
                      <TableCell>
                        <Tag type="teal" size="sm">{c.promoCode || c.promo_code || 'BOAT30'}</Tag>
                      </TableCell>
                      <TableCell>
                        <Tag type={isActive ? 'green' : 'blue'} size="sm">
                          {isActive ? 'ACTIVE WORKSPACE' : 'READY'}
                        </Tag>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          kind={isActive ? 'tertiary' : 'primary'}
                          onClick={() => onSwitchCampaign(c)}
                        >
                          {isActive ? 'Selected' : 'Select Campaign'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Tile>
      )}

      {/* View 2: Create New Campaign Form */}
      {isCreatingNew && (
        <>
          <Tile style={{ padding: '1.25rem', marginBottom: '1.5rem', background: '#262626', borderLeft: '4px solid #0f62fe' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#a8a8a8' }}>New Campaign Strategy Estimate:</span>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#ffffff', marginTop: '0.25rem' }}>
                  ₹{(totalBudget / 100000).toFixed(1)} Lakh Budget → {microCount} Micro + {midCount} Mid + {macroCount} Macro Creators
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Tag type="teal" size="md" style={{ fontWeight: '700' }}>
                  Est. Reach: {estReachMillions}M Views
                </Tag>
                <div style={{ fontSize: '0.75rem', color: '#f1c21b', marginTop: '0.25rem' }}>
                  Allocated: ₹{estSpentINR.toLocaleString('en-IN')} / ₹{totalBudget.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </Tile>

          <Tile style={{ padding: '2rem', background: '#262626' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <TextInput
                  id="brand-name"
                  labelText="Indian Brand / Company Name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. boAt, Mamaearth, Lenskart"
                  required
                />
                <TextInput
                  id="product-name"
                  labelText="Product / Service Title"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. boAt Wave Smartwatch 2026"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <NumberInput
                  id="total-budget"
                  label="Total Campaign Spend Budget (₹ INR)"
                  value={totalBudget}
                  onChange={(e, { value }) => setTotalBudget(value)}
                  min={50000}
                  max={10000000}
                  step={50000}
                />
                <NumberInput
                  id="max-budget"
                  label="Max Budget Cap per Creator (₹ INR)"
                  value={maxBudget}
                  onChange={(e, { value }) => setMaxBudget(value)}
                  min={5000}
                  max={500000}
                  step={5000}
                />
              </div>

              <div style={{ background: '#161616', padding: '1.25rem', borderRadius: '4px', border: '1px solid #393939' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f62fe', marginBottom: '0.75rem' }}>
                  Creator Tier Budget Distribution
                </h4>
                <Grid style={{ padding: 0, rowGap: '1rem', columnGap: '1rem' }}>
                  <Column lg={5} md={2} sm={2}>
                    <NumberInput
                      id="micro-count"
                      label="Micro Creators (<500K followers)"
                      value={microCount}
                      onChange={(e, { value }) => setMicroCount(value)}
                      min={0}
                      max={100}
                    />
                  </Column>
                  <Column lg={5} md={2} sm={2}>
                    <NumberInput
                      id="mid-count"
                      label="Mid-Tier Creators (500K-2M)"
                      value={midCount}
                      onChange={(e, { value }) => setMidCount(value)}
                      min={0}
                      max={50}
                    />
                  </Column>
                  <Column lg={6} md={4} sm={4}>
                    <NumberInput
                      id="macro-count"
                      label="Macro Creators (>2M followers)"
                      value={macroCount}
                      onChange={(e, { value }) => setMacroCount(value)}
                      min={0}
                      max={10}
                    />
                  </Column>
                </Grid>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <TextInput
                  id="mandatory-phrase"
                  labelText="Mandatory Spoken Phrase (Verified by VideoDB)"
                  helperText="The creator MUST speak this phrase in their video (Hindi/Hinglish/English)."
                  value={mandatoryPhrases}
                  onChange={(e) => setMandatoryPhrases(e.target.value)}
                  required
                />
                <TextInput
                  id="promo-code"
                  labelText="Affiliate Promo / Coupon Code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="e.g. SAVER20"
                />
              </div>

              <TextArea
                id="guidelines"
                labelText="Product Deliverable Guidelines & Usage Rights Restrictions"
                helperText="Key features to highlight, visual product angles, organic rights period, and description link requirements."
                rows={3}
                value={guidelines}
                onChange={(e) => setGuidelines(e.target.value)}
              />

              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button type="submit" renderIcon={CheckmarkFilled} size="lg" disabled={submitting}>
                  {submitting ? 'Saving Campaign...' : 'Save & Activate Campaign'}
                </Button>
                <Button kind="secondary" size="lg" onClick={() => setIsCreatingNew(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Tile>
        </>
      )}
    </div>
  );
}
