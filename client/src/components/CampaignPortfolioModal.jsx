import React, { useState } from 'react';
import {
  Modal,
  Grid,
  Column,
  Tile,
  Tag,
  Button,
  TextInput,
  InlineNotification,
  Form
} from '@carbon/react';
import { Portfolio, Add, Checkmark, Switcher, Launch } from '@carbon/icons-react';

export default function CampaignPortfolioModal({
  isOpen,
  onClose,
  campaigns,
  activeCampaign,
  onSelectCampaign,
  onCampaignCreated
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newMaxBudget, setNewMaxBudget] = useState('50000');
  const [newPromoCode, setNewPromoCode] = useState('LAUNCH10');
  const [newMandatoryPhrases, setNewMandatoryPhrases] = useState('Use code LAUNCH10 for 10% off');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!newBrandName.trim() || !newProductName.trim()) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('cc_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandName: newBrandName,
          productName: newProductName,
          maxBudgetPerCreator: parseInt(newMaxBudget, 10) || 50000,
          promoCode: newPromoCode,
          mandatoryPhrases: newMandatoryPhrases
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create campaign');

      if (data.campaign) {
        onCampaignCreated(data.campaign);
        onSelectCampaign(data.campaign);
        setNewBrandName('');
        setNewProductName('');
        setShowCreateForm(false);
        onClose();
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onRequestClose={onClose}
      modalHeading="Multi-Campaign Portfolio & Brand Management Studio"
      modalLabel="Enterprise Campaign Switcher"
      passiveModal
      size="lg"
      style={{ backgroundColor: '#161616' }}
    >
      <div style={{ padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <p style={{ color: '#c6c6c6', fontSize: '0.9rem' }}>
            Switch between active influencer campaigns or create a new campaign to manage budgets, deals, and AI negotiators.
          </p>
          <Button
            size="sm"
            kind={showCreateForm ? 'tertiary' : 'primary'}
            renderIcon={Add}
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'View Portfolio' : 'Create New Campaign'}
          </Button>
        </div>

        {errorMsg && (
          <InlineNotification
            kind="error"
            title="Campaign Error"
            subtitle={errorMsg}
            style={{ marginBottom: '1rem' }}
          />
        )}

        {showCreateForm ? (
          <Tile style={{ background: '#262626', padding: '1.5rem', borderRadius: '4px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#f4f4f4' }}>
              Create Brand Campaign
            </h4>
            <Form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Grid style={{ padding: 0, rowGap: '1rem', columnGap: '1rem' }}>
                <Column lg={8} md={4} sm={4}>
                  <TextInput
                    id="new-brand-name"
                    labelText="Brand / Organization Name"
                    placeholder="e.g., Snitch Apparel"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    required
                  />
                </Column>

                <Column lg={8} md={4} sm={4}>
                  <TextInput
                    id="new-product-name"
                    labelText="Target Product / Service Name"
                    placeholder="e.g., Oversized Linen Shirts"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    required
                  />
                </Column>

                <Column lg={8} md={4} sm={4}>
                  <TextInput
                    id="new-max-budget"
                    labelText="Max Budget Ceiling per Creator (₹)"
                    type="number"
                    value={newMaxBudget}
                    onChange={(e) => setNewMaxBudget(e.target.value)}
                    required
                  />
                </Column>

                <Column lg={8} md={4} sm={4}>
                  <TextInput
                    id="new-promo-code"
                    labelText="Campaign Promo Code"
                    placeholder="e.g., SNITCH15"
                    value={newPromoCode}
                    onChange={(e) => setNewPromoCode(e.target.value)}
                  />
                </Column>

                <Column lg={16} md={8} sm={4}>
                  <TextInput
                    id="new-mandatory-phrases"
                    labelText="Mandatory Spoken Phrase for Reel"
                    placeholder="e.g., Use code SNITCH15 for 15% off your order"
                    value={newMandatoryPhrases}
                    onChange={(e) => setNewMandatoryPhrases(e.target.value)}
                  />
                </Column>
              </Grid>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <Button kind="secondary" size="md" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="md" disabled={submitting || !newBrandName || !newProductName}>
                  {submitting ? 'Creating Campaign...' : 'Create & Activate Campaign'}
                </Button>
              </div>
            </Form>
          </Tile>
        ) : (
          <Grid style={{ padding: 0, rowGap: '1rem', columnGap: '1rem' }}>
            {campaigns.map((c) => {
              const isActive = activeCampaign?.id === c.id;
              return (
                <Column lg={8} md={8} sm={4} key={c.id}>
                  <Tile
                    style={{
                      background: isActive ? '#1f2937' : '#262626',
                      border: isActive ? '2px solid #0f62fe' : '1px solid #393939',
                      padding: '1.25rem',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justify: 'space-between',
                      borderRadius: '4px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>
                          {c.brandName}
                        </h4>
                        <Tag type={isActive ? 'green' : 'gray'} size="sm">
                          {isActive ? 'Active Campaign' : c.status}
                        </Tag>
                      </div>

                      <div style={{ fontSize: '0.9rem', color: '#c6c6c6', marginBottom: '1rem' }}>
                        Product: <span style={{ color: '#4589ff', fontWeight: '500' }}>{c.productName}</span>
                      </div>

                      <div style={{ background: '#161616', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <div>
                          <div style={{ color: '#8d8d8d' }}>Budget / Creator</div>
                          <div style={{ fontWeight: '700', color: '#f1c21b' }}>₹{c.maxBudgetPerCreator?.toLocaleString('en-IN')}</div>
                        </div>
                        <div>
                          <div style={{ color: '#8d8d8d' }}>Deals Active</div>
                          <div style={{ fontWeight: '700', color: '#ffffff' }}>{c.dealCount || 1} Creators</div>
                        </div>
                        <div>
                          <div style={{ color: '#8d8d8d' }}>Spent</div>
                          <div style={{ fontWeight: '700', color: '#42be65' }}>₹{(c.totalSpent || 20000)?.toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      kind={isActive ? 'tertiary' : 'primary'}
                      renderIcon={isActive ? Checkmark : Switcher}
                      disabled={isActive}
                      onClick={() => {
                        onSelectCampaign(c);
                        onClose();
                      }}
                      style={{ width: '100%' }}
                    >
                      {isActive ? 'Selected Active Campaign' : 'Switch to this Campaign'}
                    </Button>
                  </Tile>
                </Column>
              );
            })}
          </Grid>
        )}
      </div>
    </Modal>
  );
}
