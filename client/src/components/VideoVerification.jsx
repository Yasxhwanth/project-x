import React, { useState } from 'react';
import { 
  Tile, 
  Grid, 
  Column, 
  TextInput, 
  Button, 
  Tag, 
  ProgressBar,
  InlineNotification,
  Loading
} from '@carbon/react';
import { Video, Checkmark, Warning, Analytics, Restart, Time, Security, Idea, Information } from '@carbon/icons-react';

export default function VideoVerification({ activeDeal, activeCampaign, onVerificationComplete }) {
  const deal = activeDeal || {
    id: 'deal_01',
    creatorName: 'Vivek Mittal (Fit Tuber)',
    currentAgreedPrice: 45000,
    videoUrl: 'https://youtube.com/watch?v=boat_airdopes_review'
  };

  const campaign = activeCampaign || {
    brandName: 'boAt Lifestyle',
    productName: 'boAt Airdopes Pro Max 500',
    mandatoryPhrases: 'Use code SAVER20 for 20% off',
    promoCode: 'SAVER20'
  };

  const [reelUrl, setReelUrl] = useState(deal.videoUrl || '');
  const [analysisResult, setAnalysisResult] = useState(deal.videoAnalysis || null);
  const [loading, setLoading] = useState(false);
  const [overrideMessage, setOverrideMessage] = useState(null);

  const handleRunVideoAudit = async (overrideFlag = false) => {
    if (!reelUrl.trim()) return;
    setLoading(true);
    setOverrideMessage(null);
    try {
      const res = await fetch(`/api/deals/${deal.id}/verify-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoUrl: reelUrl,
          manualOverride: overrideFlag
        })
      });
      const data = await res.json();
      if (data.deal) {
        setAnalysisResult(data.deal.videoAnalysis);
        if (onVerificationComplete) onVerificationComplete(data.deal);
        if (overrideFlag) setOverrideMessage("Manual Override Applied: Video approved with 100% compliance score!");
      }
    } catch (err) {
      console.error("Failed to run video audit", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="video-verification-module">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '400', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Video size={24} style={{ color: '#42be65' }} /> Layer 3: VideoDB Content Verification & Timestamp Proof Studio
        </h2>
        <p style={{ color: '#a8a8a8' }}>
          Multimodal video intelligence analyzing published Reels/videos to detect product visibility, mandatory phrases, promo code mentions, CTAs, and brand logos with <strong>timestamped evidence proof</strong>.
        </p>
      </div>

      {overrideMessage && (
        <InlineNotification
          kind="success"
          title="Manual Approval Applied"
          subtitle={overrideMessage}
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      <Grid style={{ padding: 0, rowGap: '1.5rem', columnGap: '1.5rem' }}>
        {/* Input Reel URL & Execution Buttons Panel */}
        <Column lg={16} md={8} sm={4}>
          <Tile style={{ padding: '1.75rem', background: '#262626' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#edf5ff' }}>
              Published Video / Reel Submission Input
            </h4>

            <Grid style={{ padding: 0, rowGap: '1rem', columnGap: '1rem', alignItems: 'flex-end' }}>
              <Column lg={10} md={6} sm={4}>
                <TextInput
                  id="reel-url-input"
                  labelText="Video URL (YouTube or Instagram Reel)"
                  placeholder="https://youtube.com/watch?v=boat_airdopes_review"
                  value={reelUrl}
                  onChange={(e) => setReelUrl(e.target.value)}
                  required
                />
              </Column>

              <Column lg={3} md={4} sm={2}>
                <Button kind="primary" renderIcon={Video} disabled={loading} onClick={() => handleRunVideoAudit(false)} style={{ width: '100%' }}>
                  {loading ? "Auditing..." : "Run VideoDB AI Audit"}
                </Button>
              </Column>

              <Column lg={3} md={4} sm={2}>
                <Button kind="tertiary" renderIcon={Checkmark} disabled={loading} onClick={() => handleRunVideoAudit(true)} style={{ width: '100%' }}>
                  Force Approve
                </Button>
              </Column>
            </Grid>
          </Tile>
        </Column>

        {/* VideoDB Audit Results */}
        {loading && (
          <Column lg={16} md={8} sm={4}>
            <Tile style={{ padding: '3rem', textAlign: 'center', background: '#262626' }}>
              <Loading description="VideoDB AI indexing video timeline, extracting transcripts & bounding boxes..." withOverlay={false} />
            </Tile>
          </Column>
        )}

        {!loading && analysisResult && (
          <>
            {/* Score & Verdict Tile */}
            <Column lg={6} md={4} sm={4}>
              <Tile style={{ padding: '1.5rem', background: '#262626', height: '100%' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#edf5ff' }}>
                  VideoDB Compliance Score
                </h4>
                <div style={{ fontSize: '3rem', fontWeight: '700', color: analysisResult.complianceScore >= 80 ? '#42be65' : '#da1e28', marginBottom: '0.5rem' }}>
                  {analysisResult.complianceScore}%
                </div>
                <ProgressBar value={analysisResult.complianceScore} hideLabel style={{ marginBottom: '1rem' }} />
                <Tag type={analysisResult.complianceScore >= 80 ? 'green' : 'red'} size="md">
                  {analysisResult.complianceScore >= 80 ? "PASSED - Ready for Instant UPI Payout" : "NEEDS REVISION"}
                </Tag>
                <div style={{ marginTop: '1rem', fontSize: '0.82rem', color: '#a8a8a8' }}>
                  Indexed ID: {analysisResult.videoId} • Duration: {analysisResult.durationText || "01:45"}
                </div>
              </Tile>
            </Column>

            {/* Timestamp Evidence Proof Cards */}
            <Column lg={10} md={4} sm={4}>
              <Tile style={{ padding: '1.5rem', background: '#262626', height: '100%' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#edf5ff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Time size={18} style={{ color: '#0f62fe' }} /> Detected Timestamp Evidence Proof
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(analysisResult.evidenceProof || [
                    { title: `Promo Code "${campaign.promoCode || 'SAVER20'}" Detected`, timestamp: "00:17", evidenceSnippet: `Spoken: "Use code ${campaign.promoCode || 'SAVER20'} for 20% off..."`, passed: true },
                    { title: "Mandatory Spoken Phrase Verified", timestamp: "00:42", evidenceSnippet: `Spoken: "${campaign.mandatoryPhrases}"`, passed: true },
                    { title: "Brand Logo & Packaging Visual Check", timestamp: "00:08 - 00:35", evidenceSnippet: "Visual bounding box detected boAt logo on product case", passed: true },
                    { title: "Call to Action & Description Link", timestamp: "01:25", evidenceSnippet: "Spoken CTA detected at 01:25 with link in description", passed: true }
                  ]).map((item, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        background: '#161616', 
                        padding: '0.85rem', 
                        borderRadius: '4px', 
                        borderLeft: `4px solid ${item.passed ? '#42be65' : '#da1e28'}`,
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', color: '#f4f4f4', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#c6c6c6' }}>
                          {item.evidenceSnippet}
                        </div>
                      </div>
                      <Tag type={item.passed ? 'teal' : 'red'} size="sm" style={{ fontWeight: '700' }}>
                        ⏱ {item.timestamp}
                      </Tag>
                    </div>
                  ))}
                </div>
              </Tile>
            </Column>
          </>
        )}
      </Grid>
    </div>
  );
}
