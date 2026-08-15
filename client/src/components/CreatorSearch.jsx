import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search as SearchInput, Select, SelectItem, Button, Tag, Loading,
  SkeletonPlaceholder, Pagination, Modal, NumberInput, InlineNotification, Tile, Grid, Column, InlineLoading
} from '@carbon/react';
import { 
  Search, CheckmarkOutline, WarningAlt, Send, Currency, UserFollow, Launch, ChevronLeft, ChevronRight, Email, CheckmarkFilled, ArrowRight
} from '@carbon/icons-react';
import CreatorProfileModal from './CreatorProfileModal';

const NICHES = ['All', 'Finance & Investing', 'Tech & Gadgets', 'Gaming & Esports', 'Business & Startups', 'Fashion & Lifestyle', 'Beauty & Skincare', 'Fitness & Health', 'Food & Cooking', 'Travel & Vlogging', 'Education & Motivation', 'Meme & Pop Culture', 'Regional Entertainment', 'Music & Arts', 'Sustainability & Environment', 'Photography & Cinematography', 'Parenting & Family'];
const PLATFORMS = ['All', 'Instagram', 'YouTube'];
const SORTS = [
  { id: 'followers', label: 'Followers (High to Low)' },
  { id: 'authenticity', label: 'Authenticity (High to Low)' },
  { id: 'price', label: 'Price (Low to High)' },
  { id: 'rating', label: 'Rating (High to Low)' }
];
const LIMITS = [50, 100, 250, 500];

function formatCount(val) {
  if (!val) return '0';
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return val.toString();
}

const fmtCurrency = (n) => n ? `Rs.${Number(n).toLocaleString('en-IN')}` : '—';

