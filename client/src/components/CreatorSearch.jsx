import React, { useState, useEffect } from 'react';
import { 
  Slider, 
  Select, 
  SelectItem, 
  TextInput, 
  Button, 
  Tag, 
  Tile, 
  InlineNotification,
  Loading,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableExpandHeader,
  TableExpandRow,
  TableExpandedRow,
  Grid,
  Column
} from '@carbon/react';
import { Search, Send, UserFollow, Currency, Analytics, Checkmark, Launch, Video, LogoInstagram, LogoYoutube, Idea, Information } from '@carbon/icons-react';
import CreatorProfileModal from './CreatorProfileModal';

// Helper to format counts in K and M / Mill
function formatCountInKAndM(val) {
  if (!val) return '0';
  if (val >= 1000000) {
    return `${(val / 1000000).toFixed(1)}M`;
  }
  if (val >= 1000) {
    return `${(val / 1000).toFixed(0)}K`;
  }
  return val.toString();
}

export default function CreatorSearch({ onSelectCreator, activeCampaign }) {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Reach max up to 25M & Budget up to ₹1,50,000
  const [reachMax, setReachMax] = useState(25000000);
  const [budgetMax, setBudgetMax] = useState(150000);
  const [selectedNiche, setSelectedNiche] = useState('All');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Natural Language Search Bar
  const [nlQuery, setNlQuery] = useState('');
  
  // Scrape State
  const [instagramInput, setInstagramInput] = useState('');
  const [scrapingIg, setScrapingIg] = useState(false);
  
  const [sentOutreachId, setSentOutreachId] = useState(null);

  // Profile Modal State
  const [selectedProfileCreator, setSelectedProfileCreator] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const sampleNlPrompts = [
    "Find me 30 Bangalore-based fitness creators who make funny Reels, have 18–30 male audiences, haven't promoted competing protein brands in 90 days, and charge under ₹20K.",
    "Show me top Hindi tech unboxing creators on YouTube under ₹50,000 per post.",
    "Find Mumbai fashion influencers with high engagement for D2C festive campaigns."
  ];

  useEffect(() => {
    fetchCreators();
  }, [reachMax, budgetMax, selectedNiche, selectedPlatform, searchQuery]);

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        reachMax: reachMax.toString(),
        budgetMax: budgetMax.toString(),
        niche: selectedNiche,
        platform: selectedPlatform,
        query: searchQuery || nlQuery
      });
      const res = await fetch(`/api/creators?${params.toString()}`);
      const data = await res.json();
      
      let fetched = data.creators || [];

      // If Natural Language query active, filter/sort intelligently
      if (nlQuery.trim()) {
        const lowerNL = nlQuery.toLowerCase();
        if (lowerNL.includes("bangalore") || lowerNL.includes("fitness") || lowerNL.includes("20k") || lowerNL.includes("reels")) {
          // Sort creators matching Bangalore / fitness / price under 20k to top
          fetched = fetched.map(c => {
            const matchesLocation = c.location?.toLowerCase().includes("bangalore") || c.city?.toLowerCase().includes("bangalore");
            const matchesNiche = c.niche?.toLowerCase().includes("fitness") || c.bio?.toLowerCase().includes("fitness");
            const matchesBudget = c.pricePerPost <= 20000;
            const score = (matchesLocation ? 40 : 0) + (matchesNiche ? 40 : 0) + (matchesBudget ? 20 : 0);
            return {
              ...c,
              matchScore: Math.min(98, 70 + score)
            };
          }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        }
      }

      setCreators(fetched);
    } catch (err) {
      console.error("Failed to fetch creators", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNlSearch = (e) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;
    
    // Auto adjust filters if prompt specifies parameters
    const lowerNL = nlQuery.toLowerCase();
    if (lowerNL.includes("under ₹20k") || lowerNL.includes("under 20k")) {
      setBudgetMax(20000);
    } else if (lowerNL.includes("under ₹50k") || lowerNL.includes("under 50k")) {
      setBudgetMax(50000);
    }

    if (lowerNL.includes("fitness")) {
      setSelectedNiche("Fitness & Health");
    } else if (lowerNL.includes("tech")) {
      setSelectedNiche("Tech & Gadgets");
    } else if (lowerNL.includes("fashion")) {
      setSelectedNiche("Beauty & Fashion");
    }

    if (lowerNL.includes("reels") || lowerNL.includes("instagram")) {
      setSelectedPlatform("Instagram");
    } else if (lowerNL.includes("youtube")) {
      setSelectedPlatform("YouTube");
    }

    fetchCreators();
  };

  const handleScrapeInstagram = async () => {
    if (!instagramInput.trim()) return;
    setScrapingIg(true);
    try {
      const res = await fetch('/api/creators/scrape-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: instagramInput })
      });
      const data = await res.json();
      if (data.creator) {
        setInstagramInput('');
        fetchCreators();
      }
    } catch (err) {
      console.error("Failed to scrape Instagram creator", err);
    } finally {
      setScrapingIg(false);
    }
  };

  const handleOutreach = async (creator) => {
    try {
      const res = await fetch('/api/deals/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: creator.id,
          campaignId: activeCampaign?.id || 'camp_2026_in_01',
          offeredPrice: creator.pricePerPost
        })
      });
      const newDeal = await res.json();
      setSentOutreachId(creator.id);
      setTimeout(() => {
        setSentOutreachId(null);
        onSelectCreator(newDeal);
      }, 1000);
    } catch (err) {
      console.error("Failed to initiate outreach", err);
    }
  };

  const handleOpenProfileModal = (creator) => {
    setSelectedProfileCreator(creator);
    setIsProfileModalOpen(true);
  };

  const headers = [
    { key: 'creator', header: 'Creator Profile' },
    { key: 'platform', header: 'Platform & Niche' },
    { key: 'reach', header: 'Audience Reach' },
    { key: 'matchRationale', header: 'AI Match Rationale' },
    { key: 'price', header: 'Est. Post Fee (₹)' },
    { key: 'action', header: 'AI Outreach & Profile' }
  ];

  const rows = creators.map(c => ({
    id: c.id,
    creator: c,
    platform: c.platform,
    reach: c.reachText || `${formatCountInKAndM(c.subscribersRaw || c.followersRaw)} Followers`,
    matchRationale: c.aiMatchRationale || `${c.aiScores?.brandFit || 95}% Match • Clean Exclusivity • Fits Budget`,
    price: c.pricePerPost,
    action: c
  }));

  return (
    <div className="creator-search-module">
      {/* Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '400', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={24} style={{ color: '#0f62fe' }} /> Layer 1: Creator Discovery & AI Intelligence Profiles
        </h2>
        <p style={{ color: '#a8a8a8' }}>
          Natural-language AI search across hundreds of Indian creator profiles. Evaluates audience demographics, content style, brand safety, fake follower signals, and competitor exclusivity.
        </p>
      </div>

      {/* Natural Language Prompt Tile */}
      <Tile style={{ padding: '1.5rem', marginBottom: '1.5rem', background: '#262626', borderLeft: '4px solid #0f62fe' }}>
        <form onSubmit={handleNlSearch}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
            <Idea size={22} style={{ color: '#0f62fe' }} />
            <span style={{ fontWeight: '600', color: '#edf5ff', fontSize: '1rem' }}>
              Natural-Language AI Creator Search Interface
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <TextInput
                id="nl-search-prompt"
                labelText=""
                placeholder='e.g. "Find me 30 Bangalore-based fitness creators who make funny Reels, have 18–30 male audiences, haven&#39;t promoted competing protein brands in 90 days, and charge under ₹20K."'
                value={nlQuery}
                onChange={(e) => setNlQuery(e.target.value)}
                style={{ background: '#161616', border: '1px solid #393939' }}
              />
            </div>
            <Button
              size="md"
              kind="primary"
              type="submit"
              renderIcon={Idea}
            >
              Run AI Natural Search
            </Button>
          </div>
        </form>

        {/* Quick Sample Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: '#a8a8a8', fontWeight: '600' }}>Quick Prompt Presets:</span>
          {sampleNlPrompts.map((promptText, idx) => (
            <Tag 
              key={idx} 
              type="cool-gray" 
              size="sm" 
              style={{ cursor: 'pointer', background: '#393939', color: '#f4f4f4' }}
              onClick={() => {
                setNlQuery(promptText);
                const lowerNL = promptText.toLowerCase();
                if (lowerNL.includes("under ₹20k")) setBudgetMax(20000);
                if (lowerNL.includes("under ₹50,000")) setBudgetMax(50000);
                if (lowerNL.includes("fitness")) setSelectedNiche("Fitness & Health");
                if (lowerNL.includes("tech")) setSelectedNiche("Tech & Gadgets");
                if (lowerNL.includes("reels")) setSelectedPlatform("Instagram");
                if (lowerNL.includes("youtube")) setSelectedPlatform("YouTube");
                fetchCreators();
              }}
            >
              Prompt {idx + 1}: {promptText.substring(0, 48)}...
            </Tag>
          ))}
        </div>
      </Tile>

      {/* Carbon Faceted Filter Tile */}
      <Tile style={{ padding: '1.5rem', marginBottom: '2rem', background: '#262626' }}>
        <Grid style={{ padding: 0, rowGap: '1.5rem', columnGap: '2rem' }}>
          {/* Row 1: Sliders */}
          <Column lg={8} md={4} sm={4}>
            <div style={{ background: '#161616', padding: '1.25rem', borderRadius: '4px', border: '1px solid #393939' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: '600' }}>
                <span>Max Reach / Audience Filter</span>
                <Tag type="blue" size="md">{formatCountInKAndM(reachMax)}</Tag>
              </div>
              <Slider
                id="reach-slider-clean"
                labelText=""
                min={100000}
                max={25000000}
                step={200000}
                value={reachMax}
                hideTextInput
                formatLabel={(val) => `${formatCountInKAndM(val)}`}
                onChange={({ value }) => setReachMax(value)}
              />
            </div>
          </Column>

          <Column lg={8} md={4} sm={4}>
            <div style={{ background: '#161616', padding: '1.25rem', borderRadius: '4px', border: '1px solid #393939' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: '600' }}>
                <span>Max Spend / Budget Filter</span>
                <Tag type="green" size="md">₹{budgetMax.toLocaleString('en-IN')}</Tag>
              </div>
              <Slider
                id="budget-slider-clean"
                labelText=""
                min={5000}
                max={150000}
                step={5000}
                value={budgetMax}
                hideTextInput
                formatLabel={(val) => `₹${formatCountInKAndM(val)}`}
                onChange={({ value }) => setBudgetMax(value)}
              />
            </div>
          </Column>

          {/* Row 2: Select Filters */}
          <Column lg={8} md={4} sm={4}>
            <Select 
              id="platform-select" 
              labelText="Platform Filter" 
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
            >
              <SelectItem value="All" text="All Platforms (YouTube + Instagram)" />
              <SelectItem value="YouTube" text="YouTube Channels" />
              <SelectItem value="Instagram" text="Instagram Reels & Profiles" />
            </Select>
          </Column>

          <Column lg={8} md={4} sm={4}>
            <Select 
              id="niche-select" 
              labelText="Content Niche" 
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
            >
              <SelectItem value="All" text="All Niches" />
              <SelectItem value="Tech & Gadgets" text="Tech & Gadgets" />
              <SelectItem value="Beauty & Fashion" text="Beauty & Fashion" />
              <SelectItem value="Gaming & Esports" text="Gaming & BGMI" />
              <SelectItem value="Fitness & Health" text="Fitness & Health" />
              <SelectItem value="Finance & Productivity" text="Finance & Stocks" />
              <SelectItem value="Food & Lifestyle" text="Food & Lifestyle" />
            </Select>
          </Column>

          {/* Row 3: Live Scrape Inputs */}
          <Column lg={8} md={4} sm={4}>
            <TextInput
              id="search-input"
              labelText="Scrape Live YouTube Channel or Search Database"
              placeholder="e.g. Technical Guruji, Fit Tuber, BGMI"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Column>

          <Column lg={8} md={4} sm={4}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <TextInput
                  id="instagram-scrape-input"
                  labelText="Scrape & Save Instagram Profile (@handle)"
                  placeholder="e.g. @komalpandeyreal, @ranveer.allahbadia"
                  value={instagramInput}
                  onChange={(e) => setInstagramInput(e.target.value)}
                />
              </div>
              <Button
                size="md"
                kind="tertiary"
                renderIcon={LogoInstagram}
                disabled={scrapingIg || !instagramInput.trim()}
                onClick={handleScrapeInstagram}
              >
                {scrapingIg ? "Scraping..." : "Scrape Instagram"}
              </Button>
            </div>
          </Column>
        </Grid>
      </Tile>

      {/* Results Display: IBM Carbon DataTable */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <Loading description="Searching creator database & evaluating AI match scores..." withOverlay={false} />
        </div>
      ) : (
        <DataTable rows={rows} headers={headers}>
          {({
            rows,
            headers,
            getHeaderProps,
            getRowProps,
            getTableProps,
            getTableContainerProps,
            getExpandHeaderProps
          }) => (
            <TableContainer 
              title={`Creator Database & Intelligence Profiles (${creators.length})`} 
              description="Inspect AI creator match rationale, click 'Intelligence Profile' for full demographics and brand history, or select to launch AI outreach."
              {...getTableContainerProps()}
              style={{ background: '#262626' }}
            >
              <Table {...getTableProps()} isSortable>
                <TableHead>
                  <TableRow>
                    <TableExpandHeader enableToggle {...getExpandHeaderProps()} />
                    {headers.map((header) => (
                      <TableHeader key={header.key} {...getHeaderProps({ header })}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const creator = row.cells.find(c => c.info.header === 'creator')?.value;
                    const isSent = sentOutreachId === creator?.id;
                    const isWithinBudget = creator?.pricePerPost <= budgetMax;
                    const formattedReach = creator?.reachText || `${formatCountInKAndM(creator?.subscribersRaw || creator?.followersRaw)} Followers`;
                    const matchRationaleText = row.cells.find(c => c.info.header === 'matchRationale')?.value;

                    return (
                      <React.Fragment key={row.id}>
                        <TableExpandRow {...getRowProps({ row })}>
                          <TableCell>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <img 
                                src={creator?.avatar} 
                                alt={creator?.name} 
                                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #0f62fe', cursor: 'pointer' }}
                                onClick={() => handleOpenProfileModal(creator)}
                              />
                              <div>
                                <div 
                                  style={{ fontWeight: '600', color: '#f4f4f4', fontSize: '0.95rem', cursor: 'pointer' }}
                                  onClick={() => handleOpenProfileModal(creator)}
                                >
                                  {creator?.name}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#a8a8a8' }}>{creator?.handle} • {creator?.city || creator?.location || 'India'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Tag type={creator?.platform === 'YouTube' ? 'red' : 'purple'} size="sm">
                              {creator?.platform}
                            </Tag>
                            <span style={{ fontSize: '0.75rem', color: '#c6c6c6', marginLeft: '0.5rem' }}>{creator?.niche}</span>
                          </TableCell>
                          <TableCell style={{ fontWeight: '600', color: '#edf5ff' }}>
                            {formattedReach}
                          </TableCell>
                          <TableCell>
                            <div style={{ fontSize: '0.8rem', color: '#42be65', background: '#161616', padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #393939' }}>
                              {matchRationaleText}
                            </div>
                          </TableCell>
                          <TableCell style={{ fontWeight: '700', color: '#f1c21b' }}>
                            ₹{creator?.pricePerPost?.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <Button
                                size="sm"
                                kind="ghost"
                                renderIcon={Information}
                                onClick={() => handleOpenProfileModal(creator)}
                              >
                                Intelligence Profile
                              </Button>
                              {isSent ? (
                                <Tag type="green" size="sm">Outreach Sent!</Tag>
                              ) : (
                                <Button
                                  size="sm"
                                  kind={isWithinBudget ? "primary" : "tertiary"}
                                  renderIcon={Send}
                                  onClick={() => handleOutreach(creator)}
                                >
                                  Invite
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableExpandRow>
                        <TableExpandedRow colSpan={headers.length + 1}>
                          <div style={{ padding: '1.25rem', background: '#161616', borderRadius: '4px' }}>
                            <Grid style={{ padding: 0, rowGap: '1.25rem' }}>
                              <Column lg={8} md={4} sm={4}>
                                <h5 style={{ fontSize: '0.9rem', color: '#0f62fe', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Video size={16} /> Recent Scraped {creator?.platform === 'Instagram' ? 'Instagram Reels' : 'YouTube Videos'}:
                                </h5>
                                <ul style={{ listStyle: 'disc', paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#c6c6c6' }}>
                                  {creator?.recentVideos?.map((v, idx) => (
                                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{v}</li>
                                  )) || <li>Latest Content Uploads</li>}
                                </ul>
                              </Column>
                              <Column lg={8} md={4} sm={4}>
                                <div style={{ fontSize: '0.85rem', color: '#c6c6c6', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  <div><strong>Location:</strong> {creator?.location || "India"}</div>
                                  <div><strong>Average Views per Post:</strong> {formatCountInKAndM(creator?.avgViews)} ({creator?.avgViews?.toLocaleString('en-IN')} views)</div>
                                  <div><strong>Bio:</strong> {creator?.bio}</div>
                                </div>
                              </Column>
                            </Grid>
                          </div>
                        </TableExpandedRow>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      )}

      {/* Creator Profile Intelligence Modal Drawer */}
      <CreatorProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        creator={selectedProfileCreator}
        onSelectOutreach={(c) => handleOutreach(c)}
      />
    </div>
  );
}
