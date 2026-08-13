import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search as SearchInput, Select, SelectItem, Button, Tag, Loading,
  SkeletonPlaceholder, Pagination
} from '@carbon/react';
import { 
  Search, CheckmarkOutline, WarningAlt, Send, Currency, UserFollow, Launch, ChevronLeft, ChevronRight, Email
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

export default function CreatorSearch({ onSelectCreator, activeCampaign }) {
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
                      onClick={() => handleSelect(c)}
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
      
      {/* Profile Modal */}
      <CreatorProfileModal
        creatorId={selectedCreatorId}
        isOpen={!!selectedCreatorId}
        onClose={() => setSelectedCreatorId(null)}
      />
    </div>
  );
}
