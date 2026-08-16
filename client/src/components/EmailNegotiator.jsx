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
  Search as SearchInput,
  Modal,
  InlineLoading
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
  Document,
  View,
  Laptop,
  Mobile,
  ArrowRight
} from '@carbon/icons-react';

// Brand Design Theme Resolver for In-App UI
const BRAND_PALETTES = {
  'boat lifestyle': {
    name: 'boAt Lifestyle',
    primary: '#0f62fe',
    secondary: '#ff003b',
    badge: 'VERIFIED PROPOSAL • boAt NIRVANA',
    tagline: 'Plug Into Nirvana • Audio & Wearables',
    heroGradient: 'linear-gradient(180deg, #1c2b4a 0%, #161c28 100%)',
    cardBg: '#1a2233',
    cardBorder: '#28385e',
    btnBg: '#0f62fe',
    initials: 'boAt'
  },
  'boat': {
    name: 'boAt Lifestyle',
    primary: '#0f62fe',
    secondary: '#ff003b',
    badge: 'VERIFIED PROPOSAL • boAt NIRVANA',
    tagline: 'Plug Into Nirvana • Audio & Wearables',
    heroGradient: 'linear-gradient(180deg, #1c2b4a 0%, #161c28 100%)',
    cardBg: '#1a2233',
    cardBorder: '#28385e',
    btnBg: '#0f62fe',
    initials: 'boAt'
  },
  'mamaearth': {
    name: 'Mamaearth',
    primary: '#24a148',
    secondary: '#00bfa5',
    badge: 'PLANT A TREE • PLASTIC POSITIVE',
    tagline: 'Goodness Inside • 100% Toxin-Free & Natural',
    heroGradient: 'linear-gradient(180deg, #163321 0%, #112117 100%)',
    cardBg: '#172e1f',
    cardBorder: '#255234',
    btnBg: '#24a148',
    initials: 'ME'
  },
  'cult.fit': {
    name: 'Cult.fit',
    primary: '#ff3278',
    secondary: '#ff0055',
    badge: 'CULTPASS ELITE • ATHLETIC ROSTER',
    tagline: 'We Are Cult • Be Better Everyday',
    heroGradient: 'linear-gradient(180deg, #3d1424 0%, #210d15 100%)',
    cardBg: '#2b101c',
    cardBorder: '#5e1b38',
    btnBg: '#ff3278',
    initials: 'CULT'
  },
  'the daily upside': {
    name: 'The Daily Upside',
    primary: '#f1c21b',
    secondary: '#1b365d',
    badge: 'WALL STREET AUDITED • EDITORIAL PARTNER',
    tagline: 'Financial Intelligence • Wall Street Media',
    heroGradient: 'linear-gradient(180deg, #2b281b 0%, #171c24 100%)',
    cardBg: '#1b222c',
    cardBorder: '#384457',
    btnBg: '#f1c21b',
    initials: 'TDU'
  },
  'noise': {
    name: 'Noise',
    primary: '#8a3ffc',
    secondary: '#00cec9',
    badge: 'NOISE TECH PARTNERSHIP • OFFICIAL',
    tagline: 'Listen to the Noise Within • Smart Wearables',
    heroGradient: 'linear-gradient(180deg, #2d1b4a 0%, #191426 100%)',
    cardBg: '#201930',
    cardBorder: '#45326b',
    btnBg: '#8a3ffc',
    initials: 'NOISE'
  },
  'zepto': {
    name: 'Zepto',
    primary: '#8c14fc',
    secondary: '#ff7043',
    badge: 'EXPRESS Q-COMMERCE PARTNERSHIP',
    tagline: '10-Minute Grocery Delivery Superfast',
    heroGradient: 'linear-gradient(180deg, #32164f 0%, #1f122e 100%)',
    cardBg: '#241438',
    cardBorder: '#532a85',
    btnBg: '#8c14fc',
    initials: 'ZEPTO'
  }
};

