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
  Launch,
  Time,
  Information,
  Add,
  SettingsAdjust,
  CheckmarkOutline
} from '@carbon/icons-react';

// Typewriter Text Effect for live AI response
function TypewriterText({ text, speed = 8 }) {
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
            width: '6px',
            height: '14px',
            background: '#0f62fe',
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
  { label: '💰 Counter at ₹35,000', text: 'Hey, my standard rate for a dedicated Reel is ₹35,000 given my engagement rate. Can we meet at ₹35k?' },
  { label: '🤝 Accept at ₹30,000', text: 'Namaste! ₹30,000 sounds fair for the integration. Please send over the agreement and ship the product unit.' },
  { label: '📦 Request 2 Product Units', text: 'I would love to partner! Could you also send a 2nd unit for a viewer giveaway during the launch?' },
  { label: '📹 Add 2 Story Integrations', text: 'Can you do ₹32,000? In return, I will include 2 Instagram Stories with direct swipe-up discount links.' }
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
  
  // 🧠 Creator Persistent Memory & Context Intelligence State
  const [creatorMemory, setCreatorMemory] = useState(null);
  const [loadingMemory, setLoadingMemory] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newMemoryNote, setNewMemoryNote] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState('PRICING_HISTORY');

  // Inline Creator Email Editor State
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');
  const [syncingInbox, setSyncingInbox] = useState(false);

  const thinkingSteps = [
    'Recalling creator episodic memory & past deal benchmarks...',
    'Analyzing creator response and commercial parameters...',
    'Evaluating budget ceiling & Section 194J 10% TDS tax rule...',
    'Invoking Google Gemini AI with multi-turn conversation memory...',
    'Committing negotiated terms and updating persistent creator memory...'
  ];

  // Fetch sender status
  useEffect(() => {
    fetch('/api/integrations/gmail/status')
      .then(r => r.json())
      .then(d => { if (d.email) setSenderEmail(d.email); })
      .catch(() => {});
  }, []);

  // Sync inbound creator replies from real Gmail inbox
  const handleSyncInboundReplies = async () => {
    setSyncingInbox(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/integrations/gmail/sync-replies', { method: 'POST' });
      const data = await res.json();
      if (data.newReplies > 0) {
        setSuccessMsg(`📥 Synced ${data.newReplies} new creator reply from Gmail! AI processed counter-offers and updated terms.`);
        await fetchDeals();
      } else {
        setSuccessMsg('Inbox checked: all creator email threads are currently up to date.');
      }
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch(err) {
      console.error('[Sync Replies Error]:', err);
      setErrorMsg('Failed to poll Gmail inbox: ' + err.message);
    } finally {
      setSyncingInbox(false);
    }
  };

  // Fetch campaign deals
  const fetchDeals = useCallback(async () => {
    setLoadingDeals(true);
    try {
      const url = campaignId ? `/api/deals?campaignId=${campaignId}` : '/api/deals';
      const res = await fetch(url);
      const data = await res.json();
      const rawDeals = data.deals || [];

      // Deduplicate deals by creator_email / creator_name for a pristine list
      const uniqueMap = new Map();
      rawDeals.forEach(d => {
        const key = (d.creatorEmail || d.creator_email || d.creatorName || d.id).toLowerCase();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, d);
        } else {
          // Keep the one with more messages
          const existing = uniqueMap.get(key);
          if ((d.emailThread?.length || 0) > (existing.emailThread?.length || 0)) {
            uniqueMap.set(key, d);
          }
        }
      });

      const cleanDeals = Array.from(uniqueMap.values());
      setDeals(cleanDeals);
      
      if (!selectedDealId && cleanDeals.length > 0) {
        setSelectedDealId(cleanDeals[0].id);
      }
    } catch (err) {
      console.error("Failed to load deals", err);
    } finally {
      setLoadingDeals(false);
    }
  }, [campaignId, selectedDealId]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Find currently active deal
  const currentDeal = deals.find(d => d.id === selectedDealId) || deals[0] || null;

  // Load creator persistent memory whenever selected deal changes
  useEffect(() => {
    if (!currentDeal) return;
    setLoadingMemory(true);
    const targetId = currentDeal.creatorId || currentDeal.creatorEmail || currentDeal.id;
    fetch(`/api/creators/${encodeURIComponent(targetId)}/memory`)
      .then(r => r.json())
      .then(data => {
        setCreatorMemory(data);
      })
      .catch(err => {
        console.error('Failed to load creator memory:', err);
      })
      .finally(() => setLoadingMemory(false));
  }, [currentDeal?.id, currentDeal?.creatorEmail]);

  // Filter deals
  const filteredDeals = deals.filter(d => 
    (d.creatorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.creatorEmail || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Send reply / negotiation turn
  const handleSendCreatorReply = async (messageText = null) => {
    const textToSend = messageText || creatorReplyInput;
    if (!textToSend.trim() || !currentDeal) return;

    setLoading(true);
    setThinkingStep(0);
    setErrorMsg(null);
    setSuccessMsg(null);

    const stepInterval = setInterval(() => {
      setThinkingStep(prev => (prev < thinkingSteps.length - 1 ? prev + 1 : prev));
    }, 1000);

    try {
      const res = await fetch(`/api/deals/${currentDeal.id}/negotiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorMessage: textToSend,
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
        
        // Refresh memory profile
        const targetId = data.deal.creatorId || data.deal.creatorEmail;
        fetch(`/api/creators/${encodeURIComponent(targetId)}/memory`)
          .then(r => r.json())
          .then(setCreatorMemory)
          .catch(() => {});
      }
    } catch (err) {
      console.error("Failed to process AI negotiation", err);
      setErrorMsg(err.message);
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const handleAddCustomMemoryNote = async (e) => {
    e.preventDefault();
    if (!newMemoryNote.trim() || !currentDeal) return;
    try {
      const targetId = currentDeal.creatorId || currentDeal.creatorEmail;
      const res = await fetch(`/api/creators/${encodeURIComponent(targetId)}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorEmail: currentDeal.creatorEmail,
          creatorName: currentDeal.creatorName,
          memoryCategory: newMemoryCategory,
          memoryKey: newMemoryCategory === 'PRICING_HISTORY' ? 'Rate Preference' : newMemoryCategory === 'LOGISTICS_PREFERENCE' ? 'Logistics Note' : 'Creator Trait',
          memoryValue: newMemoryNote.trim(),
          sourceDealId: currentDeal.id
        })
      });
      if (res.ok) {
        setNewMemoryNote('');
        setShowAddNote(false);
        // Refresh memory profile
        fetch(`/api/creators/${encodeURIComponent(targetId)}/memory`)
          .then(r => r.json())
          .then(setCreatorMemory)
          .catch(() => {});
      }
    } catch(err) {
      console.error('Failed to record custom memory note:', err);
    }
  };

  const getStatusColor = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'AGREED':
      case 'ACCEPTED':
      case 'QA_PASSED':
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
            <Email size={24} style={{ color: '#0f62fe' }} /> AI Autonomous Email Negotiator & Memory Studio
          </h2>
          <p style={{ color: '#8d8d8d', fontSize: '0.875rem', margin: 0 }}>
            Real-time Gmail conversational intelligence powered by Google Gemini with persistent creator memory & Section 194J TDS compliance.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#161616', border: '1px solid #333', padding: '0.35rem 0.75rem', borderRadius: 4, fontSize: '0.8rem' }}>
            <span style={{ color: '#8d8d8d' }}>Outbound Sender:</span>
            <span style={{ color: '#42be65', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckmarkFilled size={12} /> {senderEmail || 'tsrajanna1@gmail.com'}
            </span>
          </div>
          <Button 
            kind="primary" 
            size="sm" 
            renderIcon={Renew} 
            disabled={syncingInbox} 
            onClick={handleSyncInboundReplies}
          >
            {syncingInbox ? 'Checking Gmail...' : 'Check Creator Email Replies'}
          </Button>
          <Button kind="ghost" size="sm" renderIcon={Renew} onClick={fetchDeals}>
            Refresh
          </Button>
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
          <Tile style={{ background: '#181818', border: '1px solid #2e2e2e', padding: '1rem', borderRadius: 6, display: 'flex', flexDirection: 'column', height: '100%', minHeight: '640px' }}>
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

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '540px', paddingRight: '0.25rem' }}>
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
                        padding: '0.85rem',
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(15, 98, 254, 0.15)' : '#222222',
                        border: isSelected ? '1px solid #0f62fe' : '1px solid #333333',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <img
                          src={d.creatorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.creatorName || 'Creator')}&background=0f62fe&color=ffffff`}
                          alt={d.creatorName}
                          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: isSelected ? '2px solid #0f62fe' : '1px solid #444' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h5 style={{ margin: 0, color: '#f4f4f4', fontSize: '0.9rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {d.creatorName || 'Creator'}
                          </h5>
                          <span style={{ fontSize: '0.75rem', color: '#8d8d8d', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {d.creatorEmail}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', fontSize: '0.75rem' }}>
                        <Tag type={getStatusColor(d.status)} size="sm">{d.status || 'INVITED'}</Tag>
                        <span style={{ color: '#42be65', fontWeight: '700', fontFamily: 'monospace', fontSize: '0.85rem' }}>₹{Number(price).toLocaleString('en-IN')}</span>
                      </div>

                      {lastMsg && (
                        <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.75rem', color: '#a8a8a8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lastMsg.sender === 'CREATOR' ? '👤 Creator: ' : '🤖 AI: '}{lastMsg.body}
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
              <Tile style={{ background: '#181818', border: '1px solid #2e2e2e', padding: '1rem 1.25rem', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <img
                    src={currentDeal.creatorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentDeal.creatorName || 'Creator')}&background=0f62fe&color=ffffff`}
                    alt={currentDeal.creatorName}
                    style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #0f62fe' }}
                  />
                  <div>
                    <h3 style={{ margin: 0, color: '#f4f4f4', fontSize: '1.15rem', fontWeight: '600' }}>
                      {currentDeal.creatorName}
                    </h3>
                    
                    {isEditingEmail ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                        <TextInput
                          id="edit-deal-email"
                          size="sm"
                          labelText=""
                          value={editedEmail}
                          onChange={e => setEditedEmail(e.target.value)}
                          placeholder="creator@gmail.com"
                          style={{ width: '240px' }}
                        />
                        <Button 
                          size="sm" 
                          kind="primary" 
                          hasIconOnly 
                          renderIcon={Checkmark} 
                          iconDescription="Save Email"
                          onClick={async () => {
                            if (!editedEmail.trim()) return;
                            try {
                              const res = await fetch(`/api/deals/${currentDeal.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ creatorEmail: editedEmail.trim() })
                              });
                              if (res.ok) {
                                setDeals(prev => prev.map(d => d.id === currentDeal.id ? { ...d, creatorEmail: editedEmail.trim(), creator_email: editedEmail.trim() } : d));
                                setIsEditingEmail(false);
                                setSuccessMsg(`Creator email updated to ${editedEmail.trim()} and saved.`);
                                setTimeout(() => setSuccessMsg(null), 4000);
                              }
                            } catch(err) { console.error(err); }
                          }}
                        />
                        <Button size="sm" kind="ghost" hasIconOnly renderIcon={Reset} iconDescription="Cancel" onClick={() => setIsEditingEmail(false)} />
                      </div>
                    ) : (
                      <p style={{ margin: '0.15rem 0 0 0', color: '#a8a8a8', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ color: '#4589ff', fontWeight: '500' }}>{currentDeal.creatorEmail}</span>
                        <button 
                          onClick={() => { setEditedEmail(currentDeal.creatorEmail || ''); setIsEditingEmail(true); }}
                          title="Edit recipient email address"
                          style={{ background: 'transparent', border: 'none', color: '#8d8d8d', cursor: 'pointer', padding: '0 2px', display: 'inline-flex', alignItems: 'center' }}
                        >
                          <Edit size={13} />
                        </button>
                        <span>• Deal <span style={{ fontFamily: 'monospace', color: '#4589ff' }}>#{currentDeal.id}</span></span>
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Agreed Fee</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: '700', color: '#42be65', fontFamily: 'monospace' }}>
                      ₹{Number(currentDeal.currentAgreedPrice || currentDeal.offeredPrice || 25000).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <Tag type={getStatusColor(currentDeal.status)} size="md">
                    {currentDeal.status || 'INVITED'}
                  </Tag>
                </div>
              </Tile>

              {/* 🧠 UPGRADED CREATOR MEMORY & EPISODIC INTELLIGENCE CARD */}
              <Tile style={{ background: '#1c1f26', border: '1px solid #2d3748', padding: '1rem 1.25rem', borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>🧠</span>
                    <span style={{ fontWeight: '700', color: '#78a9ff', fontSize: '0.9rem' }}>
                      Persistent Creator Memory & Intelligence Graph
                    </span>
                    <Tag type="blue" size="sm">
                      {creatorMemory?.stats?.totalInteractions || 1} Turn Interaction
                    </Tag>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#a8a8a8' }}>
                    <span>⚡ Turns: <strong style={{ color: '#42be65' }}>{currentDeal.emailThread?.length || 1} active</strong></span>
                    <span>•</span>
                    <span>📹 Compliance Score: <strong style={{ color: '#0f62fe' }}>{creatorMemory?.stats?.averageComplianceScore || 95}%</strong></span>
                    <span>•</span>
                    <span>🛡️ Status: <strong style={{ color: '#42be65' }}>{creatorMemory?.stats?.reliabilityRating || 'High'}</strong></span>
                    <Button 
                      kind="ghost" 
                      size="sm" 
                      onClick={() => setShowAddNote(!showAddNote)}
                      style={{ padding: '0 0.5rem', minHeight: '24px', fontSize: '0.75rem' }}
                    >
                      {showAddNote ? '✕ Cancel' : '＋ Add Fact'}
                    </Button>
                  </div>
                </div>

                {/* Quick Add Custom Fact Form */}
                {showAddNote && (
                  <form onSubmit={handleAddCustomMemoryNote} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <TextInput
                      id="custom-memory-note"
                      size="sm"
                      labelText=""
                      placeholder="e.g. Creator requires 2 testing units and prefers Hindi captions..."
                      value={newMemoryNote}
                      onChange={e => setNewMemoryNote(e.target.value)}
                      style={{ flex: 1, minWidth: '240px' }}
                    />
                    <Button type="submit" size="sm" kind="primary" disabled={!newMemoryNote.trim()}>
                      Save to Memory
                    </Button>
                  </form>
                )}

                {/* Structured Categorized Memory Pills */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {(creatorMemory?.memories && creatorMemory.memories.length > 0 ? creatorMemory.memories : []).map(m => {
                    const isPrice = m.memory_category === 'PRICING_HISTORY' || m.memory_key?.toLowerCase().includes('rate');
                    const isDeliverable = m.memory_category === 'DELIVERABLE_PREFERENCE' || m.memory_key?.toLowerCase().includes('format');
                    const isLogistics = m.memory_category === 'LOGISTICS_PREFERENCE' || m.memory_key?.toLowerCase().includes('sample');
                    const isCompliance = m.memory_category === 'COMPLIANCE_RECORD' || m.memory_key?.toLowerCase().includes('safety');

                    const icon = isPrice ? '💰' : isDeliverable ? '🎬' : isLogistics ? '📦' : isCompliance ? '🛡️' : '🎙️';
                    const borderColor = isPrice ? '#24a148' : isDeliverable ? '#0f62fe' : isLogistics ? '#f1c21b' : '#8a3ffc';

                    return (
                      <div 
                        key={m.id || m.memory_key}
                        style={{ 
                          fontSize: '0.78rem', 
                          padding: '0.35rem 0.65rem', 
                          background: '#12161f', 
                          border: `1px solid ${borderColor}`, 
                          borderRadius: 4, 
                          color: '#f4f4f4',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        <span>{icon}</span>
                        <strong style={{ color: '#78a9ff' }}>{m.memory_key}:</strong>
                        <span>{m.memory_value}</span>
                      </div>
                    );
                  })}
                </div>
              </Tile>

              {/* TWO-WAY EMAIL CONVERSATION TIMELINE */}
              <Tile style={{ background: '#121212', border: '1px solid #262626', padding: '1.25rem', borderRadius: 6, minHeight: '400px', maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {(!currentDeal.emailThread || currentDeal.emailThread.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#6e6e6e' }}>
                    <Email size={36} style={{ marginBottom: '0.5rem', color: '#444' }} />
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
                          maxWidth: '88%',
                          alignSelf: isBrand ? 'flex-start' : 'flex-end',
                          background: isBrand ? '#1c2230' : '#14291e',
                          border: isBrand ? '1px solid #0f62fe' : '1px solid #24a148',
                          borderLeftWidth: isBrand ? '4px' : '1px',
                          borderRightWidth: !isBrand ? '4px' : '1px',
                          borderRadius: 8,
                          padding: '1.1rem',
                          boxShadow: '0 3px 12px rgba(0, 0, 0, 0.35)'
                        }}
                      >
                        {/* Header Bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', fontSize: '0.78rem', gap: '1rem' }}>
                          <span style={{ fontWeight: '700', color: isBrand ? '#78a9ff' : '#42be65', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {isBrand ? <Bot size={16} /> : <User size={16} />} 
                            {isBrand ? '⚡ boAt Creator Partnerships AI' : `👤 ${currentDeal.creatorName}`}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Tag type={isBrand ? 'blue' : 'green'} size="sm">
                              {isBrand ? 'OUTBOUND GMAIL' : 'INBOUND FROM CREATOR'}
                            </Tag>
                            <span style={{ color: '#8d8d8d', fontSize: '0.72rem' }}>{msg.timestamp || 'Just now'}</span>
                          </div>
                        </div>

                        {/* Body Message */}
                        <p style={{ margin: 0, color: '#f4f4f4', fontSize: '0.875rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                          {isLatest && isBrand && loading ? (
                            <TypewriterText text={msg.body} speed={6} />
                          ) : (
                            msg.body
                          )}
                        </p>

                        {/* Inline Carbon Financial Terms Pill Box (if commercial terms present) */}
                        {isBrand && (
                          <div style={{ marginTop: '0.85rem', background: '#12151d', border: '1px solid #2b3648', borderRadius: 4, padding: '0.6rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.78rem' }}>
                            <span style={{ color: '#a8a8a8' }}>
                              Offered Commercial: <strong style={{ color: '#42be65', fontFamily: 'monospace' }}>₹{Number(currentDeal.currentAgreedPrice || currentDeal.offeredPrice || 25000).toLocaleString('en-IN')}</strong>
                            </span>
                            <span style={{ color: '#78a9ff' }}>
                              Net Escrow (10% TDS): <strong style={{ color: '#f4f4f4', fontFamily: 'monospace' }}>₹{Math.round(Number(currentDeal.currentAgreedPrice || currentDeal.offeredPrice || 25000) * 0.9).toLocaleString('en-IN')}</strong>
                            </span>
                            <span style={{ color: '#a8a8a8' }}>
                              Promo: <code style={{ color: '#f4f4f4', background: '#222', padding: '1px 4px' }}>SAVER20</code>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Animated AI Agent Thinking Card */}
                {loading && (
                  <div 
                    style={{
                      maxWidth: '88%',
                      alignSelf: 'flex-start',
                      background: 'rgba(15, 98, 254, 0.08)',
                      border: '1px dashed #0f62fe',
                      borderRadius: 8,
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem'
                    }}
                  >
                    <Loading small withOverlay={false} />
                    <div>
                      <div style={{ color: '#78a9ff', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                        Google Gemini 3.1 Neural Reasoning in Progress...
                      </div>
                      <div style={{ color: '#a8a8a8', fontSize: '0.78rem' }}>
                        {thinkingSteps[thinkingStep]}
                      </div>
                    </div>
                  </div>
                )}
              </Tile>

              {/* QUICK SIMULATION CHIPS & INTERACTIVE COMPOSER DOCK */}
              <Tile style={{ background: '#181818', border: '1px solid #2e2e2e', padding: '1.1rem 1.25rem', borderRadius: 6 }}>
                
                {/* Simulation Scenario Chips */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>
                    Quick Simulation Prompts (Test Back-and-Forth AI Negotiation):
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {QUICK_SIMULATION_CHIPS.map((chip, idx) => (
                      <button
                        key={idx}
                        disabled={loading}
                        onClick={() => {
                          setCreatorReplyInput(chip.text);
                          handleSendCreatorReply(chip.text);
                        }}
                        style={{
                          background: '#222222',
                          border: '1px solid #3d3d3d',
                          borderRadius: 4,
                          color: '#f4f4f4',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#0f62fe'; e.currentTarget.style.background = '#282828'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#3d3d3d'; e.currentTarget.style.background = '#222222'; }}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Message Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <TextArea
                    id="creator-reply-input"
                    labelText="Inbound Creator Message (or Simulate Email Reply):"
                    placeholder="Type what the creator says (e.g. 'Can we do ₹32,000 + 2 Stories?' or 'Accepted, let's proceed')..."
                    value={creatorReplyInput}
                    onChange={e => setCreatorReplyInput(e.target.value)}
                    rows={2}
                    disabled={loading}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#8d8d8d' }}>Force Agreed Price Override:</span>
                      <TextInput
                        id="price-override"
                        size="sm"
                        labelText=""
                        placeholder="₹ Optional"
                        value={manualPriceOverride}
                        onChange={e => setManualPriceOverride(e.target.value)}
                        style={{ width: '110px' }}
                        disabled={loading}
                      />
                    </div>

                    <Button
                      kind="primary"
                      size="sm"
                      renderIcon={Send}
                      disabled={loading || !creatorReplyInput.trim()}
                      onClick={() => handleSendCreatorReply()}
                    >
                      {loading ? 'AI Formulating Counter-Offer...' : 'Send Message & Run AI Counter-Offer'}
                    </Button>
                  </div>
                </div>
              </Tile>

            </div>
          ) : (
            <Tile style={{ background: '#181818', border: '1px solid #2e2e2e', padding: '3rem', textAlign: 'center' }}>
              <Email size={48} style={{ color: '#0f62fe', marginBottom: '1rem' }} />
              <h3 style={{ color: '#f4f4f4', marginBottom: '0.5rem' }}>No Creator Deal Selected</h3>
              <p style={{ color: '#8d8d8d', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                Select a creator from the left sidebar to inspect real Gmail threads, view persistent episodic memory, or negotiate commercial rates.
              </p>
            </Tile>
          )}
        </Column>

      </Grid>
    </div>
  );
}
