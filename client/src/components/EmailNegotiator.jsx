import React, { useState, useEffect } from 'react';
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
import { Email, Send, Checkmark, Edit, Reset, Bot } from '@carbon/icons-react';

// Procedurally Generated Typewriter Text Component
function TypewriterText({ text, speed = 12 }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    setIsTyping(true);

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => text.substring(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayedText}
      {isTyping && (
        <span 
          style={{
            display: 'inline-block',
            width: '8px',
            height: '15px',
            background: '#4589ff',
            marginLeft: '4px',
            verticalAlign: 'middle',
            animation: 'blink 0.8s infinite'
          }}
        />
      )}
    </span>
  );
}

export default function EmailNegotiator({ activeDeal, activeCampaign, onDealUpdated }) {
  const deal = activeDeal || {
    id: 'deal_01',
    creatorName: 'Fit Tuber Hindi',
    creatorEmail: 'contact@fittuberhindi.in',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    offeredPrice: 12000,
    currentAgreedPrice: 12000,
    status: 'NEGOTIATING',
    emailThread: [
      {
        id: 'msg_1',
        sender: 'BRAND_AI',
        senderName: 'boAt Marketing AI',
        recipientName: 'Fit Tuber Hindi',
        body: 'Namaste, We would love to collaborate for boAt Airdopes Pro Max 500. Offered Fee: ₹12,000.',
        timestamp: '10:15 AM'
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
  const [thinkingStep, setThinkingStep] = useState(0);

  const thinkingSteps = [
    '🔍 Analyzing creator message & counter-offer rate request...',
    '⚖️ Evaluating Section 194J 10% TDS tax compliance policy...',
    '✨ Invoking Google Gemini 2.5 Flash API for Hinglish brand response...',
    '✉️ Finalizing email payload & updating state machine...'
  ];

  const [errorMsg, setErrorMsg] = useState(null);

  const handleSimulateCreatorReply = async (e) => {
    e.preventDefault();
    if (!creatorReplyInput.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setThinkingStep(0);
    const stepInterval = setInterval(() => {
      setThinkingStep((prev) => (prev < thinkingSteps.length - 1 ? prev + 1 : prev));
    }, 700);

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
      if (!res.ok) {
        throw new Error(data.error || "AI Negotiation request failed");
      }
      if (data.deal) {
        if (onDealUpdated) onDealUpdated(data.deal);
        setCreatorReplyInput('');
        setManualPriceOverride('');
        setIsEditingOverride(false);
      }
    } catch (err) {
      console.error("Failed to process AI negotiation", err);
      setErrorMsg(err.message);
    } finally {
      clearInterval(stepInterval);
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
          Autonomous Google Gemini AI negotiator with procedural response streaming & manual overrides.
        </p>
      </div>

      {errorMsg && (
        <InlineNotification
          kind="error"
          title="Google Gemini AI Negotiation Error"
          subtitle={errorMsg}
          style={{ marginBottom: '1.25rem' }}
        />
      )}

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
          <Tile style={{ padding: '1.5rem', background: '#262626', minHeight: '450px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={20} style={{ color: '#0f62fe' }} /> Live Email Negotiation Thread
            </h4>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '420px', paddingRight: '0.5rem' }}>
              {deal.emailThread?.map((msg, idx) => {
                const isLatestAiReply = msg.sender === 'BRAND_AI' && idx === deal.emailThread.length - 1;
                return (
                  <div 
                    key={msg.id}
                    style={{
                      padding: '1rem',
                      borderRadius: '4px',
                      background: msg.sender === 'BRAND_AI' ? '#161616' : '#393939',
                      borderLeft: msg.sender === 'BRAND_AI' ? '4px solid #0f62fe' : '4px solid #f1c21b',
                      alignSelf: msg.sender === 'BRAND_AI' ? 'flex-start' : 'flex-end',
                      width: '92%'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#a8a8a8' }}>
                      <span style={{ fontWeight: '600', color: msg.sender === 'BRAND_AI' ? '#4589ff' : '#f1c21b' }}>
                        {msg.senderName}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p style={{ color: '#ffffff', whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '0.9rem', margin: 0 }}>
                      {isLatestAiReply ? (
                        <TypewriterText text={msg.body} speed={10} />
                      ) : (
                        msg.body
                      )}
                    </p>
                  </div>
                );
              })}

              {/* Animated AI Agent Thinking Card */}
              {loading && (
                <div 
                  style={{
                    padding: '1.25rem',
                    borderRadius: '4px',
                    background: '#001d6c',
                    borderLeft: '4px solid #4589ff',
                    boxShadow: '0 0 15px rgba(15, 98, 254, 0.5)',
                    alignSelf: 'flex-start',
                    width: '92%',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Loading small withOverlay={false} />
                    <span style={{ fontWeight: '600', color: '#78a9ff', fontSize: '0.95rem' }}>
                      🤖 Gemini AI Agent Reasoning in Progress...
                    </span>
                  </div>
                  <div style={{ color: '#edf5ff', fontSize: '0.875rem', fontWeight: '500' }}>
                    {thinkingSteps[thinkingStep]}
                  </div>
                </div>
              )}
            </div>
          </Tile>
        </Column>

        {/* Action Panel */}
        <Column lg={6} md={8} sm={4}>
          <Tile style={{ padding: '1.5rem', background: '#262626', height: '100%' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Simulate Creator Reply & Manual Override</h4>

            <form onSubmit={handleSimulateCreatorReply} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <TextArea
                id="creator-reply-input"
                labelText="Creator Incoming Email Response"
                placeholder="e.g., Bhai, 45k thoda kam h. Can we do ₹55,000?"
                rows={4}
                value={creatorReplyInput}
                onChange={(e) => setCreatorReplyInput(e.target.value)}
                required
              />

              <div style={{ background: '#161616', padding: '1rem', borderRadius: '4px', border: '1px solid #393939' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f1c21b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Edit size={16} /> Manual Price Override (Optional)
                  </span>
                  <Tag type={manualPriceOverride ? 'purple' : 'gray'} size="sm">
                    {manualPriceOverride ? 'Manual Active' : 'AI Auto-Calculated'}
                  </Tag>
                </div>
                <TextInput
                  id="manual-price-override"
                  labelText=""
                  hideLabel
                  placeholder="Override agreed fee in ₹ (e.g. 50000)"
                  type="number"
                  value={manualPriceOverride}
                  onChange={(e) => setManualPriceOverride(e.target.value)}
                  helperText="Leave blank for Autonomous AI negotiation, or type ₹ to force price override."
                />
              </div>

              <Button type="submit" renderIcon={Send} disabled={loading || !creatorReplyInput.trim()}>
                {loading ? 'AI Negotiating...' : 'Send Email & Trigger AI Negotiator'}
              </Button>
            </form>
          </Tile>
        </Column>
      </Grid>
    </div>
  );
}