function getClientBrandTheme(brandName) {
  if (!brandName) return BRAND_PALETTES['boat lifestyle'];
  const key = brandName.toLowerCase().trim();
  if (BRAND_PALETTES[key]) return BRAND_PALETTES[key];
  for (const [k, v] of Object.entries(BRAND_PALETTES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return {
    name: brandName,
    primary: '#0f62fe',
    secondary: '#0043ce',
    badge: 'VERIFIED PROPOSAL • ESCROW PROTECTED',
    tagline: `Official Creator Collaboration • ${brandName}`,
    heroGradient: 'linear-gradient(180deg, #1c2b4a 0%, #161c28 100%)',
    cardBg: '#1f1f1f',
    cardBorder: '#393939',
    btnBg: '#0f62fe',
    initials: brandName.substring(0, 3).toUpperCase()
  };
}

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
  
  const [creatorMemory, setCreatorMemory] = useState(null);
  const [loadingMemory, setLoadingMemory] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newMemoryNote, setNewMemoryNote] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState('PRICING_HISTORY');

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewViewport, setPreviewViewport] = useState('desktop');

  const thinkingSteps = [
    'Evaluating creator response and commercial parameters...',
    'Reviewing budget limits and TDS tax requirements...',
    'Formulating negotiation terms with conversation context...',
    'Updating deal terms and recording creator preferences...'
  ];

  useEffect(() => {
    fetch('/api/integrations/gmail/status')
      .then(r => r.json())
      .then(d => { if (d.email) setSenderEmail(d.email); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeDeal?.id) {
      setSelectedDealId(activeDeal.id);
    }
  }, [activeDeal?.id]);

  const fetchDeals = useCallback(async () => {
    try {
      const url = campaignId ? `/api/deals?campaignId=${campaignId}` : '/api/deals';
      const res = await fetch(url);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.deals || [];
      setDeals(list);
      setSelectedDealId(prev => {
        if (prev && list.some(d => d.id === prev)) return prev;
        return activeDeal?.id || (list.length > 0 ? list[0].id : null);
      });
    } catch (err) {
      console.error('Failed to load deals', err);
    } finally {
      setLoadingDeals(false);
    }
  }, [campaignId, activeDeal?.id]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const currentDeal = deals.find(d => d.id === selectedDealId) || (deals.length > 0 ? deals[0] : null);
  const activeBrandName = currentDeal?.brandName || currentDeal?.brand_name || 'boAt Lifestyle';
  const brandTheme = getClientBrandTheme(activeBrandName);

  useEffect(() => {
    if (currentDeal?.creatorId) {
      setLoadingMemory(true);
      fetch(`/api/creators/${currentDeal.creatorId}/memory`)
        .then(r => r.json())
        .then(d => setCreatorMemory(d))
        .catch(() => setCreatorMemory(null))
        .finally(() => setLoadingMemory(false));
    } else {
      setCreatorMemory(null);
    }
  }, [currentDeal?.creatorId]);

  const handleOpenBrandEmailPreview = async () => {
    if (!currentDeal) return;
    setIsPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const lastMessage = (currentDeal.emailThread && currentDeal.emailThread.length > 0)
        ? currentDeal.emailThread[currentDeal.emailThread.length - 1].body
        : 'We are extending a commercial proposal for our campaign.';

      const res = await fetch('/api/email/preview-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: activeBrandName,
          productName: currentDeal.productName || 'Creator Campaign Deliverable',
          offeredPrice: currentDeal.currentAgreedPrice || currentDeal.offeredPrice || 25000,
          mandatoryPhrase: currentDeal.mandatoryPhrases || 'Use exclusive creator discount code',
          promoCode: currentDeal.promoCode || 'PROMO20',
          recipientName: currentDeal.creatorName || 'Creator',
          bodyText: lastMessage,
          dealId: currentDeal.id
        })
      });

      const data = await res.json();
      if (data.html) {
        setPreviewHtml(data.html);
      }
    } catch (err) {
      console.error('Failed to load email preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendCreatorReply = async (presetText = null) => {
    const textToSend = presetText || creatorReplyInput;
    if (!textToSend.trim() || !currentDeal) return;

    setLoading(true);
    setErrorMsg(null);
    setThinkingStep(0);

    const stepInterval = setInterval(() => {
      setThinkingStep(prev => (prev + 1) % thinkingSteps.length);
    }, 1200);

    try {
      const res = await fetch(`/api/deals/${currentDeal.id}/negotiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorMessage: textToSend.trim(),
          manualPriceOverride: manualPriceOverride ? parseInt(manualPriceOverride, 10) : null
        })
      });

      clearInterval(stepInterval);
      const data = await res.json();

      if (res.ok) {
        setCreatorReplyInput('');
        setManualPriceOverride('');
        await fetchDeals();
        if (onDealUpdated) onDealUpdated();
        setSuccessMsg(`Negotiation response sent for ${currentDeal.creatorName}. Rate updated.`);
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(data.error || 'Failed to process negotiation response');
      }
    } catch (err) {
      clearInterval(stepInterval);
      setErrorMsg('Network error while dispatching negotiation');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomMemoryNote = async (e) => {
    e.preventDefault();
    if (!newMemoryNote.trim() || !currentDeal?.creatorId) return;

    try {
      const res = await fetch(`/api/creators/${currentDeal.creatorId}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newMemoryCategory,
          key: 'ADMIN_PREFERENCE',
          value: newMemoryNote.trim(),
          sourceDealId: currentDeal.id
        })
      });

      if (res.ok) {
        setNewMemoryNote('');
        setShowAddNote(false);
        const memRes = await fetch(`/api/creators/${currentDeal.creatorId}/memory`);
        const memData = await memRes.json();
        setCreatorMemory(memData);
        setSuccessMsg('Creator preference recorded in persistent memory');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AGREED':
      case 'QA_PASSED':
      case 'PAID':
        return 'green';
      case 'NEGOTIATING':
      case 'COUNTER_OFFER':
        return 'purple';
      case 'INVITED':
        return 'blue';
      case 'ESCALATED':
      case 'NEEDS_REVISION':
        return 'magenta';
      default:
        return 'gray';
    }
  };

  const filteredDeals = deals.filter(d => 
    (d.creatorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.creatorEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.brandName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ color: '#fff', width: '100%' }}>
      
      {/* Notifications */}
      {errorMsg && (
        <InlineNotification
          kind="error"
          title="Negotiation Error"
          subtitle={errorMsg}
          onCloseButtonClick={() => setErrorMsg(null)}
          style={{ marginBottom: '1rem' }}
        />
      )}
      {successMsg && (
        <InlineNotification
          kind="success"
          title="Status Updated"
          subtitle={successMsg}
          onCloseButtonClick={() => setSuccessMsg(null)}
          style={{ marginBottom: '1rem' }}
        />
      )}

      {/* ─── LIVE BRANDED EMAIL CARD PREVIEW MODAL ───────────────────────── */}
      <Modal
        open={isPreviewOpen}
        onRequestClose={() => setIsPreviewOpen(false)}
        modalHeading={`${activeBrandName} — Branded Email Preview`}
        primaryButtonText="Close Preview"
        onRequestSubmit={() => setIsPreviewOpen(false)}
        size="lg"
      >
        <div style={{ padding: '0.5rem 0' }}>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            background: 'var(--color-surface)', 
            padding: '0.6rem 1rem', 
            borderRadius: 6, 
            marginBottom: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.08)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ 
                display: 'inline-block', 
                width: 10, 
                height: 10, 
                borderRadius: '50%', 
                background: brandTheme.primary,
                boxShadow: `0 0 8px ${brandTheme.primary}` 
              }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                {brandTheme.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#8d8d8d' }}>
                ({brandTheme.tagline})
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <Button
                kind={previewViewport === 'desktop' ? 'primary' : 'ghost'}
                size="sm"
                renderIcon={Laptop}
                onClick={() => setPreviewViewport('desktop')}
                style={{ height: '1.75rem', fontSize: '0.75rem' }}
              >
                Desktop (600px)
              </Button>

              <Button
                kind={previewViewport === 'mobile' ? 'primary' : 'ghost'}
                size="sm"
                renderIcon={Mobile}
                onClick={() => setPreviewViewport('mobile')}
                style={{ height: '1.75rem', fontSize: '0.75rem' }}
              >
                Mobile (380px)
              </Button>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            background: '#0d0d0d',
            padding: '1.5rem',
            borderRadius: 6,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            minHeight: '480px',
            maxHeight: '620px',
            overflowY: 'auto'
          }}>
            {previewLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#8d8d8d', gap: '0.75rem' }}>
                <Loading small withOverlay={false} />
                <span>Compiling responsive brand email card...</span>
              </div>
            ) : (
              <div style={{ 
                width: previewViewport === 'mobile' ? '380px' : '100%', 
                maxWidth: '600px',
                transition: 'width 0.2s ease' 
              }}>
                <iframe
                  title="Branded Email Preview"
                  srcDoc={previewHtml}
                  style={{
                    width: '100%',
                    minHeight: '520px',
                    height: '560px',
                    border: 'none',
                    borderRadius: 4,
                    background: '#121212'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ─── Main Two-Column Negotiation Studio ──────────────────────────── */}
      <Grid fullWidth style={{ padding: 0, rowGap: '1.25rem', columnGap: '1.25rem' }}>
        
        {/* LEFT COLUMN: Deal Queue Roster */}
        <Column lg={5} md={3} sm={4}>
          <Tile 
            style={{ 
              background: 'var(--color-surface)', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: 6,
              padding: '1.25rem', 
              height: 'calc(100vh - 11rem)', 
              display: 'flex', 
              flexDirection: 'column' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Email size={18} style={{ color: '#0f62fe' }} />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#f4f4f4' }}>
                  Commercial Negotiations ({deals.length})
                </h3>
              </div>
              <Button 
                kind="ghost" 
                size="sm" 
                hasIconOnly 
                renderIcon={Renew} 
                iconDescription="Refresh Deals"
                onClick={fetchDeals}
                style={{ height: '1.75rem', width: '1.75rem' }}
              />
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <SearchInput
                id="search-deals"
                size="sm"
                placeholder="Filter by creator or brand..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {loadingDeals ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#8d8d8d' }}>
                  <Loading small withOverlay={false} />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Loading creator threads...</p>
                </div>
              ) : filteredDeals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#8d8d8d', fontSize: '0.85rem' }}>
                  No deals found.
                </div>
              ) : (
                filteredDeals.map(d => {
                  const isSelected = d.id === selectedDealId;
                  const itemTheme = getClientBrandTheme(d.brandName || d.brand_name || 'boAt Lifestyle');
                  
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDealId(d.id)}
                      style={{
                        padding: '0.75rem 0.85rem',
                        borderRadius: '4px',
                        background: isSelected ? 'rgba(15, 98, 254, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        border: isSelected ? '1px solid #0f62fe' : '1px solid rgba(255, 255, 255, 0.05)',
                        borderLeft: isSelected ? '3px solid #0f62fe' : '3px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: isSelected ? 600 : 400, color: isSelected ? '#ffffff' : '#c6c6c6', fontSize: '0.85rem' }}>
                          {d.creatorName || 'Creator'}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#42be65', fontFamily: 'monospace' }}>
                          ₹{Number(d.currentAgreedPrice || d.offeredPrice || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                        <span style={{ color: '#8d8d8d', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: itemTheme.primary }} />
                          {d.brandName || d.brand_name || 'Brand'}
                        </span>
                        <Tag type={getStatusColor(d.status)} size="sm" style={{ padding: '0 0.35rem', height: '1.1rem', fontSize: '0.65rem' }}>
                          {d.status || 'INVITED'}
                        </Tag>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Tile>
        </Column>

        {/* RIGHT COLUMN: Active Negotiation Workspace */}
        <Column lg={11} md={5} sm={4}>
          {currentDeal ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Header Details Tile */}
              <Tile 
                style={{ 
                  background: 'var(--color-surface)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                  borderTop: `3px solid ${brandTheme.primary}`,
                  borderRadius: 6,
                  padding: '1rem 1.25rem', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: '1rem' 
                }}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <img
                    src={currentDeal.creatorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentDeal.creatorName || 'Creator')}&background=0f62fe&color=ffffff&size=128`}
                    alt={currentDeal.creatorName}
                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ margin: 0, color: '#f4f4f4', fontSize: '1.05rem', fontWeight: 600 }}>
                        {currentDeal.creatorName}
                      </h3>
                      <Tag type="blue" size="sm">
                        {brandTheme.name}
                      </Tag>
                    </div>
                    
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Button
                    kind="secondary"
                    size="sm"
                    renderIcon={View}
                    onClick={handleOpenBrandEmailPreview}
                    style={{ height: '2rem', fontSize: '0.75rem' }}
                  >
                    Preview Brand Email
                  </Button>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Agreed Fee</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#42be65', fontFamily: 'monospace' }}>
                      ₹{Number(currentDeal.currentAgreedPrice || currentDeal.offeredPrice || 0).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <Tag type={getStatusColor(currentDeal.status)} size="md">
                    {currentDeal.status || 'INVITED'}
                  </Tag>
                </div>
              </Tile>

              {/* Creator Context & Memory */}
              <Tile style={{ background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '0.85rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Document size={15} style={{ color: '#0f62fe' }} />
                    <span style={{ fontWeight: 600, color: '#f4f4f4', fontSize: '0.8rem' }}>
                      Context & Relationship Memory
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#8d8d8d' }}>
                    <span>Thread: <strong style={{ color: '#f4f4f4' }}>{currentDeal.emailThread?.length || 1} msgs</strong></span>
                    <span>•</span>
                    <span>Quality: <strong style={{ color: '#42be65' }}>{creatorMemory?.stats?.averageComplianceScore || 95}%</strong></span>
                    <Button 
                      kind="ghost" 
                      size="sm" 
                      onClick={() => setShowAddNote(!showAddNote)}
                      style={{ padding: '0 0.5rem', height: '1.5rem', fontSize: '0.75rem' }}
                    >
                      {showAddNote ? 'Cancel' : '＋ Add Note'}
                    </Button>
                  </div>
                </div>

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

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {(creatorMemory?.memories && creatorMemory.memories.length > 0 ? creatorMemory.memories : []).map(m => (
                    <div 
                      key={m.id || m.memory_key}
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.25rem 0.55rem', 
                        background: '#111111', 
                        border: '1px solid rgba(255, 255, 255, 0.08)', 
                        color: '#f4f4f4',
                        borderRadius: 3,
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
              <Tile 
                style={{ 
                  background: 'var(--color-surface)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                  borderRadius: 6,
                  padding: '1.25rem', 
                  minHeight: '380px', 
                  maxHeight: '460px', 
                  overflowY: 'auto', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1rem' 
                }}
              >
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
                          background: isBrand ? brandTheme.cardBg : '#17231c',
                          border: isBrand ? `1px solid ${brandTheme.cardBorder}` : '1px solid rgba(66, 190, 101, 0.3)',
                          borderLeft: isBrand ? `3px solid ${brandTheme.primary}` : undefined,
                          borderRight: !isBrand ? '3px solid #42be65' : undefined,
                          padding: '1rem',
                          borderRadius: 4,
                          boxShadow: isBrand ? `0 4px 16px rgba(0,0,0,0.25)` : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.75rem', gap: '1rem' }}>
                          <span style={{ fontWeight: 600, color: isBrand ? brandTheme.primary : '#42be65', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {isBrand ? <Bot size={14} /> : <User size={14} />} 
                            {isBrand ? `${brandTheme.name} Partnerships` : currentDeal.creatorName}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Tag type={isBrand ? 'blue' : 'green'} size="sm">
                              {isBrand ? 'Sent Proposal' : 'Received'}
                            </Tag>
                            <span style={{ color: '#8d8d8d' }}>{msg.timestamp || 'Just now'}</span>
                          </div>
                        </div>

                        <p style={{ margin: 0, color: '#f4f4f4', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {isLatest && isBrand && loading ? (
                            <TypewriterText text={msg.body} speed={6} />
                          ) : (
                            msg.body
                          )}
                        </p>

                        {isBrand && (() => {
                          const fee = Number(msg.offeredPrice || currentDeal.currentAgreedPrice || currentDeal.offeredPrice || 0);
                          const tdsNet = Math.round(fee * 0.9);
                          const promo = currentDeal.promoCode || null;
                          const phrase = currentDeal.mandatoryPhrases || null;
                          return (
                            <div style={{ 
                              marginTop: '0.75rem', 
                              background: '#0d0d0d', 
                              border: `1px solid rgba(255, 255, 255, 0.06)`, 
                              padding: '0.6rem 0.85rem', 
                              display: 'flex', 
                              flexWrap: 'wrap', 
                              gap: '0.85rem', 
                              fontSize: '0.75rem', 
                              borderRadius: 4
                            }}>
                              {fee > 0 && (
                                <span style={{ color: '#8d8d8d' }}>
                                  Gross Fee: <strong style={{ color: '#42be65', fontFamily: 'monospace' }}>₹{fee.toLocaleString('en-IN')}</strong>
                                </span>
                              )}
                              {fee > 0 && (
                                <span style={{ color: '#8d8d8d' }}>
                                  Net Escrow (10% TDS): <strong style={{ color: '#f4f4f4', fontFamily: 'monospace' }}>₹{tdsNet.toLocaleString('en-IN')}</strong>
                                </span>
                              )}
                              {promo && (
                                <span style={{ color: '#8d8d8d' }}>
                                  Promo: <code style={{ color: brandTheme.primary }}>{promo}</code>
                                </span>
                              )}
                              {phrase && (
                                <span style={{ color: '#8d8d8d' }}>
                                  Keyphrase: <em style={{ color: '#c6c6c6' }}>"{phrase}"</em>
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })
                )}

                {loading && (
                  <div 
                    style={{
                      maxWidth: '85%',
                      alignSelf: 'flex-start',
                      background: brandTheme.cardBg,
                      border: `1px solid ${brandTheme.cardBorder}`,
                      borderLeft: `3px solid ${brandTheme.primary}`,
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      borderRadius: 4
                    }}
                  >
                    <Loading small withOverlay={false} />
                    <div>
                      <div style={{ color: brandTheme.primary, fontWeight: 600, fontSize: '0.8rem' }}>
                        Formulating {brandTheme.name} response...
                      </div>
                      <div style={{ color: '#8d8d8d', fontSize: '0.75rem' }}>
                        {thinkingSteps[thinkingStep]}
                      </div>
                    </div>
                  </div>
                )}
              </Tile>

              {/* Composer Dock */}
              <Tile style={{ background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '1rem 1.25rem' }}>
                
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
                          background: '#111111',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 4,
                          color: '#c6c6c6',
                          padding: '0.3rem 0.65rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = brandTheme.primary; e.currentTarget.style.color = '#f4f4f4'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#c6c6c6'; }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

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
                      style={{ background: brandTheme.primary }}
                    >
                      {loading ? 'Processing...' : 'Send Reply'}
                    </Button>
                  </div>
                </div>
              </Tile>

            </div>
          ) : (
            <Tile style={{ background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '3.5rem 2rem', textAlign: 'center' }}>
              <Email size={36} style={{ color: '#0f62fe', marginBottom: '0.75rem' }} />
              <h3 style={{ color: '#f4f4f4', marginBottom: '0.25rem', fontSize: '1.1rem', fontWeight: 600 }}>No Active Negotiation Selected</h3>
              <p style={{ color: '#8d8d8d', maxWidth: '420px', margin: '0 auto', fontSize: '0.85rem' }}>
                Select a commercial thread from the queue to inspect communication history, negotiate deliverables, and approve rate terms.
              </p>
            </Tile>
          )}
        </Column>

      </Grid>
    </div>
  );
}
