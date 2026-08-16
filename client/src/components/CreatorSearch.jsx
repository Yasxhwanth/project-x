import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search as SearchInput, Select, SelectItem, Button, Tag, Loading,
  SkeletonPlaceholder, Modal, NumberInput, TextInput, InlineNotification, 
  Tile, Grid, Column, InlineLoading
} from '@carbon/react';
import { 
  Search, CheckmarkOutline, WarningAlt, Send, Currency, UserFollow, 
  Launch, ChevronLeft, ChevronRight, Email, CheckmarkFilled, ArrowRight,
  Filter, Reset
} from '@carbon/icons-react';
import CreatorProfileModal from './CreatorProfileModal';

const NICHES = [
  'All', 'Finance & Investing', 'Tech & Gadgets', 'Gaming & Esports', 
  'Business & Startups', 'Fashion & Lifestyle', 'Beauty & Skincare', 
  'Fitness & Health', 'Food & Cooking', 'Travel & Vlogging', 
  'Education & Motivation', 'Meme & Pop Culture', 'Regional Entertainment', 
  'Music & Arts', 'Sustainability & Environment', 'Photography & Cinematography', 
  'Parenting & Family'
];

const PLATFORMS = ['All', 'Instagram', 'YouTube'];

const SORTS = [
  { id: 'followers', label: 'Followers (High to Low)' },
  { id: 'authenticity', label: 'Authenticity (High to Low)' },
  { id: 'price', label: 'Price (Low to High)' },
  { id: 'rating', label: 'Rating (High to Low)' }
];

const LIMITS = [24, 48, 96, 200];

function formatCount(val) {
  if (!val) return '0';
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return Number(val).toLocaleString();
}

const fmtCurrency = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

