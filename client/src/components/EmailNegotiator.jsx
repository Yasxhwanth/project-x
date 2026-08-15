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
  CheckmarkOutline,
  Document
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

const QUICK_RESPONSE_PRESETS = [
  { label: 'Counter: ₹35,000', text: 'Thank you for reaching out. My standard rate for a dedicated Reel is ₹35,000 given my engagement metrics. Can we align at ₹35,000?' },
  { label: 'Accept Offer: ₹30,000', text: 'The proposed terms of ₹30,000 sound good. Please share the formal agreement and arrange sample product dispatch.' },
  { label: 'Request Product Sample', text: 'I am interested in collaborating. Could you dispatch a review unit to my registered address before we lock the shooting schedule?' },
  { label: 'Bundle 2x Stories', text: 'Can we agree on ₹32,000? I will include 2 Instagram Story mentions with swipe-up discount links alongside the dedicated Reel.' }
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
  
  // Creator Persistent Memory State
  const [creatorMemory, setCreatorMemory] = useState(null);
  const [loadingMemory, setLoadingMemory] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newMemoryNote, setNewMemoryNote] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState('PRICING_HISTORY');

  // Inline Email Editor State
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');
  const [syncingInbox, setSyncingInbox] = useState(false);

  const thinkingSteps = [
    'Evaluating creator response and commercial parameters...',
    'Reviewing budget limits and TDS tax requirements...',
    'Formulating negotiation terms with conversation context...',
    'Updating deal terms and recording creator preferences...'
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
        setSuccessMsg(`Received ${data.newReplies} new creator reply from Gmail. Deal terms updated.`);
        await fetchDeals();
      } else {
        setSuccessMsg('Inbox is up to date. No new unread messages.');
      }
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch(err) {
      console.error('[Sync Replies Error]:', err);
      setErrorMsg('Failed to sync inbox: ' + err.message);
    } finally {
      setSyncingInbox(false);
    }
  };

  // Sync activeDeal prop from parent immediately
  useEffect(() => {
    if (activeDeal?.id) {
      setSelectedDealId(activeDeal.id);
      setDeals(prev => {
        if (!prev.find(d => d.id === activeDeal.id)) {
          return [activeDeal, ...prev];
        }
        return prev;
      });
    }
  }, [activeDeal]);

  // Fetch campaign deals with graceful fallback
  const fetchDeals = useCallback(async () => {
    setLoadingDeals(true);
    try {
      let res = await fetch(campaignId ? `/api/deals?campaignId=${campaignId}` : '/api/deals');
      let data = await res.json();
      let rawDeals = Array.isArray(data) ? data : (data.deals || []);

      // If no deals found for this specific campaign, fetch all deals across workspace
      if (rawDeals.length === 0 && campaignId) {
        res = await fetch('/api/deals');
        data = await res.json();
        rawDeals = Array.isArray(data) ? data : (data.deals || []);
      }

      // Deduplicate deals by creator_email / creator_name
      const uniqueMap = new Map();
      rawDeals.forEach(d => {
        const key = (d.creatorEmail || d.creator_email || d.creatorName || d.id).toLowerCase();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, d);
        } else {
          const existing = uniqueMap.get(key);
          if ((d.emailThread?.length || 0) >= (existing.emailThread?.length || 0)) {
            uniqueMap.set(key, d);
          }
        }
      });

      const cleanDeals = Array.from(uniqueMap.values());
      setDeals(cleanDeals);
      
      if (activeDeal?.id) {
        setSelectedDealId(activeDeal.id);
      } else if (cleanDeals.length > 0 && !selectedDealId) {
        setSelectedDealId(cleanDeals[0].id);
      }
    } catch (err) {
      console.error("Failed to load deals", err);
    } finally {
      setLoadingDeals(false);
    }
  }, [campaignId, selectedDealId, activeDeal?.id]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Find currently active deal
  const currentDeal = deals.find(d => d.id === selectedDealId) || deals[0] || null;

  // Load creator memory whenever selected deal changes
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
    }, 900);

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
        throw new Error(data.error || "Negotiation request failed");
      }

      if (data.deal) {
        setDeals(prev => prev.map(d => d.id === data.deal.id ? data.deal : d));
        if (onDealUpdated) onDealUpdated(data.deal);
        setCreatorReplyInput('');
        setManualPriceOverride('');
        setSuccessMsg(`Response sent to ${data.deal.creatorName}. Deal stage: ${data.deal.status}`);
        setTimeout(() => setSuccessMsg(null), 5000);
        
        // Refresh memory profile
        const targetId = data.deal.creatorId || data.deal.creatorEmail;
        fetch(`/api/creators/${encodeURIComponent(targetId)}/memory`)
          .then(r => r.json())
          .then(setCreatorMemory)
          .catch(() => {});
      }
    } catch (err) {
      console.error("Failed to process negotiation", err);
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
          memoryKey: newMemoryCategory === 'PRICING_HISTORY' ? 'Rate Preference' : newMemoryCategory === 'LOGISTICS_PREFERENCE' ? 'Logistics Note' : 'General Note',
          memoryValue: newMemoryNote.trim(),
          sourceDealId: currentDeal.id
        })
      });
      if (res.ok) {
        setNewMemoryNote('');
        setShowAddNote(false);
        fetch(`/api/creators/${encodeURIComponent(targetId)}/memory`)
          .then(r => r.json())
          .then(setCreatorMemory)
          .catch(() => {});
      }
    } catch(err) {
      console.error('Failed to record memory note:', err);
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
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '400', color: '#f4f4f4', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Email size={22} style={{ color: '#0f62fe' }} /> Outreach & Negotiations
          </h2>
          <p style={{ color: '#8d8d8d', fontSize: '0.875rem', margin: 0 }}>
            Manage creator communications, proposal threads, and commercial terms in one place.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#161616', border: '1px solid #393939', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
            <span style={{ color: '#8d8d8d' }}>Connected Account:</span>
            <span style={{ color: '#42be65', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckmarkFilled size={12} /> {senderEmail || 'tsrajanna1@gmail.com'}
            </span>
          </div>
          <Button 
            kind="secondary" 
            size="sm" 
            renderIcon={Renew} 
            disabled={syncingInbox} 
            onClick={handleSyncInboundReplies}
          >
            {syncingInbox ? 'Syncing...' : 'Sync Email Replies'}
          </Button>
          <Button kind="ghost" size="sm" renderIcon={Renew} onClick={fetchDeals}>
            Refresh
          </Button>
        </div>
      </div>

      {errorMsg && (
        <InlineNotification
          kind="error"
          title="Error"
          subtitle={errorMsg}
          onCloseButtonClick={() => setErrorMsg(null)}
        />
      )}

      {successMsg && (
        <InlineNotification
          kind="success"
          title="Updated"
          subtitle={successMsg}
          onCloseButtonClick={() => setSuccessMsg(null)}
        />
      )}

      {/* Main Split Grid */}
      <Grid style={{ padding: 0, margin: 0, gap: '1.25rem' }}>
        
        {/* LEFT COLUMN: Creator List */}
        <Column lg={5} md={3} sm={4}>
          <Tile style={{ background: '#161616', border: '1px solid #262626', padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ color: '#f4f4f4', fontWeight: '600', fontSize: '0.875rem' }}>Creators</span>
              <Tag type="blue" size="sm">{deals.length}</Tag>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <SearchInput
                size="sm"
                labelText="Search"
                placeholder="Filter creators..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background: '#262626' }}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '540px', paddingRight: '0.25rem' }}>
              {loadingDeals ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <Loading small withOverlay={false} />
                </div>
              ) : filteredDeals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#6e6e6e' }}>
                  <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>No active creator deals found.</p>
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
                        cursor: 'pointer',
                        background: isSelected ? '#262626' : '#1f1f1f',
                        borderLeft: isSelected ? '3px solid #0f62fe' : '3px solid transparent',
                        borderBottom: '1px solid #262626',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <img
                          src={d.creatorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.creatorName || 'Creator')}&background=0f62fe&color=ffffff`}
                          alt={d.creatorName}
                          style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h5 style={{ margin: 0, color: '#f4f4f4', fontSize: '0.875rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {d.creatorName || 'Creator'}
                          </h5>
                          <span style={{ fontSize: '0.75rem', color: '#8d8d8d', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {d.creatorEmail}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', fontSize: '0.75rem' }}>
                        <Tag type={getStatusColor(d.status)} size="sm">{d.status || 'INVITED'}</Tag>
                        <span style={{ color: '#42be65', fontWeight: '600', fontFamily: 'monospace' }}>₹{Number(price).toLocaleString('en-IN')}</span>
                      </div>

                      {lastMsg && (
                        <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.75rem', color: '#8d8d8d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lastMsg.sender === 'CREATOR' ? 'Creator: ' : 'Brand: '}{lastMsg.body}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Tile>
        </Column>

        {/* RIGHT COLUMN: Active Deal Workspace */}
        <Column lg={11} md={5} sm={4}>
          {currentDeal ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Header Details Tile */}
              <Tile style={{ background: '#262626', border: '1px solid #393939', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <img
                    src={currentDeal.creatorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentDeal.creatorName || 'Creator')}&background=0f62fe&color=ffffff`}
                    alt={currentDeal.creatorName}
                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <h3 style={{ margin: 0, color: '#f4f4f4', fontSize: '1.1rem', fontWeight: '600' }}>
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
                          style={{ width: '220px' }}
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
                                setSuccessMsg(`Email updated to ${editedEmail.trim()}`);
                                setTimeout(() => setSuccessMsg(null), 4000);
                              }
                            } catch(err) { console.error(err); }
                          }}
                        />
                        <Button size="sm" kind="ghost" hasIconOnly renderIcon={Reset} iconDescription="Cancel" onClick={() => setIsEditingEmail(false)} />
                      </div>
                    ) : (
                      <p style={{ margin: '0.15rem 0 0 0', color: '#a8a8a8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>{currentDeal.creatorEmail}</span>
                        <button 
                          onClick={() => { setEditedEmail(currentDeal.creatorEmail || ''); setIsEditingEmail(true); }}
                          title="Edit recipient email"
                          style={{ background: 'transparent', border: 'none', color: '#8d8d8d', cursor: 'pointer', padding: '0 2px', display: 'inline-flex', alignItems: 'center' }}
                        >
                          <Edit size={13} />
                        </button>
                        <span>• Deal #{currentDeal.id}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Agreed Fee</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#42be65', fontFamily: 'monospace' }}>
                      ₹{Number(currentDeal.currentAgreedPrice || currentDeal.offeredPrice || 25000).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <Tag type={getStatusColor(currentDeal.status)} size="md">
                    {currentDeal.status || 'INVITED'}
                  </Tag>
                </div>
              </Tile>

              {/* Creator Profile & Notes (Persistent Memory) */}
              <Tile style={{ background: '#262626', border: '1px solid #393939', padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Document size={16} style={{ color: '#0f62fe' }} />
                    <span style={{ fontWeight: '600', color: '#f4f4f4', fontSize: '0.875rem' }}>
                      Creator Profile & Context Notes
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#8d8d8d' }}>
                    <span>Thread History: <strong style={{ color: '#f4f4f4' }}>{currentDeal.emailThread?.length || 1} messages</strong></span>
                    <span>•</span>
                    <span>Quality Score: <strong style={{ color: '#42be65' }}>{creatorMemory?.stats?.averageComplianceScore || 95}%</strong></span>
                    <Button 
                      kind="ghost" 
                      size="sm" 
                      onClick={() => setShowAddNote(!showAddNote)}
                      style={{ padding: '0 0.5rem', minHeight: '24px', fontSize: '0.75rem' }}
                    >
                      {showAddNote ? 'Cancel' : '＋ Add Note'}
                    </Button>
                  </div>
                </div>

                {/* Add Note Form */}
                {showAddNote && (
                  <form onSubmit={handleAddCustomMemoryNote} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <TextInput
                      id="custom-memory-note"
                      size="sm"
                      labelText=""
                      placeholder="Add strategic preference or delivery requirement..."
                      value={newMemoryNote}
                      onChange={e => setNewMemoryNote(e.target.value)}
                      style={{ flex: 1, minWidth: '240px' }}
                    />
                    <Button type="submit" size="sm" kind="primary" disabled={!newMemoryNote.trim()}>
                      Save Note
                    </Button>
                  </form>
                )}

                {/* Structured Notes Pills */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {(creatorMemory?.memories && creatorMemory.memories.length > 0 ? creatorMemory.memories : []).map(m => (
                    <div 
                      key={m.id || m.memory_key}
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.3rem 0.6rem', 
                        background: '#1f1f1f', 
                        border: '1px solid #393939', 
                        color: '#f4f4f4',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <span style={{ color: '#8d8d8d' }}>{m.memory_key}:</span>
                      <span>{m.memory_value}</span>
                    </div>
                  ))}
                </div>
              </Tile>

              {/* Message Timeline */}
              <Tile style={{ background: '#161616', border: '1px solid #262626', padding: '1.25rem', minHeight: '380px', maxHeight: '460px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                          background: isBrand ? '#262626' : '#1f2420',
                          border: isBrand ? '1px solid #393939' : '1px solid #24a148',
                          borderLeft: isBrand ? '3px solid #0f62fe' : undefined,
                          borderRight: !isBrand ? '3px solid #24a148' : undefined,
                          padding: '1rem'
                        }}
                      >
                        {/* Header Bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.75rem', gap: '1rem' }}>
                          <span style={{ fontWeight: '600', color: isBrand ? '#78a9ff' : '#42be65', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {isBrand ? <Bot size={14} /> : <User size={14} />} 
                            {isBrand ? 'Brand Partnerships' : currentDeal.creatorName}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Tag type={isBrand ? 'blue' : 'green'} size="sm">
                              {isBrand ? 'Sent' : 'Received'}
                            </Tag>
                            <span style={{ color: '#8d8d8d' }}>{msg.timestamp || 'Just now'}</span>
                          </div>
                        </div>

                        {/* Message Content */}
                        <p style={{ margin: 0, color: '#f4f4f4', fontSize: '0.875rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                          {isLatest && isBrand && loading ? (
                            <TypewriterText text={msg.body} speed={6} />
                          ) : (
                            msg.body
                          )}
                        </p>

                        {/* Financial Terms Summary */}
                        {isBrand && (
                          <div style={{ marginTop: '0.75rem', background: '#161616', border: '1px solid #333333', padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem' }}>
                            <span style={{ color: '#8d8d8d' }}>
                              Proposed Fee: <strong style={{ color: '#42be65', fontFamily: 'monospace' }}>₹{Number(currentDeal.currentAgreedPrice || currentDeal.offeredPrice || 25000).toLocaleString('en-IN')}</strong>
                            </span>
                            <span style={{ color: '#8d8d8d' }}>
                              Net (10% TDS): <strong style={{ color: '#f4f4f4', fontFamily: 'monospace' }}>₹{Math.round(Number(currentDeal.currentAgreedPrice || currentDeal.offeredPrice || 25000) * 0.9).toLocaleString('en-IN')}</strong>
                            </span>
                            <span style={{ color: '#8d8d8d' }}>
                              Promo: <code style={{ color: '#78a9ff' }}>SAVER20</code>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Loading State */}
                {loading && (
                  <div 
                    style={{
                      maxWidth: '85%',
                      alignSelf: 'flex-start',
                      background: '#262626',
                      border: '1px solid #393939',
                      borderLeft: '3px solid #0f62fe',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <Loading small withOverlay={false} />
                    <div>
                      <div style={{ color: '#78a9ff', fontWeight: '600', fontSize: '0.8rem' }}>
                        Formulating response...
                      </div>
                      <div style={{ color: '#8d8d8d', fontSize: '0.75rem' }}>
                        {thinkingSteps[thinkingStep]}
                      </div>
                    </div>
                  </div>
                )}
              </Tile>

              {/* Composer Dock */}
              <Tile style={{ background: '#262626', border: '1px solid #393939', padding: '1rem 1.25rem' }}>
                
                {/* Presets */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>
                    Quick Response Templates:
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {QUICK_RESPONSE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        disabled={loading}
                        onClick={() => {
                          setCreatorReplyInput(preset.text);
                          handleSendCreatorReply(preset.text);
                        }}
                        style={{
                          background: '#161616',
                          border: '1px solid #393939',
                          color: '#c6c6c6',
                          padding: '0.3rem 0.65rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#0f62fe'; e.currentTarget.style.color = '#f4f4f4'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#393939'; e.currentTarget.style.color = '#c6c6c6'; }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Textarea */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <TextArea
                    id="creator-reply-input"
                    labelText="Reply or Inbound Message"
                    placeholder="Enter message text or simulate a creator response..."
                    value={creatorReplyInput}
                    onChange={e => setCreatorReplyInput(e.target.value)}
                    rows={2}
                    disabled={loading}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#8d8d8d' }}>Price Adjustment:</span>
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
                      {loading ? 'Processing...' : 'Send Reply'}
                    </Button>
                  </div>
                </div>
              </Tile>

            </div>
          ) : (
            <Tile style={{ background: '#161616', border: '1px solid #262626', padding: '3rem', textAlign: 'center' }}>
              <Email size={36} style={{ color: '#0f62fe', marginBottom: '0.75rem' }} />
              <h3 style={{ color: '#f4f4f4', marginBottom: '0.25rem', fontSize: '1.1rem' }}>No Creator Selected</h3>
              <p style={{ color: '#8d8d8d', maxWidth: '380px', margin: '0 auto', fontSize: '0.85rem' }}>
                Select a creator from the left list to view conversation history and manage deal terms.
              </p>
            </Tile>
          )}
        </Column>

      </Grid>
    </div>
  );
}
