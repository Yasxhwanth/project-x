import React, { useState, useEffect } from 'react';
import { Tile, Grid, Column, TextInput, Select, SelectItem, Button, Toggle, InlineNotification, Loading } from '@carbon/react';
import { Settings, Checkmark, Bot, Email } from '@carbon/icons-react';

export default function OrgEmailSettings() {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [aiTone, setAiTone] = useState('Professional Executive & Strategic');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [senderName, setSenderName] = useState('Project X Brand Team');
  const [senderEmail, setSenderEmail] = useState('collabs@projectx.ai');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/org/settings');
      if (res.ok) {
        const data = await res.json();
        setGeminiApiKey(data.geminiApiKey || '');
        setAiTone(data.aiTone || 'Professional Executive & Strategic');
        setAutoReplyEnabled(data.autoReplyEnabled ?? true);
        setSenderName(data.senderName || 'Project X Brand Team');
        setSenderEmail(data.senderEmail || 'collabs@projectx.ai');
        setSmtpHost(data.smtpHost || '');
        setSmtpUser(data.smtpUser || '');
        setSmtpPass(data.smtpPass || '');
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/org/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiApiKey,
          aiTone,
          autoReplyEnabled,
          senderName,
          senderEmail,
          smtpHost,
          smtpUser,
          smtpPass
        })
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <Loading description="Loading communication and model settings..." withOverlay={false} />
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* ─── Hero Header ──────────────────────────────────────────────────── */}
      <div className="hero-header" style={{ marginBottom: '1.25rem' }}>
        <h1>Outbound Communications & Model Governance</h1>
        <p>
          Configure enterprise SMTP relays, OAuth credentials, sender identity, and policy governance for autonomous creator communications.
        </p>
      </div>

      {savedSuccess && (
        <InlineNotification
          kind="success"
          title="Communication Settings Saved"
          subtitle="Outbound email dispatcher credentials and model policies have been updated."
          style={{ marginBottom: '1.25rem' }}
        />
      )}

      <form onSubmit={handleSave}>
        {/* Section 1: AI Provider & Agent Personality */}
        <Tile style={{ padding: '1.75rem', marginBottom: '1.5rem', background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6 }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0f62fe', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bot size={20} /> 1. Language Model Integration & Negotiation Tone
          </h4>

          <Grid fullWidth style={{ padding: 0, rowGap: '1.25rem', columnGap: '1.25rem' }}>
            <Column lg={8} md={4} sm={4}>
              <TextInput
                id="gemini-api-key-input"
                labelText="Google Gemini API Key"
                placeholder="AIzaSy... (Leave empty to use built-in engine)"
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                helperText="Custom API key for dedicated rate limits. Used for dynamic email formulation."
              />
            </Column>

            <Column lg={8} md={4} sm={4}>
              <Select
                id="ai-tone-select"
                labelText="Negotiator Personality & Tone"
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
              >
                <SelectItem value="Professional Executive & Strategic" text="Professional Executive & Strategic (Recommended)" />
                <SelectItem value="Formal Corporate" text="Formal Corporate & Precise" />
                <SelectItem value="Friendly & Youthful" text="Friendly & Youthful (D2C Brand Tone)" />
              </Select>
            </Column>

            <Column lg={16} md={8} sm={4}>
              <div style={{ marginTop: '0.5rem' }}>
                <Toggle
                  id="auto-reply-toggle"
                  labelText="Autonomous Auto-Response Engine"
                  labelA="Disabled (Human Review Required)"
                  labelB="Enabled (Autonomous 24/7 Dispatch)"
                  toggled={autoReplyEnabled}
                  onToggle={(val) => setAutoReplyEnabled(val)}
                />
              </div>
            </Column>
          </Grid>
        </Tile>

        {/* Section 2: Gmail / SMTP Email Dispatch Configuration */}
        <Tile style={{ padding: '1.75rem', marginBottom: '1.5rem', background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6 }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#42be65', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Email size={20} /> 2. Sender Identity & Outbound Relay Infrastructure
          </h4>

          <Grid fullWidth style={{ padding: 0, rowGap: '1.25rem', columnGap: '1.25rem' }}>
            <Column lg={8} md={4} sm={4}>
              <TextInput
                id="sender-name-input"
                labelText="Sender Display Name"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Brand Partnerships Team"
                helperText="Displays as the sender title in creator inboxes"
                required
              />
            </Column>

            <Column lg={8} md={4} sm={4}>
              <TextInput
                id="sender-email-input"
                labelText="Brand Contact Email Address"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="e.g. collabs@yourbrand.com"
                helperText="Official verified sender email address"
                required
              />
            </Column>

            <Column lg={6} md={4} sm={4}>
              <TextInput
                id="smtp-host-input"
                labelText="SMTP Server Host"
                placeholder="smtp.gmail.com"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
              />
            </Column>

            <Column lg={5} md={4} sm={4}>
              <TextInput
                id="smtp-user-input"
                labelText="SMTP Username / Service Account"
                placeholder="collabs@company.com"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
              />
            </Column>

            <Column lg={5} md={4} sm={4}>
              <TextInput
                id="smtp-pass-input"
                type="password"
                labelText="SMTP Password / App Key"
                placeholder="••••••••••••"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
              />
            </Column>
          </Grid>
        </Tile>

        <Button type="submit" kind="primary" renderIcon={Checkmark} disabled={loading}>
          {loading ? "Saving Settings..." : "Save Communication & Model Settings"}
        </Button>
      </form>
    </div>
  );
}
