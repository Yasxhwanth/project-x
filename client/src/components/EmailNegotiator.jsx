import React, { useState } from 'react';
import { 
  Tile, 
  Grid, 
  Column, 
  Button, 
  TextArea, 
  TextInput,
  Tag, 
  InlineNotification,
  Loading
} from '@carbon/react';
import { Email, Send, Checkmark, Edit, Reset } from '@carbon/icons-react';

export default function EmailNegotiator({ activeDeal, activeCampaign, onDealUpdated }) {
  const deal = activeDeal || {
    id: 'deal_01',
    creatorName: 'Vivek Mittal (Fit Tuber)',
    creatorEmail: 'vivek@fittuber.com',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    offeredPrice: 45000,
    currentAgreedPrice: 45000,
    status: 'COUNTER_OFFER',
    emailThread: [
      {
        id: 'msg_1',
        sender: 'BRAND_AI',
        senderName: 'boAt Marketing AI',
        recipientName: 'Vivek Mittal',
        body: 'Namaste Vivek, We would love to collaborate with Fit Tuber for boAt Airdopes Pro Max 500. Offered Fee: ₹45,000 for 1 Instagram Reel with mandatory phrase "Use code SAVER20 for 20% off".',
        timestamp: '10:15 AM'
      },
      {
        id: 'msg_2',
        sender: 'CREATOR',
        senderName: 'Vivek Mittal',
        recipientName: 'boAt Marketing AI',
        body: 'Bhai, 45k thoda kam h. Can we do ₹55,000? I will do unboxing + fitness test in the Reel.',
        timestamp: '10:42 AM'
      }
    ]
  };

  const campaign = activeCampaign || {
    brandName: 'boAt Lifestyle',
    productName: 'boAt Airdopes Pro Max 500',
    maxBudgetPerCreator: 50000,
    mandatoryPhrases: 'Use code SAVER20 for 20% off'
  };

  const [creatorReplyInput, setCreatorReplyInput] = useState('');
  const [manualPriceOverride, setManualPriceOverride] = useState('');
  const [isEditingOverride, setIsEditingOverride] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSimulateCreatorReply = async (e) => {
    e.preventDefault();
    if (!creatorReplyInput.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('cc_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/deals/${deal.id}/negotiate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          creatorMessage: creatorReplyInput,
          manualPriceOverride: manualPriceOverride ? parseInt(manualPriceOverride, 10) : null
        })
      });
      const data = await res.json();
      if (data.deal) {
        if (onDealUpdated) onDealUpdated(data.deal);
        setCreatorReplyInput('');
        setManualPriceOverride('');
        setIsEditingOverride(false);
      }
    } catch (err) {
      console.error("Failed to process AI negotiation", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-negotiator-module">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '400', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Email size={24} style={{ color: '#0f62fe' }} /> AI Back-and-Forth Email Negotiator & Manual Override Studio
        </h2>
        <p style={{ color: '#a8a8a8' }}>
          Autonomous Google Gemini AI negotiator with real-time inline manual price & message overrides.
        </p>
      </div>

      <Grid style={{ padding: 0, rowGap: '1.5rem', columnGap: '1.5rem' }}>
        {/* Deal Header Overview */}
        <Column lg={16} md={8} sm={4}>
          <Tile style={{ padding: '1.25rem', background: '#262626', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img src={deal.creatorAvatar} alt={deal.creatorName} style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>{deal.creatorName} ({deal.creatorEmail})</h3>
                <div style={{ fontSize: '0.85rem', color: '#a8a8a8' }}>Product: {campaign.productName}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#a8a8a8' }}>Current Agreed Fee: </span>
                <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f1c21b' }}>
                  ₹{(deal.currentAgreedPrice || deal.offeredPrice)?.toLocaleString('en-IN')}
                </span>
              </div>
              <Tag type={deal.status === 'AGREED' ? 'green' : 'yellow'} size="md">
                Status: {deal.status}
              </Tag>
            </div>
          </Tile>
        </Column>

        {/* Email Thread */}
        <Column lg={10} md={8} sm={4}>
          <Tile style={{ padding: '1.5rem', background: '#262626', minHeight: '420px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Live Email Negotiation Thread</h4>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '420px', paddingRight: '0.5rem' }}>
              {deal.emailThread?.map((msg) => (
                <div 
                  key={msg.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '4px',
                    background: msg.sender === 'BRAND_AI' ? '#161616' : '#393939',
                    borderLeft: msg.sender === 'BRAND_AI' ? '4px solid #0f62fe' : '4px solid #f1c21b',
                    alignSelf: msg.sender === 'BRAND_AI' ? 'flex-start' : 'flex-end',
                    width: '90%'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#a8a8a8' }}>
                    <strong>{msg.senderName}</strong>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div style={{ whiteSpace: 'pre-line', fontSize: '0.9rem', color: '#f4f4f4', lineHeight: '1.4' }}>
                    {msg.body}
                  </div>
                </div>
              ))}
            </div>
          </Tile>
        </Column>

        {/* Creator Reply Simulator & Manual Price Override Panel */}
        <Column lg={6} md={8} sm={4}>
          <Tile style={{ padding: '1.5rem', background: '#262626' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
              Simulate Creator Reply & Manual Override
            </h4>

            <form onSubmit={handleSimulateCreatorReply}>
              <TextArea
                id="creator-reply-input"
                labelText="Creator Incoming Email Response"
                placeholder="e.g., Bhai, 45k thoda kam h. Can we do ₹55,000?"
                rows={4}
                value={creatorReplyInput}
                onChange={(e) => setCreatorReplyInput(e.target.value)}
                style={{ marginBottom: '1rem' }}
                required
              />

              {/* Inline Manual Price Override Field */}
              <div style={{ background: '#161616', padding: '1rem', borderRadius: '4px', marginBottom: '1.25rem', border: '1px solid #393939' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f1c21b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Edit size={16} /> Manual Price Override (Optional)
                  </span>
                  <Tag type={manualPriceOverride ? "purple" : "gray"} size="sm">
                    {manualPriceOverride ? "Manual Override Active" : "AI Auto-Calculated"}
                  </Tag>
                </div>
                <TextInput
                  id="manual-price-override-input"
                  labelText=""
                  placeholder="Override agreed fee in ₹ (e.g. 50000)"
                  value={manualPriceOverride}
                  onChange={(e) => setManualPriceOverride(e.target.value)}
                  helperText="Leave blank for Autonomous AI negotiation, or type ₹ to force price override."
                />
              </div>

              <Button type="submit" kind="primary" renderIcon={Send} disabled={loading} style={{ width: '100%' }}>
                {loading ? "AI Processing..." : "Send Email & Trigger AI Negotiator"}
              </Button>
            </form>
          </Tile>
        </Column>
      </Grid>
    </div>
  );
}