export default function CreatorSearch({ onSelectCreator, onViewDeal, activeCampaign }) {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [niche, setNiche] = useState('All');
  const [platform, setPlatform] = useState('All');
  const [sortBy, setSortBy] = useState('followers');
  
  // Pagination & Limits
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [latency, setLatency] = useState(0);
  
  const [selectedCreatorId, setSelectedCreatorId] = useState(null);

  // Outreach Proposal Modal State
  const [outreachCreator, setOutreachCreator] = useState(null);
  const [campaignsList, setCampaignsList] = useState([]);
  const [targetCampaignId, setTargetCampaignId] = useState('');
  const [offeredFee, setOfferedFee] = useState(25000);
  const [sendingOutreach, setSendingOutreach] = useState(false);
  const [outreachResult, setOutreachResult] = useState(null);
  const [senderEmail, setSenderEmail] = useState('');
  const [globalNotification, setGlobalNotification] = useState(null);

  useEffect(() => {
    fetchCampaignsList();
    fetchSenderStatus();
  }, []);

  const fetchSenderStatus = async () => {
    try {
      const res = await fetch('/api/integrations/gmail/status');
      if (res.ok) {
        const data = await res.json();
        if (data.email) setSenderEmail(data.email);
      }
    } catch (e) {}
  };

  const fetchCampaignsList = async () => {
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.campaigns || [];
        setCampaignsList(list);
        if (list.length > 0) setTargetCampaignId(list[0].id);
      }
    } catch (e) { console.error("Failed to load campaigns", e); }
  };

  const handleOpenOutreachModal = (c) => {
    setOutreachCreator(c);
    setOfferedFee(c.price_per_post || 25000);
    setTargetCampaignId(activeCampaign?.id || campaignsList[0]?.id || 'camp_01');
    setOutreachResult(null);
  };

  const handleSendOutreachSubmit = async () => {
    if (!outreachCreator) return;
    setSendingOutreach(true);
    setOutreachResult(null);
    try {
      const res = await fetch('/api/deals/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: outreachCreator.id,
          campaignId: targetCampaignId || 'camp_01',
          offeredPrice: offeredFee,
          creatorName: outreachCreator.name,
          creatorEmail: outreachCreator.email,
          creatorAvatar: outreachCreator.avatar,
          platform: outreachCreator.platform
        })
      });
      if (res.ok) {
        const deal = await res.json();
        setOutreachResult({ 
          success: true, 
          deal, 
          creatorName: outreachCreator.name,
          creatorEmail: outreachCreator.email,
          fee: offeredFee,
          campaignId: targetCampaignId || 'camp_01'
        });
        setGlobalNotification({
          kind: 'success',
          title: 'Proposal Email Dispatched!',
          subtitle: `Proposal successfully sent to ${outreachCreator.name} (${outreachCreator.email}) for ₹${Number(offeredFee).toLocaleString('en-IN')}.`
        });
      } else {
        const errData = await res.json();
        setOutreachResult({ success: false, error: errData.error || 'Failed to dispatch email' });
      }
    } catch (err) {
      setOutreachResult({ success: false, error: err.message });
    } finally {
      setSendingOutreach(false);
    }
  };

  const handleViewDeal = (deal, campaignId) => {
    setOutreachCreator(null);
    setOutreachResult(null);
    if (onViewDeal) {
      onViewDeal(deal, campaignId);
    } else if (onSelectCreator) {
      onSelectCreator(deal);
    }
  };

  // Debounce ref
  const debounceTimer = useRef(null);

  const fetchCreators = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        fts_query: query,
        niche: niche,
        platform: platform,
        sortBy: sortBy,
        sortOrder: sortBy === 'price' ? 'asc' : 'desc',
        page: page.toString(),
        limit: limit.toString()
      });
      const res = await fetch(`/api/creators/search?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCreators(data.creators || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setLatency(data.latencyMs || 0);
      }
    } catch (e) {
      console.error('FTS search failed', e);
    } finally {
      setLoading(false);
    }
  }, [query, niche, platform, sortBy, page, limit]);

  // Execute search on mount and when filters change (with debounce for text input)
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchCreators();
    }, 300);
    return () => clearTimeout(debounceTimer.current);
  }, [fetchCreators]);

  // Reset page to 1 on filter changes
  const handleQueryChange = (val) => { setQuery(val); setPage(1); };
  const handleNicheChange = (val) => { setNiche(val); setPage(1); };
  const handlePlatformChange = (val) => { setPlatform(val); setPage(1); };
  const handleSortChange = (val) => { setSortBy(val); setPage(1); };
  const handleLimitChange = (val) => { setLimit(Number(val)); setPage(1); };

  const handleSelect = (c) => {
    if (onSelectCreator) onSelectCreator(c);
  };

  const handleOpenProfile = (id) => {
    setSelectedCreatorId(id);
  };

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search Header */}
      <div style={{ background: '#161616', borderBottom: '1px solid #393939', padding: '1.5rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '2', minWidth: '280px' }}>
            <SearchInput
              id="fts-search"
              labelText="Global Creator Search"
              placeholder="Search by name, handle (@yashwanth_tech), bio, email..."
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              onClear={() => handleQueryChange('')}
              size="lg"
              style={{ background: '#262626' }}
            />
          </div>
          <div style={{ flex: '1', minWidth: '140px' }}>
            <Select id="niche-select" labelText="Niche" value={niche} onChange={e => handleNicheChange(e.target.value)} style={{ background: '#262626' }}>
              {NICHES.map(n => <SelectItem key={n} value={n} text={n} />)}
            </Select>
          </div>
          <div style={{ flex: '1', minWidth: '120px' }}>
            <Select id="platform-select" labelText="Platform" value={platform} onChange={e => handlePlatformChange(e.target.value)} style={{ background: '#262626' }}>
              {PLATFORMS.map(p => <SelectItem key={p} value={p} text={p} />)}
            </Select>
          </div>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <Select id="sort-select" labelText="Sort By" value={sortBy} onChange={e => handleSortChange(e.target.value)} style={{ background: '#262626' }}>
              {SORTS.map(s => <SelectItem key={s.id} value={s.id} text={s.label} />)}
            </Select>
          </div>
          <div style={{ flex: '0.8', minWidth: '110px' }}>
            <Select id="limit-select" labelText="Per Page" value={limit} onChange={e => handleLimitChange(e.target.value)} style={{ background: '#262626' }}>
              {LIMITS.map(l => <SelectItem key={l} value={l} text={`${l} / page`} />)}
            </Select>
          </div>
        </div>
        
        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#8d8d8d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            Showing {total > 0 ? `${startRecord}–${endRecord}` : 0} of <strong>{total.toLocaleString()}</strong> matched creators
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>FTS Query: {latency}ms</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Button 
                kind="ghost" 
                size="sm" 
                hasIconOnly 
                renderIcon={ChevronLeft} 
                iconDescription="Previous Page"
                disabled={page <= 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              />
              <span style={{ color: '#f4f4f4', fontWeight: '600' }}>Page {page} of {totalPages}</span>
              <Button 
                kind="ghost" 
                size="sm" 
                hasIconOnly 
                renderIcon={ChevronRight} 
                iconDescription="Next Page"
                disabled={page >= totalPages || loading}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Results */}
      <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', background: '#0f0f0f' }}>
        {loading && creators.length === 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {[1,2,3,4,5,6].map(i => <SkeletonPlaceholder key={i} style={{ height: 280, width: '100%' }} />)}
          </div>
        ) : creators.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#525252' }}>
            No creators found matching search filter criteria.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {creators.map(c => {
              const authScore = c.authenticity_score || 0;
              const isAuthentic = authScore >= 80;
              const isRisky = authScore < 60;
              
              const isSyntheticHandle = /\d{3,}$/.test(c.handle || '');
              const profileUrl = isSyntheticHandle
                ? (c.platform === 'YouTube' 
                    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(c.name + ' ' + c.niche)}`
                    : `https://www.instagram.com/explore/tags/${encodeURIComponent((c.niche || 'creator').toLowerCase().replace(/[^a-z0-9]/g, ''))}/`)
                : (c.platform === 'YouTube'
                    ? `https://youtube.com/${c.handle?.startsWith('@') ? c.handle : '@' + c.handle}`
                    : `https://instagram.com/${c.handle?.replace('@', '')}`);

              const avatarUrl = (!c.avatar || c.avatar.includes('unavatar.io'))
                ? `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'Creator')}&background=0f62fe&color=ffffff&bold=true`
                : c.avatar;

              return (
                <div key={c.id} style={{
                  background: '#1c1c1c', border: '1px solid #393939', borderRadius: 8, overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative'
                }}>
                  {/* Auth Badge Overlay */}
                  <div style={{
                    position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: '0.25rem',
                    background: isRisky ? '#da1e28' : isAuthentic ? '#24a148' : '#f1c21b',
                    color: '#fff', padding: '0.25rem 0.5rem', borderRadius: 4, fontSize: '0.7rem', fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    {isRisky ? <WarningAlt size={14} /> : <CheckmarkOutline size={14} />}
                    {authScore} Auth Score
                  </div>

                  {/* Header Profile */}
                  <div style={{ padding: '1.25rem', borderBottom: '1px solid #262626', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <img 
                      src={avatarUrl} 
                      alt={c.name} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=0f62fe&color=ffffff&bold=true`;
                      }}
                      style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', background: '#393939', cursor: 'pointer' }}
                      onClick={() => handleOpenProfile(c.id)}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div 
                        style={{ fontWeight: '600', fontSize: '1rem', color: '#f4f4f4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                        onClick={() => handleOpenProfile(c.id)}
                      >
                        {c.name}
                      </div>
                      
                      {/* External Redirection Handle Link */}
                      <a 
                        href={profileUrl}
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: '#78a9ff', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: '500' }}
                        title={`Open ${c.name}'s profile`}
                      >
                        {c.handle} <Launch size={12} />
                      </a>

                      <div style={{ color: '#a8a8a8', fontSize: '0.75rem', marginTop: '0.2rem' }}>{c.platform} • {c.location?.split(',')[0]}</div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#262626' }}>
                    <div style={{ background: '#1c1c1c', padding: '0.75rem 1.25rem' }}>
                      <div style={{ fontSize: '0.7rem', color: '#6f6f6f', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                        <UserFollow size={14} /> FOLLOWERS
                      </div>
                      <div style={{ fontWeight: '600', color: '#f4f4f4' }}>{formatCount(c.followers_raw)}</div>
                    </div>
                    <div style={{ background: '#1c1c1c', padding: '0.75rem 1.25rem' }}>
                      <div style={{ fontSize: '0.7rem', color: '#6f6f6f', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                        <Currency size={14} /> EST. PRICE
                      </div>
                      <div style={{ fontWeight: '600', color: '#f4f4f4' }}>{fmtCurrency(c.price_per_post)}</div>
                    </div>
                  </div>

                  {/* Bio, Niche & Email */}
                  <div style={{ padding: '1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Tag type="blue" size="sm" style={{ margin: '0 0 0.75rem 0', alignSelf: 'flex-start' }}>{c.niche}</Tag>
                    <p style={{ fontSize: '0.8rem', color: '#c6c6c6', lineHeight: 1.4, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {c.bio}
                    </p>
                    
                    {/* Business Email Contact Pill */}
                    {c.email && (
                      <div style={{ marginTop: '0.75rem', padding: '0.4rem 0.6rem', background: '#262626', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', border: '1px solid #393939' }}>
                        <Email size={14} style={{ color: '#4589ff', flexShrink: 0 }} />
                        <span style={{ color: '#edf5ff', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div style={{ padding: '0.75rem', background: '#161616', borderTop: '1px solid #393939' }}>
                    <Button 
                      kind="primary" 
                      size="sm" 
                      renderIcon={Send}
                      style={{ width: '100%', maxWidth: 'none', justifyContent: 'space-between' }}
                      onClick={() => handleOpenOutreachModal(c)}
                      disabled={isRisky}
                    >
                      {isRisky ? 'Blocked by Risk Policy' : 'Draft Outreach'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div style={{ background: '#161616', borderTop: '1px solid #393939', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: '#a8a8a8' }}>
          Showing <strong>{total > 0 ? startRecord : 0}–{endRecord}</strong> of <strong>{total.toLocaleString()}</strong> creators
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button 
            kind="secondary" 
            size="sm" 
            disabled={page <= 1 || loading}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            renderIcon={ChevronLeft}
          >
            Previous
          </Button>
          <span style={{ color: '#f4f4f4', fontSize: '0.875rem', fontWeight: '600' }}>
            Page {page} of {totalPages}
          </span>
          <Button 
            kind="secondary" 
            size="sm" 
            disabled={page >= totalPages || loading}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            renderIcon={ChevronRight}
          >
            Next
          </Button>
        </div>
      </div>
      
      {/* Global Notification Banner */}
      {globalNotification && (
        <div style={{ padding: '0.75rem 1.5rem 0 1.5rem' }}>
          <InlineNotification
            kind={globalNotification.kind}
            title={globalNotification.title}
            subtitle={globalNotification.subtitle}
            onClose={() => setGlobalNotification(null)}
            onCloseButtonClick={() => setGlobalNotification(null)}
          />
        </div>
      )}

      {/* Profile Detail Modal */}
      <CreatorProfileModal
        creatorId={selectedCreatorId}
        isOpen={!!selectedCreatorId}
        onClose={() => setSelectedCreatorId(null)}
        onSelectOutreach={(creator) => {
          setSelectedCreatorId(null);
          handleOpenOutreachModal(creator);
        }}
      />

      {/* Outreach Proposal Carbon Modal */}
      <Modal
        open={!!outreachCreator}
        modalHeading={
          outreachResult?.success 
            ? "Proposal Dispatched Successfully" 
            : "Draft & Launch Collaboration Proposal"
        }
        modalLabel={outreachResult?.success ? "OUTREACH ACTIVE" : "AUTONOMOUS OUTREACH"}
        primaryButtonText={
          outreachResult?.success
            ? "Open Live Negotiation Thread 💬"
            : (sendingOutreach ? "Launching Proposal..." : "🚀 Send Proposal & Pitch")
        }
        secondaryButtonText={outreachResult?.success ? "Stay in Creator Discovery" : "Cancel"}
        primaryButtonDisabled={sendingOutreach}
        onRequestClose={() => {
          setOutreachCreator(null);
          setOutreachResult(null);
        }}
        onRequestSubmit={() => {
          if (outreachResult?.success) {
            handleViewDeal(outreachResult.deal, outreachResult.campaignId);
          } else {
            handleSendOutreachSubmit();
          }
        }}
        size="md"
      >
        {outreachCreator && (
          outreachResult?.success ? (
            /* --- SUCCESS CONFIRMATION VIEW --- */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '0.5rem' }}>
              <div style={{ 
                textAlign: 'center', 
                padding: '1.5rem 1rem', 
                background: 'linear-gradient(180deg, rgba(66, 190, 101, 0.12) 0%, rgba(66, 190, 101, 0.03) 100%)', 
                borderRadius: 8, 
                border: '1px solid rgba(66, 190, 101, 0.35)' 
              }}>
                <CheckmarkFilled size={44} style={{ color: '#42be65', marginBottom: '0.5rem' }} />
                <h3 style={{ color: '#f4f4f4', fontSize: '1.25rem', margin: '0 0 0.35rem 0', fontWeight: '600' }}>
                  Collaboration Pitch Dispatched!
                </h3>
                <p style={{ color: '#c6c6c6', fontSize: '0.875rem', margin: 0 }}>
                  Pitch successfully delivered to <strong style={{ color: '#4589ff' }}>{outreachResult.creatorName}</strong> ({outreachResult.creatorEmail}).
                </p>
              </div>

              {/* Deal Summary Tile */}
              <Tile style={{ background: '#1e1e1e', border: '1px solid #333', padding: '1rem', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: '#8d8d8d' }}>Creator:</span>
                  <span style={{ color: '#f4f4f4', fontWeight: '600' }}>{outreachResult.creatorName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: '#8d8d8d' }}>Offered Collaboration Fee:</span>
                  <span style={{ color: '#42be65', fontWeight: '700', fontSize: '1rem' }}>₹{Number(outreachResult.fee).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: '#8d8d8d' }}>Deal Pipeline Stage:</span>
                  <Tag type="cyan" size="sm">INVITED / PITCH_SENT</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: '#8d8d8d' }}>Gemini AI Negotiator:</span>
                  <span style={{ color: '#a8a8a8', fontSize: '0.8rem' }}>Active & Ready for responses</span>
                </div>
              </Tile>

              <p style={{ color: '#8d8d8d', fontSize: '0.8rem', margin: 0, lineHeight: '1.4' }}>
                💡 Click <strong>"Open Live Negotiation Thread"</strong> below to view the message thread, simulate responses, or test AI auto-negotiation!
              </p>
            </div>
          ) : (
            /* --- DRAFT PROPOSAL VIEW --- */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '0.5rem' }}>
              {/* Creator Summary Header Tile */}
              <Tile style={{ background: '#262626', border: '1px solid #393939', padding: '1rem', borderRadius: 6 }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <img 
                    src={outreachCreator.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(outreachCreator.name)}&background=0f62fe&color=ffffff`} 
                    alt={outreachCreator.name} 
                    style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} 
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, color: '#f4f4f4', fontSize: '1.1rem', fontWeight: '600' }}>{outreachCreator.name}</h4>
                    <p style={{ margin: '0.2rem 0 0 0', color: '#a8a8a8', fontSize: '0.85rem' }}>
                      {outreachCreator.handle} • {outreachCreator.platform} • {outreachCreator.location}
                    </p>
                  </div>
                  <Tag type="blue" size="sm">{outreachCreator.niche}</Tag>
                </div>
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #393939', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#161616', padding: '0.4rem 0.6rem', borderRadius: 4, border: '1px solid #393939' }}>
                    <span style={{ color: '#a8a8a8' }}>Outbound Dispatcher:</span>
                    <span style={{ color: '#42be65', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckmarkFilled size={14} /> {senderEmail || 'Project X Cloud Mailer'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#161616', padding: '0.4rem 0.6rem', borderRadius: 4, border: '1px solid #393939' }}>
                    <span style={{ color: '#a8a8a8' }}>To (Creator Inbox):</span>
                    <span style={{ color: '#4589ff', fontWeight: '600' }}>
                      {outreachCreator.email}
                    </span>
                  </div>
                </div>
              </Tile>

              {/* Campaign Selection */}
              <Select 
                id="outreach-target-campaign" 
                labelText="Target Campaign" 
                value={targetCampaignId} 
                onChange={e => setTargetCampaignId(e.target.value)}
                style={{ background: '#262626' }}
              >
                {campaignsList.map(c => (
                  <SelectItem key={c.id} value={c.id} text={`${c.brandName || c.brand_name} — ${c.productName || c.product_name}`} />
                ))}
              </Select>

              {/* Proposed Fee */}
              <NumberInput
                id="outreach-fee-input"
                label="Offered Collaboration Fee (₹)"
                value={offeredFee}
                onChange={(e, { value }) => setOfferedFee(Number(value || 0))}
                min={1000}
                max={1000000}
                step={1000}
                style={{ background: '#262626' }}
              />

              {/* Email Preview */}
              <div>
                <p style={{ fontSize: '0.8rem', color: '#c6c6c6', marginBottom: '0.4rem', fontWeight: '600' }}>Email Preview (Sent via Gmail OAuth):</p>
                <div style={{ background: '#161616', border: '1px solid #393939', padding: '1rem', borderRadius: 4, fontSize: '0.85rem', color: '#dcdcdc', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '140px', overflowY: 'auto' }}>
                  {`Namaste ${outreachCreator.name},\n\nWe love your content! We'd like to invite you to collaborate on our upcoming campaign.\n\n- Proposed Fee: ₹${Number(offeredFee).toLocaleString('en-IN')}\n\nPlease reply directly to confirm your interest so our AI agent can send contract terms!`}
                </div>
              </div>

              {/* Sending Loading State */}
              {sendingOutreach && (
                <div style={{ padding: '0.75rem', background: '#161616', border: '1px solid #393939', borderRadius: 4 }}>
                  <InlineLoading
                    status="active"
                    description="Dispatching proposal email via Gmail OAuth and initializing deal state..."
                  />
                </div>
              )}

              {/* Error Notification */}
              {outreachResult && !outreachResult.success && (
                <InlineNotification
                  kind="error"
                  title="Outreach Failed"
                  subtitle={outreachResult.error}
                  hideCloseButton
                />
              )}
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
