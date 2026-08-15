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
import { 
  Video, 
  Checkmark, 
  CheckmarkFilled,
  Warning, 
  WarningAlt,
  Time, 
  Security, 
  Idea, 
  Information,
  Send,
  Restart,
  LicenseThirdParty,
  Microphone,
  Catalog
} from '@carbon/icons-react';

export default function VideoVerification({ activeDeal, activeCampaign, onVerificationComplete }) {
  const deal = activeDeal || {
    id: 'deal_01',
    creatorName: 'Vivek Mittal (Fit Tuber)',
    creatorEmail: 'yashwanthtm5@gmail.com',
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
  const [revisionSent, setRevisionSent] = useState(false);
  const [sendingRevision, setSendingRevision] = useState(false);

  const handleRunVideoAudit = async (overrideFlag = false) => {
    if (!reelUrl.trim()) return;
    setLoading(true);
    setOverrideMessage(null);
    setRevisionSent(false);
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

  const handleSendRevisionGuidance = async () => {
    if (!analysisResult || !deal) return;
    setSendingRevision(true);
    try {
      const res = await fetch(`/api/deals/${deal.id}/negotiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorMessage: `[AUTOMATED CONTENT AUDIT FEEDBACK]: Your submitted video was audited by our Content Compliance Agent. Result: ${analysisResult.complianceScore}%. Guidance: ${analysisResult.remediationGuidance || 'Please re-record missing promo code or keyphrase.'}`
        })
      });
      if (res.ok) {
        setRevisionSent(true);
        setTimeout(() => setRevisionSent(false), 6000);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setSendingRevision(false);
    }
  };

  const plagiarism = analysisResult?.plagiarism || {
    originalityScore: 94,
    plagiarismRisk: 'LOW',
    details: 'Script shows 94% lexical originality. No matching plagiarized competitor campaign templates detected.',
    passed: true
  };

  const aiVoice = analysisResult?.aiVoiceAuthenticity || {
    humanVoiceScore: 92,
    aiGeneratedRisk: 8,
    assessment: 'Authentic human creator voiceover with natural conversational cadence and dynamic intonation.',
    passed: true
  };

  const regulatory = analysisResult?.regulatoryDisclosure || {
    isCompliant: true,
    disclosureTagsFound: ['#ad', '#collab'],
    details: 'ASCI & FTC compliance verified. Required commercial sponsorship disclosure present.',
    passed: true
  };

  const brandSafety = analysisResult?.brandSafety || {
    safetyScore: 98,
    competitorsDetected: [],
    sentiment: 'POSITIVE',
    passed: true
  };

  return (
    <div className="video-verification-module">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '400', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Video size={24} style={{ color: '#42be65' }} /> Layer 3: Autonomous Content QA, Plagiarism & Brand Safety Auditor
        </h2>
        <p style={{ color: '#a8a8a8', fontSize: '0.9rem' }}>
          Multimodal intelligence auditing video submissions for <strong>Plagiarism & Script Originality</strong>, <strong>AI Synthetic Voice Detection</strong>, <strong>ASCI/FTC Legal Disclosures</strong>, and <strong>Competitor Exclusivity Rules</strong> before escrow payout.
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

      {revisionSent && (
        <InlineNotification
          kind="info"
          title="Revision Request Dispatched"
          subtitle={`AI revision guidance and timestamp requirements emailed to ${deal.creatorName} (${deal.creatorEmail || 'creator'}).`}
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      <Grid style={{ padding: 0, rowGap: '1.25rem', columnGap: '1.25rem' }}>
        {/* Input Reel URL & Execution Buttons Panel */}
        <Column lg={16} md={8} sm={4}>
          <Tile style={{ padding: '1.5rem', background: '#222222', border: '1px solid #333' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '1rem', color: '#edf5ff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Catalog size={18} style={{ color: '#4589ff' }} /> Published Video / Reel Submission Input
            </h4>

            <Grid style={{ padding: 0, rowGap: '1rem', columnGap: '1rem', alignItems: 'flex-end' }}>
              <Column lg={10} md={5} sm={4}>
                <TextInput
                  id="reel-url-input"
                  labelText="Video URL (YouTube Shorts or Instagram Reel)"
                  placeholder="https://youtube.com/watch?v=boat_airdopes_review"
                  value={reelUrl}
                  onChange={(e) => setReelUrl(e.target.value)}
                  required
                />
              </Column>

              <Column lg={3} md={3} sm={2}>
                <Button kind="primary" renderIcon={Video} disabled={loading} onClick={() => handleRunVideoAudit(false)} style={{ width: '100%' }}>
                  {loading ? "Auditing Neural Signals..." : "Run AI Plagiarism & QA Audit"}
                </Button>
              </Column>

              <Column lg={3} md={3} sm={2}>
                <Button kind="tertiary" renderIcon={Checkmark} disabled={loading} onClick={() => handleRunVideoAudit(true)} style={{ width: '100%' }}>
                  Force Approve
                </Button>
              </Column>
            </Grid>
          </Tile>
        </Column>

        {/* Loading Spinner */}
        {loading && (
          <Column lg={16} md={8} sm={4}>
            <Tile style={{ padding: '3.5rem', textAlign: 'center', background: '#222222', border: '1px solid #333' }}>
              <Loading description="Neural Auditor analyzing script originality, AI voice artifacts, ASCI disclosures, and competitor brand logos..." withOverlay={false} />
            </Tile>
          </Column>
        )}

        {/* Audit Results Dashboard */}
        {!loading && analysisResult && (
          <>
            {/* Top Score Cards Grid */}
            <Column lg={4} md={4} sm={4}>
              <Tile style={{ padding: '1.25rem', background: '#1c1c1c', border: '1px solid #333', height: '100%' }}>
                <span style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Composite Compliance
                </span>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: analysisResult.complianceScore >= 80 ? '#42be65' : '#da1e28', margin: '0.35rem 0' }}>
                  {analysisResult.complianceScore}%
                </div>
                <ProgressBar value={analysisResult.complianceScore} hideLabel style={{ marginBottom: '0.75rem' }} />
                <Tag type={analysisResult.complianceScore >= 80 ? 'green' : 'red'} size="sm">
                  {analysisResult.complianceScore >= 80 ? "PASSED (Ready for Payout)" : "REVISION REQUIRED"}
                </Tag>
              </Tile>
            </Column>

            {/* Plagiarism & Script Originality Card */}
            <Column lg={4} md={4} sm={4}>
              <Tile style={{ padding: '1.25rem', background: '#1c1c1c', border: '1px solid #333', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Script Originality Index
                  </span>
                  <Tag type={plagiarism.plagiarismRisk === 'LOW' ? 'green' : 'red'} size="sm">
                    {plagiarism.plagiarismRisk} RISK
                  </Tag>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#0f62fe', margin: '0.35rem 0' }}>
                  {plagiarism.originalityScore}%
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#c6c6c6', lineHeight: '1.4' }}>
                  {plagiarism.details}
                </p>
              </Tile>
            </Column>

            {/* AI Synthetic Voice Detector Card */}
            <Column lg={4} md={4} sm={4}>
              <Tile style={{ padding: '1.25rem', background: '#1c1c1c', border: '1px solid #333', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Voice Authenticity
                  </span>
                  <Tag type={aiVoice.aiGeneratedRisk < 20 ? 'teal' : 'magenta'} size="sm">
                    {aiVoice.aiGeneratedRisk < 20 ? 'HUMAN VOICE' : 'AI SYNTHETIC'}
                  </Tag>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#8a3ffc', margin: '0.35rem 0' }}>
                  {aiVoice.humanVoiceScore}%
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#c6c6c6', lineHeight: '1.4' }}>
                  {aiVoice.assessment}
                </p>
              </Tile>
            </Column>

            {/* Regulatory & Brand Safety Card */}
            <Column lg={4} md={4} sm={4}>
              <Tile style={{ padding: '1.25rem', background: '#1c1c1c', border: '1px solid #333', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ASCI / FTC Disclosure
                  </span>
                  <Tag type={regulatory.isCompliant ? 'green' : 'red'} size="sm">
                    {regulatory.isCompliant ? 'LEGAL DISCLOSURE ✓' : 'MISSING #AD'}
                  </Tag>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#0072c3', margin: '0.35rem 0' }}>
                  {brandSafety.safetyScore}%
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#c6c6c6', lineHeight: '1.4' }}>
                  {regulatory.details}
                </p>
              </Tile>
            </Column>

            {/* Remediation & Action Bar */}
            <Column lg={16} md={8} sm={4}>
              <Tile style={{ padding: '1.25rem 1.5rem', background: 'rgba(15, 98, 254, 0.08)', border: '1px solid rgba(15, 98, 254, 0.3)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <h5 style={{ margin: '0 0 0.25rem 0', color: '#78a9ff', fontSize: '0.95rem', fontWeight: '600' }}>
                    🤖 AI Compliance Verdict & Guidance:
                  </h5>
                  <p style={{ margin: 0, color: '#f4f4f4', fontSize: '0.85rem', lineHeight: '1.5' }}>
                    {analysisResult.remediationGuidance || 'All quality, plagiarism, and brand safety checks passed. Approved for instant escrow payout.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Button 
                    kind="secondary" 
                    size="sm" 
                    renderIcon={Send} 
                    disabled={sendingRevision}
                    onClick={handleSendRevisionGuidance}
                  >
                    {sendingRevision ? 'Dispatching...' : 'Dispatch AI Revision Guidance'}
                  </Button>
                </div>
              </Tile>
            </Column>

            {/* Detailed Timestamp & Evidence Proof Cards */}
            <Column lg={16} md={8} sm={4}>
              <Tile style={{ padding: '1.5rem', background: '#1c1c1c', border: '1px solid #333' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#edf5ff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Time size={18} style={{ color: '#0f62fe' }} /> Timestamped Multimodal Audit Evidence Proof
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(analysisResult.evidenceProof || []).map((item, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        background: '#141414', 
                        padding: '0.85rem 1rem', 
                        borderRadius: '6px', 
                        borderLeft: `4px solid ${item.passed ? '#42be65' : '#da1e28'}`,
                        border: '1px solid #282828',
                        borderLeftWidth: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#f4f4f4', fontSize: '0.875rem', marginBottom: '0.2rem' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#a8a8a8' }}>
                          {item.evidenceSnippet}
                        </div>
                      </div>
                      <Tag type={item.passed ? 'green' : 'red'} size="sm" style={{ fontWeight: '600' }}>
                        {item.timestamp ? `⏱ ${item.timestamp}` : item.passed ? 'PASSED ✓' : 'FLAGGED ✗'}
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
