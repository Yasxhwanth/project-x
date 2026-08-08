import React from 'react';
import { 
  Modal, 
  Tag, 
  Tile, 
  Grid, 
  Column,
  Button
} from '@carbon/react';
import { 
  User, 
  Checkmark, 
  Idea, 
  Analytics, 
  Video, 
  Currency, 
  LogoInstagram, 
  LogoYoutube, 
  Warning, 
  Security, 
  Star,
  Send
} from '@carbon/icons-react';

export default function CreatorProfileModal({ isOpen, onClose, creator, onSelectOutreach }) {
  if (!creator) return null;

  // Fallback defaults for deep intelligence fields if absent
  const demographics = creator.demographics || {
    age: "18–24 (62%), 25–34 (30%)",
    gender: "76% Male, 24% Female",
    geography: creator.location?.includes("Bangalore") ? "Bangalore (42%), Mysuru (15%), Hyderabad (18%)" : `${creator.location || 'India'} (40%), Tier-1 Cities (35%)`,
    topCities: creator.location?.includes("Bangalore") ? ["Bangalore", "Mysuru", "Hyderabad"] : ["Mumbai", "Delhi", "Bangalore"]
  };

  const contentIntelligence = creator.contentIntelligence || {
    topics: creator.niche === 'Fitness & Health' ? ["Gym Skits", "Nutrition", "Home Workouts"] : [creator.niche, "Product Reviews", "Lifestyle"],
    style: creator.platform === 'Instagram' ? "Funny Reels & Skits" : "Hands-on Reviews & Vlogs",
    tone: "Energetic, Authentic & Relatable",
    visualAesthetic: "Clean studio lighting & outdoor pacing",
    postingFrequency: "4 Posts / week"
  };

  const brandHistory = creator.brandHistory || {
    previousBrands: creator.niche === 'Tech & Gadgets' ? ["Samsung India", "Realme", "boAt"] : ["Cult.fit", "Myntra", "Nykaa"],
    competingBrandsIn90Days: [],
    sponsoredFrequency: "1 in 5 posts"
  };

  const aiScores = creator.aiScores || {
    brandFit: 95,
    audienceFit: 92,
    brandSafety: 98,
    authenticity: 94,
    predictedFitScore: 95
  };

  const matchRationale = creator.aiMatchRationale || `${aiScores.brandFit}% Brand Fit • ${demographics.gender} Audience • No competitor campaigns in 90 days • Fits Budget`;

  return (
    <Modal
      open={isOpen}
      modalHeading=""
      primaryButtonText="Launch AI Outreach & Pitch"
      secondaryButtonText="Close Profile"
      onRequestClose={onClose}
      onRequestSubmit={() => {
        onClose();
        if (onSelectOutreach) onSelectOutreach(creator);
      }}
      size="lg"
      style={{ background: '#161616' }}
    >
      <div className="creator-profile-modal-content" style={{ padding: '0.5rem 0' }}>
        {/* Header Profile Summary */}
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #393939', paddingBottom: '1.25rem' }}>
          <img 
            src={creator.avatar} 
            alt={creator.name} 
            style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0f62fe' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#f4f4f4', margin: 0 }}>
                {creator.name}
              </h3>
              <Tag type={creator.platform === 'YouTube' ? 'red' : 'purple'} size="md">
                {creator.platform === 'YouTube' ? <LogoYoutube size={14} style={{ marginRight: '4px' }} /> : <LogoInstagram size={14} style={{ marginRight: '4px' }} />}
                {creator.platform}
              </Tag>
              <Tag type="blue" size="md">
                {creator.niche}
              </Tag>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#c6c6c6', display: 'flex', gap: '1rem' }}>
              <span><strong>Handle:</strong> {creator.handle}</span>
              <span><strong>Location:</strong> {creator.location || creator.city || 'India'}</span>
              <span><strong>Reach:</strong> {creator.reachText || `${creator.followersRaw?.toLocaleString('en-IN')} Followers`}</span>
            </div>
          </div>
        </div>

        {/* AI Assessment Bar */}
        <Tile style={{ background: '#262626', marginBottom: '1.5rem', padding: '1.25rem', borderLeft: '4px solid #0f62fe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#edf5ff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Idea size={18} style={{ color: '#0f62fe' }} /> AI Creator Intelligence Assessment
            </span>
            <Tag type="teal" size="md" style={{ fontWeight: '700' }}>
              Overall Match: {aiScores.predictedFitScore}% / 100
            </Tag>
          </div>

          <Grid style={{ padding: 0, rowGap: '0.75rem', columnGap: '1rem' }}>
            <Column lg={4} md={2} sm={2}>
              <div style={{ background: '#161616', padding: '0.75rem', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>Brand Fit</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#42be65' }}>{aiScores.brandFit}%</div>
              </div>
            </Column>
            <Column lg={4} md={2} sm={2}>
              <div style={{ background: '#161616', padding: '0.75rem', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>Audience Overlap</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#42be65' }}>{aiScores.audienceFit}%</div>
              </div>
            </Column>
            <Column lg={4} md={2} sm={2}>
              <div style={{ background: '#161616', padding: '0.75rem', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>Brand Safety</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f62fe' }}>{aiScores.brandSafety}%</div>
              </div>
            </Column>
            <Column lg={4} md={2} sm={2}>
              <div style={{ background: '#161616', padding: '0.75rem', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>Authenticity</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f1c21b' }}>{aiScores.authenticity}%</div>
              </div>
            </Column>
          </Grid>

          <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: '#c6c6c6', fontStyle: 'italic', background: '#161616', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
            <strong>Matching Rationale:</strong> {matchRationale}
          </div>
        </Tile>

        {/* 4 Detailed Intelligence Grid Columns */}
        <Grid style={{ padding: 0, rowGap: '1.25rem', columnGap: '1.25rem' }}>
          {/* Column 1: Audience Demographics */}
          <Column lg={8} md={4} sm={4}>
            <Tile style={{ background: '#262626', height: '100%', padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f62fe', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} /> Audience Demographics
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#e0e0e0' }}>
                <div><strong>Age Split:</strong> {demographics.age}</div>
                <div><strong>Gender Ratio:</strong> {demographics.gender}</div>
                <div><strong>Geographic Concentration:</strong> {demographics.geography}</div>
                <div><strong>Primary Languages:</strong> {creator.language || 'Hindi & English'}</div>
              </div>
            </Tile>
          </Column>

          {/* Column 2: Content Intelligence */}
          <Column lg={8} md={4} sm={4}>
            <Tile style={{ background: '#262626', height: '100%', padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#42be65', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Video size={16} /> Content Profile & Style
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#e0e0e0' }}>
                <div><strong>Format & Style:</strong> {contentIntelligence.style}</div>
                <div><strong>Tone of Voice:</strong> {contentIntelligence.tone}</div>
                <div><strong>Visual Aesthetic:</strong> {contentIntelligence.visualAesthetic}</div>
                <div><strong>Posting Cadence:</strong> {contentIntelligence.postingFrequency}</div>
                <div>
                  <strong>Core Topics:</strong>{' '}
                  {contentIntelligence.topics?.map((t, idx) => (
                    <Tag key={idx} type="cool-gray" size="sm" style={{ margin: '2px' }}>{t}</Tag>
                  ))}
                </div>
              </div>
            </Tile>
          </Column>

          {/* Column 3: Brand & Competitor History */}
          <Column lg={8} md={4} sm={4}>
            <Tile style={{ background: '#262626', height: '100%', padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#f1c21b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Security size={16} /> Brand History & Exclusivity
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#e0e0e0' }}>
                <div><strong>Past Brand Deals:</strong> {brandHistory.previousBrands.join(', ')}</div>
                <div>
                  <strong>Competitor Campaigns (Last 90 Days):</strong>{' '}
                  {brandHistory.competingBrandsIn90Days.length === 0 ? (
                    <Tag type="green" size="sm">✓ Clean (No Conflict)</Tag>
                  ) : (
                    <Tag type="red" size="sm">{brandHistory.competingBrandsIn90Days.join(', ')}</Tag>
                  )}
                </div>
                <div><strong>Sponsored Content Frequency:</strong> {brandHistory.sponsoredFrequency}</div>
                <div><strong>Historical Performance:</strong> High organic view completion rate (94%)</div>
              </div>
            </Tile>
          </Column>

          {/* Column 4: Commercials & Contact */}
          <Column lg={8} md={4} sm={4}>
            <Tile style={{ background: '#262626', height: '100%', padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#9ef0f0', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Currency size={16} /> Commercials & Contact
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#e0e0e0' }}>
                <div><strong>Estimated Post Rate:</strong> <span style={{ color: '#f1c21b', fontWeight: '700' }}>₹{creator.pricePerPost?.toLocaleString('en-IN')}</span></div>
                <div><strong>Negotiable Minimum Fee:</strong> ₹{creator.minPrice?.toLocaleString('en-IN')}</div>
                <div><strong>Contact Email:</strong> {creator.email}</div>
                <div><strong>Avg Views / Post:</strong> {creator.avgViews?.toLocaleString('en-IN')} views</div>
              </div>
            </Tile>
          </Column>
        </Grid>
      </div>
    </Modal>
  );
}
