import React, { useState, useEffect, useCallback } from 'react';
import { 
  Tile, 
  Grid, 
  Column, 
  Button, 
  TextArea, 
  TextInput,
  Tag, 
  InlineNotification,
  Loading,
  Search as SearchInput
} from '@carbon/react';
import { 
  Email, 
  Send, 
  Checkmark, 
  CheckmarkFilled,
  Edit, 
  Reset, 
  Bot, 
  User, 
  Renew,
  ChevronRight,
  Currency,
  Launch
} from '@carbon/icons-react';

// Typewriter Text Effect for live AI response
function TypewriterText({ text, speed = 10 }) {
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
            height: '14px',
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

const QUICK_SIMULATION_CHIPS = [
  "Bhai, ₹25k is too low. Can we do ₹35,000 for a dedicated Reel?",
  "I am interested! I accept the offered fee. Please share next steps.",
  "Can you increase the budget to ₹30,000? I will also post on Stories.",
  "Will the brand provide a product sample unit before shooting?"
];

export default function EmailNegotiator({ campaignId, activeDeal, onDealUpdated, onNavigateToDiscovery }) {
  const [deals, setDeals] = useState([]);
  const [selectedDealId, setSelectedDealId] = useState(activeDeal?.id || null);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [creatorReplyInput, setCreatorReplyInput] = useState('');
  const [manualPriceOverride, setManualPriceOverride] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [senderEmail, setSenderEmail] = useState('');

  const thinkingSteps = [
    'Analyzing creator response and commercial parameters...',
    'Evaluating budget ceiling & Section 194J 10% TDS tax rule...',
    'Invoking Google Gemini AI for contextual commercial reply...',
    'Committing negotiated terms and updating deal pipeline...'
  ];

  // Fetch sender status
  useEffect(() => {
    fetch('/api/integrations/gmail/status')
      .then(r => r.json())
      .then(d => { if (d.email) setSenderEmail(d.email); })
      .catch(() => {});
  }, []);

  // Fetch campaign deals
  const fetchDeals = useCallback(async () => {
    setLoadingDeals(true);
    try {
      const url = campaignId ? `/api/deals?campaignId=${campaignId}` : '/api/deals';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setDeals(list);
        if (list.length > 0) {
          if (!selectedDealId || !list.some(d => d.id === selectedDealId)) {
            setSelectedDealId(activeDeal?.id || list[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load deals in EmailNegotiator', err);
    } finally {
      setLoadingDeals(false);
    }
  }, [campaignId, activeDeal, selectedDealId]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  useEffect(() => {
    if (activeDeal?.id) {
      setSelectedDealId(activeDeal.id);
    }
  }, [activeDeal]);

  const currentDeal = deals.find(d => d.id === selectedDealId) || activeDeal || deals[0];

  const filteredDeals = deals.filter(d => {
    if (!searchQuery) return true;
    const name = d.creatorName || '';
    const email = d.creatorEmail || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSimulateCreatorReply = async (e) => {
    if (e) e.preventDefault();
    if (!creatorReplyInput.trim() || !currentDeal) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setThinkingStep(0);

    const stepInterval = setInterval(() => {
      setThinkingStep((prev) => (prev < thinkingSteps.length - 1 ? prev + 1 : prev));
    }, 700);

    try {
      const token = localStorage.getItem('cc_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/deals/${currentDeal.id}/negotiate`, {
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
        setDeals(prev => prev.map(d => d.id === data.deal.id ? data.deal : d));
        if (onDealUpdated) onDealUpdated(data.deal);
        setCreatorReplyInput('');
        setManualPriceOverride('');
        setSuccessMsg(`AI Negotiator replied to ${data.deal.creatorName} • Stage: ${data.deal.status}`);
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.error("Failed to process AI negotiation", err);
      setErrorMsg(err.message);
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'AGREED':
      case 'ACCEPTED':
        return 'green';
      case 'NEGOTIATING':
      case 'COUNTER_OFFER':
        return 'magenta';
      case 'INVITED':
      case 'CONTACTED':
        return 'cyan';
      case 'VIDEO_SUBMITTED':
      case 'PAID':
        return 'teal';
      default:
        return 'gray';
    }
  };

  return (
    <div className="email-negotiator-module" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '400', color: '#f4f4f4', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Email size={24} style={{ color: '#0f62fe' }} /> AI Autonomous Email Negotiator
          </h2>
          <p style={{ color: '#8d8d8d', fontSize: '0.875rem', margin: 0 }}>
            Real-time Gmail thread timeline with autonomous Google Gemini commercial negotiation & Section 194J TDS compliance.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#161616', border: '1px solid #333', padding: '0.35rem 0.75rem', borderRadius: 4, fontSize: '0.8rem' }}>
            <span style={{ color: '#8d8d8d' }}>Outbound Sender:</span>
            <span style={{ color: '#42be65', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckmarkFilled size={12} /> {senderEmail || 'yashwanthtm5@gmail.com'}
            </span>
          </div>
          <Button kind="ghost" size="sm" renderIcon={Renew} onClick={fetchDeals}>Sync Threads</Button>
        </div>
      </div>

      {errorMsg && (
        <InlineNotification
          kind="error"
          title="AI Negotiation Error"
          subtitle={errorMsg}
          onCloseButtonClick={() => setErrorMsg(null)}
        />
      )}

      {successMsg && (
        <InlineNotification
          kind="success"
          title="Thread Updated"
          subtitle={successMsg}
          onCloseButtonClick={() => setSuccessMsg(null)}
        />
      )}

      {/* Main Split Layout: Left Deal List, Right Active Thread */}
      <Grid style={{ padding: 0, margin: 0, gap: '1.25rem' }}>
        
        {/* LEFT COLUMN: Deal Selector Sidebar */}
        <Column lg={5} md={3} sm={4}>
          <Tile style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', padding: '1rem', borderRadius: 6, display: 'flex', flexDirection: 'column', height: '100%', minHeight: '620px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ color: '#f4f4f4', fontWeight: '600', fontSize: '0.9rem' }}>Contacted Creators</span>
              <Tag type="blue" size="sm">{deals.length} Active</Tag>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <SearchInput
                size="sm"
                labelText="Search"
                placeholder="Filter by creator name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background: '#121212' }}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '520px', paddingRight: '0.25rem' }}>
              {loadingDeals ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <Loading small withOverlay={false} />
                </div>
              ) : filteredDeals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#6e6e6e' }}>
                  <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>No outreach deals found in this campaign.</p>
                  {onNavigateToDiscovery && (
                    <Button kind="primary" size="sm" onClick={onNavigateToDiscovery} renderIcon={Launch}>
                      Find Creators
                    </Button>
                  )}
                </div>
              ) : (
                filteredDeals.map(d => {
                  const isSelected = d.id === currentDeal?.id;
                  const price = d.currentAgreedPrice || d.offeredPrice || 25000;
                  const lastMsg = d.emailThread && d.emailThread.length > 0 ? d.emailThread[d.emailThread.length - 1] : null;

                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDealId(d.id)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(15, 98, 254, 0.15)' : '#222222',
                        border: isSelected ? '1px solid #0f62fe' : '1px solid #333333',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <img
                          src={d.creatorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.creatorName || 'Creator')}&background=0f62fe&color=ffffff`}
                          alt={d.creatorName}
                          style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h5 style={{ margin: 0, color: '#f4f4f4', fontSize: '0.875rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {d.creatorName || 'Creator'}
                          </h5>
                          <span style={{ fontSize: '0.75rem', color: '#8d8d8d' }}>
                            {d.creatorEmail}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', fontSize: '0.75rem' }}>
                        <Tag type={getStatusColor(d.status)} size="sm">{d.status || 'INVITED'}</Tag>
                        <span style={{ color: '#42be65', fontWeight: '600' }}>₹{Number(price).toLocaleString('en-IN')}</span>
                      </div>

                      {lastMsg && (
                        <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.75rem', color: '#8d8d8d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lastMsg.sender === 'BRAND_AI' ? '🤖 You: ' : '👤 Creator: '}{lastMsg.body}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Tile>
        </Column>

        {/* RIGHT COLUMN: Active Deal Negotiation Workspace */}
        <Column lg={11} md={5} sm={4}>
          {currentDeal ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Active Deal Info Tile */}
              <Tile style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', padding: '1rem 1.25rem', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <img
                    src={currentDeal.creatorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentDeal.creatorName || 'Creator')}&background=0f62fe&color=ffffff`}
                    alt={currentDeal.creatorName}
                    style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: '2px solid #0f62fe' }}
                  />
                  <div>
                    <h3 style={{ margin: 0, color: '#f4f4f4', fontSize: '1.15rem', fontWeight: '600' }}>
                      {currentDeal.creatorName}
                    </h3>
                    <p style={{ margin: '0.15rem 0 0 0', color: '#a8a8a8', fontSize: '0.825rem' }}>
                      {currentDeal.creatorEmail} • Deal <span style={{ fontFamily: 'monospace', color: '#4589ff' }}>#{currentDeal.id}</span>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Commercial Terms</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#42be65' }}>
                      ₹{Number(currentDeal.currentAgreedPrice || currentDeal.offeredPrice || 25000).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <Tag type={getStatusColor(currentDeal.status)} size="md">
                    {currentDeal.status || 'INVITED'}
                  </Tag>
                </div>
              </Tile>

              {/* Email Thread Timeline Box */}
              <Tile style={{ background: '#161616', border: '1px solid #2e2e2e', padding: '1.25rem', borderRadius: 6, minHeight: '380px', maxHeight: '440px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(!currentDeal.emailThread || currentDeal.emailThread.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#6e6e6e' }}>
                    <Email size={32} style={{ marginBottom: '0.5rem', color: '#444' }} />
                    <p>No messages recorded yet in this proposal thread.</p>
                  </div>
                ) : (
                  currentDeal.emailThread.map((msg, idx) => {
                    const isBrand = msg.sender === 'BRAND_AI' || msg.sender === 'BRAND';
                    const isLatest = idx === currentDeal.emailThread.length - 1;

                    return (
                      <div
                        key={msg.id || idx}
                        style={{
                          maxWidth: '85%',
                          alignSelf: isBrand ? 'flex-start' : 'flex-end',
                          background: isBrand ? '#202020' : '#002d9c',
                          border: isBrand ? '1px solid #333' : '1px solid #0043ce',
                          borderRadius: 8,
                          padding: '1rem',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.75rem', gap: '1rem' }}>
                          <span style={{ fontWeight: '600', color: isBrand ? '#4589ff' : '#69c0ff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {isBrand ? <Bot size={14} /> : <User size={14} />} {msg.senderName || (isBrand ? 'Brand AI' : currentDeal.creatorName)}
                          </span>
                          <span style={{ color: '#8d8d8d' }}>{msg.timestamp || 'Just now'}</span>
                        </div>

                        <p style={{ margin: 0, color: '#f4f4f4', fontSize: '0.875rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                          {isLatest && isBrand && loading ? (
                            <TypewriterText text={msg.body} speed={8} />
                          ) : (
                            msg.body
                          )}
                        </p>
                      </div>
                    );
                  })
                )}

                {/* Animated AI Agent Thinking Card */}
                {loading && (
                  <div 
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: 8,
                      background: 'rgba(15, 98, 254, 0.1)',
                      borderLeft: '4px solid #0f62fe',
                      border: '1px solid rgba(15, 98, 254, 0.3)',
                      alignSelf: 'flex-start',
                      maxWidth: '85%'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                      <Loading small withOverlay={false} />
                      <span style={{ fontWeight: '600', color: '#78a9ff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Bot size={16} /> Gemini 2.0 AI Negotiator Thinking...
                      </span>
                    </div>
                    <div style={{ color: '#edf5ff', fontSize: '0.825rem' }}>
                      {thinkingSteps[thinkingStep]}
                    </div>
                  </div>
                )}
              </Tile>

              {/* Action & Simulator Composer */}
              <Tile style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', padding: '1.25rem', borderRadius: 6 }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f4f4f4' }}>
                    Simulate Creator Response (or Receive Real Inbound Email):
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {QUICK_SIMULATION_CHIPS.map((chip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCreatorReplyInput(chip)}
                        style={{
                          background: '#262626',
                          border: '1px solid #3d3d3d',
                          color: '#c6c6c6',
                          fontSize: '0.75rem',
                          padding: '0.3rem 0.6rem',
                          borderRadius: 14,
                          cursor: 'pointer'
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSimulateCreatorReply} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <TextArea
                    id="negotiator-reply-input"
                    labelText="Creator Message / Counter-Offer"
                    placeholder="Type creator response (e.g. 'I can do ₹30,000 for a Reel + 1 Story')..."
                    rows={3}
                    value={creatorReplyInput}
                    onChange={e => setCreatorReplyInput(e.target.value)}
                    style={{ background: '#121212' }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#8d8d8d' }}>Price Override (₹):</span>
                      <TextInput
                        id="price-override-input"
                        labelText=""
                        hideLabel
                        placeholder="e.g. 30000"
                        size="sm"
                        type="number"
                        value={manualPriceOverride}
                        onChange={e => setManualPriceOverride(e.target.value)}
                        style={{ width: 140, background: '#121212' }}
                      />
                    </div>

                    <Button
                      type="submit"
                      kind="primary"
                      renderIcon={Send}
                      disabled={loading || !creatorReplyInput.trim()}
                    >
                      {loading ? 'AI Negotiating...' : 'Trigger AI Auto-Negotiator (Gemini)'}
                    </Button>
                  </div>
                </form>
              </Tile>

            </div>
          ) : (
            <Tile style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', padding: '3rem', textAlign: 'center', borderRadius: 6 }}>
              <Email size={48} style={{ color: '#555', marginBottom: '1rem' }} />
              <h3 style={{ color: '#f4f4f4', fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Active Deal Selected</h3>
              <p style={{ color: '#8d8d8d', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Select a creator from the left sidebar to inspect and negotiate their collaboration proposal.
              </p>
              {onNavigateToDiscovery && (
                <Button kind="primary" size="md" onClick={onNavigateToDiscovery} renderIcon={Launch}>
                  Discover Creators & Launch Outreach
                </Button>
              )}
            </Tile>
          )}
        </Column>

      </Grid>

    </div>
  );
}