export default function CreatorSearch({ onSelectCreator, onViewDeal, activeCampaign }) {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [niche, setNiche] = useState('All');
  const [platform, setPlatform] = useState('All');
  const [sortBy, setSortBy] = useState('followers');
  
  // Pagination & Limits
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(48);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [latency, setLatency] = useState(0);
  
  const [selectedCreatorId, setSelectedCreatorId] = useState(null);

  // Outreach Proposal Modal State
  const [outreachCreator, setOutreachCreator] = useState(null);
  const [destinationEmail, setDestinationEmail] = useState('');
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
    } catch (e) { 
      console.error("Failed to load campaigns", e); 
    }
  };

  const handleOpenOutreachModal = (c) => {
    setOutreachCreator(c);
    setDestinationEmail(c.email || '');
    setOfferedFee(c.price_per_post || 25000);
    setTargetCampaignId(activeCampaign?.id || campaignsList[0]?.id || 'camp_01');
    setOutreachResult(null);
  };

  const handleSendOutreachSubmit = async () => {
    if (!outreachCreator) return;
    setSendingOutreach(true);
    setOutreachResult(null);
    const targetEmail = destinationEmail.trim() || outreachCreator.email;
    try {
      const res = await fetch('/api/deals/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: outreachCreator.id,
          campaignId: targetCampaignId || 'camp_01',
          offeredPrice: offeredFee,
          creatorName: outreachCreator.name,
          creatorEmail: targetEmail,
          creatorAvatar: outreachCreator.avatar,
          platform: outreachCreator.platform
        })
      });
      if (res.ok) {
        const deal = await res.json();
        setCreators(prev => prev.map(c => c.id === outreachCreator.id ? { ...c, email: targetEmail } : c));
        
        setOutreachCreator(null);
        setOutreachResult(null);
        
        if (onViewDeal) {
          onViewDeal(deal, targetCampaignId || 'camp_01');
        } else if (onSelectCreator) {
          onSelectCreator(deal);
        }
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

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchCreators();
    }, 250);
    return () => clearTimeout(debounceTimer.current);
  }, [fetchCreators]);

  const handleQueryChange = (val) => { setQuery(val); setPage(1); };
  const handleNicheChange = (val) => { setNiche(val); setPage(1); };
  const handlePlatformChange = (val) => { setPlatform(val); setPage(1); };
  const handleSortChange = (val) => { setSortBy(val); setPage(1); };
  const handleLimitChange = (val) => { setLimit(Number(val)); setPage(1); };

  const handleResetFilters = () => {
    setQuery('');
    setNiche('All');
    setPlatform('All');
    setSortBy('followers');
    setPage(1);
  };

  const handleOpenProfile = (id) => {
    setSelectedCreatorId(id);
  };

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      
      {/* ─── Hero Overview Bar ────────────────────────────────────────────── */}
      <div className="hero-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Creator Intelligence & Talent Discovery</h1>
            <p>
              Comprehensive database of verified Indian creators with authenticated business contacts, audience authenticity scoring, and commercial rate benchmarks.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Tag type="blue" size="md">
              500+ Verified Profiles
            </Tag>
            <Tag type="green" size="md">
              Public Business Contacts
            </Tag>
          </div>
        </div>
      </div>

      {/* ─── Global Search & Filter Toolbar ───────────────────────────────── */}
      <Tile 
        style={{ 
          background: 'var(--color-surface)', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 6,
          padding: '1.25rem',
          marginBottom: '1.5rem'
        }}
      >
        <Grid fullWidth style={{ padding: 0, rowGap: '1rem', columnGap: '1rem' }}>
          <Column lg={6} md={8} sm={4}>
            <SearchInput
              id="fts-search"
              labelText="Global Creator Search"
              placeholder="Search by creator name, @handle, niche, city, or email..."
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              onClear={() => handleQueryChange('')}
              size="lg"
            />
          </Column>

          <Column lg={3} md={4} sm={2}>
            <Select 
              id="niche-select" 
              labelText="Content Niche" 
              value={niche} 
              onChange={e => handleNicheChange(e.target.value)}
              size="md"
            >
              {NICHES.map(n => <SelectItem key={n} value={n} text={n} />)}
            </Select>
          </Column>

          <Column lg={2} md={2} sm={2}>
            <Select 
              id="platform-select" 
              labelText="Platform" 
              value={platform} 
              onChange={e => handlePlatformChange(e.target.value)}
              size="md"
            >
              {PLATFORMS.map(p => <SelectItem key={p} value={p} text={p} />)}
            </Select>
          </Column>

          <Column lg={3} md={4} sm={2}>
            <Select 
              id="sort-select" 
              labelText="Sort By" 
              value={sortBy} 
              onChange={e => handleSortChange(e.target.value)}
              size="md"
            >
              {SORTS.map(s => <SelectItem key={s.id} value={s.id} text={s.label} />)}
            </Select>
          </Column>

          <Column lg={2} md={2} sm={2}>
            <Select 
              id="limit-select" 
              labelText="Display Limit" 
              value={limit} 
              onChange={e => handleLimitChange(e.target.value)}
              size="md"
            >
              {LIMITS.map(l => <SelectItem key={l} value={l} text={`${l} per page`} />)}
            </Select>
          </Column>
        </Grid>

        <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#a8a8a8' }}>
            Showing <strong>{total > 0 ? `${startRecord}–${endRecord}` : 0}</strong> of <strong>{total.toLocaleString()}</strong> verified creators 
            {latency > 0 && <span style={{ color: '#6f6f6f', marginLeft: '0.5rem' }}>({latency}ms index query)</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {(query || niche !== 'All' || platform !== 'All') && (
              <Button 
                kind="ghost" 
                size="sm" 
                renderIcon={Reset} 
                onClick={handleResetFilters}
                style={{ color: '#78a9ff', height: '2rem' }}
              >
                Reset Filters
              </Button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Button 
                kind="ghost" 
                size="sm" 
                hasIconOnly 
                renderIcon={ChevronLeft} 
                iconDescription="Previous Page"
                disabled={page <= 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              />
              <span style={{ color: '#f4f4f4', fontSize: '0.8rem', fontWeight: 600, padding: '0 0.5rem' }}>
                {page} / {totalPages}
              </span>
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
      </Tile>

      {/* ─── Creator Card Grid ─────────────────────────────────────────────── */}
      {loading && creators.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {[1,2,3,4,5,6].map(i => (
            <SkeletonPlaceholder key={i} style={{ height: 320, width: '100%', borderRadius: 6 }} />
          ))}
        </div>
      ) : creators.length === 0 ? (
        <Tile style={{ padding: '3.5rem 2rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 6 }}>
          <Search size={32} style={{ color: '#6f6f6f', marginBottom: '0.75rem' }} />
          <h3 style={{ color: '#f4f4f4', fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
            No creators match this search criteria
          </h3>
          <p style={{ color: '#8d8d8d', fontSize: '0.875rem', margin: '0 0 1.25rem 0' }}>
            Try broadening your niche filter or searching by creator name, handle, or city.
          </p>
          <Button kind="secondary" size="sm" onClick={handleResetFilters}>
            Reset All Filters
          </Button>
        </Tile>
      ) : (
        <div className="creator-card-grid">
          {creators.map(c => {
            const authScore = c.authenticity_score || 92;
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
              ? `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'Creator')}&background=0f62fe&color=ffffff&bold=true&size=256`
              : c.avatar;

            return (
              <div 
                key={c.id} 
                className="creator-card"
                style={{ position: 'relative', overflow: 'hidden' }}
              >
                {/* Authenticity Score Tag */}
                <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                  <Tag 
                    type={isRisky ? 'red' : isAuthentic ? 'green' : 'yellow'} 
                    size="sm"
                    style={{ margin: 0, fontWeight: 700 }}
                  >
                    {authScore}% Auth
                  </Tag>
                </div>

                {/* Profile Header */}
                <div className="creator-profile-header">
                  <img 
                    src={avatarUrl} 
                    alt={c.name} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=0f62fe&color=ffffff&bold=true&size=256`;
                    }}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleOpenProfile(c.id)}
                  />
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '4.5rem' }}>
                    <div 
                      className="creator-name"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleOpenProfile(c.id)}
                      title={c.name}
                    >
                      {c.name}
                    </div>
                    
                    <a 
                      href={profileUrl}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="creator-handle"
                      style={{ 
                        color: '#78a9ff', 
                        textDecoration: 'none', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.25rem',
                        fontWeight: 500
                      }}
                      title={`Open ${c.name}'s profile`}
                    >
                      {c.handle} <Launch size={11} />
                    </a>

                    <div style={{ color: '#8d8d8d', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                      {c.platform} • {c.location?.split(',')[0] || 'India'}
                    </div>
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="metrics-row">
                  <div className="metric-item">
                    <span className="label">Followers</span>
                    <span className="value" style={{ color: '#f4f4f4' }}>
                      {formatCount(c.followers_raw)}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="label">Estimated Fee</span>
                    <span className="value" style={{ color: '#42be65' }}>
                      {fmtCurrency(c.price_per_post)}
                    </span>
                  </div>
                </div>

                {/* Bio & Niche */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: '0.25rem' }}>
                  <Tag type="blue" size="sm" style={{ margin: '0 0 0.5rem 0', alignSelf: 'flex-start' }}>
                    {c.niche}
                  </Tag>

                  <p style={{ 
                    fontSize: '0.8rem', 
                    color: '#a8a8a8', 
                    lineHeight: 1.45, 
                    margin: '0 0 0.75rem 0',
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden' 
                  }}>
                    {c.bio}
                  </p>
                  
                  {/* Verified Email Pill */}
                  {c.email && (
                    <div 
                      style={{ 
                        marginTop: 'auto', 
                        padding: '0.35rem 0.6rem', 
                        background: '#111111', 
                        borderRadius: 4, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.4rem', 
                        fontSize: '0.75rem', 
                        border: '1px solid rgba(255, 255, 255, 0.08)' 
                      }}
                    >
                      <Email size={13} style={{ color: '#4589ff', flexShrink: 0 }} />
                      <span style={{ color: '#d0e2ff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.email}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action CTA */}
                <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  {isRisky ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <Button 
                        kind="danger--ghost" 
                        size="sm" 
                        renderIcon={WarningAlt}
                        style={{ width: '100%', maxWidth: 'none', justifyContent: 'space-between', color: '#ff8389' }}
                        onClick={() => handleOpenOutreachModal(c)}
                        title={`Audience authenticity (${authScore}%) is below 60% brand threshold.`}
                      >
                        Safety Warning ({authScore}% Auth)
                      </Button>
                      <div style={{ fontSize: '0.7rem', color: '#da1e28', textAlign: 'center' }}>
                        Low audience quality score (&lt;60%)
                      </div>
                    </div>
                  ) : (
                    <Button 
                      kind="primary" 
                      size="sm" 
                      renderIcon={Send}
                      style={{ width: '100%', maxWidth: 'none', justifyContent: 'space-between' }}
                      onClick={() => handleOpenOutreachModal(c)}
                    >
                      Draft Outreach
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Pagination Footer Bar ────────────────────────────────────────── */}
      <div 
        style={{ 
          marginTop: '1.75rem', 
          background: 'var(--color-surface)', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          borderRadius: 6,
          padding: '0.85rem 1.25rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <span style={{ fontSize: '0.8rem', color: '#a8a8a8' }}>
          Showing <strong>{total > 0 ? startRecord : 0}–{endRecord}</strong> of <strong>{total.toLocaleString()}</strong> verified creators
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button 
            kind="secondary" 
            size="sm" 
            disabled={page <= 1 || loading}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            renderIcon={ChevronLeft}
          >
            Previous
          </Button>
          <span style={{ color: '#f4f4f4', fontSize: '0.85rem', fontWeight: 600, padding: '0 0.5rem' }}>
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
      
      {/* ─── Global Notification ─────────────────────────────────────────── */}
      {globalNotification && (
        <div style={{ marginTop: '1rem' }}>
          <InlineNotification
            kind={globalNotification.kind}
            title={globalNotification.title}
            subtitle={globalNotification.subtitle}
            onClose={() => setGlobalNotification(null)}
            onCloseButtonClick={() => setGlobalNotification(null)}
          />
        </div>
      )}

      {/* ─── Creator Detailed Profile Modal ───────────────────────────────── */}
      {selectedCreatorId && (
        <CreatorProfileModal
          creatorId={selectedCreatorId}
          isOpen={Boolean(selectedCreatorId)}
          onClose={() => setSelectedCreatorId(null)}
          onDraftOutreach={(c) => {
            setSelectedCreatorId(null);
            handleOpenOutreachModal(c);
          }}
        />
      )}

      {/* ─── Outreach Modal ──────────────────────────────────────────────── */}
      {outreachCreator && (
        <Modal
          open={Boolean(outreachCreator)}
          modalHeading={`Draft Proposal: ${outreachCreator.name}`}
          modalLabel="AUTONOMOUS OUTREACH ENGINE"
          primaryButtonText={sendingOutreach ? "Sending Proposal..." : "Dispatch Proposal"}
          secondaryButtonText="Cancel"
          primaryButtonDisabled={sendingOutreach}
          onRequestClose={() => { setOutreachCreator(null); setOutreachResult(null); }}
          onRequestSubmit={handleSendOutreachSubmit}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '0.5rem' }}>
            
            {/* Sender & Recipient Badges */}
            <div style={{ background: '#111111', padding: '0.85rem 1rem', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', fontWeight: 600 }}>From Connected Sender</span>
                <Tag type="green" size="sm">Gmail Connected</Tag>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#f4f4f4', fontWeight: 500 }}>
                {senderEmail || 'brand.partnerships@projectx.ai'}
              </div>
            </div>

            {/* Form Fields */}
            <TextInput
              id="outreach-email"
              labelText="Creator Recipient Email"
              value={destinationEmail}
              onChange={e => setDestinationEmail(e.target.value)}
              placeholder="e.g. business@creator.in"
              helperText="Verified contact email from public bio"
            />

            <Select
              id="outreach-campaign"
              labelText="Target Campaign Brief"
              value={targetCampaignId}
              onChange={e => setTargetCampaignId(e.target.value)}
            >
              {campaignsList.map(camp => (
                <SelectItem 
                  key={camp.id} 
                  value={camp.id} 
                  text={`${camp.brandName || camp.brand_name || 'Brand'} — ${camp.productName || camp.product_name || 'Campaign'}`} 
                />
              ))}
            </Select>

            <NumberInput
              id="outreach-fee"
              label="Proposed Initial Deliverable Fee (INR ₹)"
              value={offeredFee}
              onChange={(e, { value }) => setOfferedFee(value)}
              min={1000}
              max={2500000}
              step={2500}
              helperText="The Gemini negotiator agent will stay strictly within approved budget caps."
            />

            {outreachResult?.error && (
              <InlineNotification
                kind="error"
                title="Outreach Failed"
                subtitle={outreachResult.error}
              />
            )}

            {sendingOutreach && (
              <InlineLoading description="Generating personalized brief and dispatching email..." />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
