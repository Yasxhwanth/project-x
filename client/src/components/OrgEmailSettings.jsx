import React, { useState, useEffect } from 'react';
import { 
  Tile, 
  Grid, 
  Column, 
  TextInput, 
  Select, 
  SelectItem, 
  Button, 
  Toggle, 
  InlineNotification,
  Loading,
  Tag
} from '@carbon/react';
import { Email, Settings, Checkmark, Enterprise, Locked, Bot } from '@carbon/icons-react';

export default function OrgEmailSettings() {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [aiTone, setAiTone] = useState('Professional Executive & Strategic');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/organization/email-settings');
      const data = await res.json();
      if (data) {
        setSenderName(data.senderName || '');
        setSenderEmail(data.senderEmail || '');
        setGeminiApiKey(data.geminiApiKey || '');
        setSmtpHost(data.smtpHost || 'smtp.gmail.com');
        setSmtpPort(data.smtpPort || 587);
        setSmtpUser(data.smtpUser || '');
        setAiTone(data.aiTone || 'Professional Executive & Strategic');
        setAutoReplyEnabled(data.autoReplyEnabled ?? true);
      }
    } catch (err) {
      console.error("Failed to load email settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);
    try {
      const res = await fetch('/api/organization/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName,
          senderEmail,
          geminiApiKey,
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPass,
          aiTone,
          autoReplyEnabled
        })
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save email settings", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <Loading description="Loading Organization Settings..." withOverlay={false} />
      </div>
    );
  }

  return (
    <div className="org-email-settings-module">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '400', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={24} style={{ color: '#0f62fe' }} /> Organization Email & AI Agent Settings
        </h2>
        <p style={{ color: '#a8a8a8' }}>
          Configure your Brand Organization's Google Gemini API key, Gmail/SMTP email integration, sender identity, and autonomous AI negotiation tone.
        </p>
      </div>

      {savedSuccess && (
        <InlineNotification
          kind="success"
          title="Organization Email Settings Saved!"
          subtitle="Your brand email dispatcher & AI negotiator configuration have been updated."
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      <form onSubmit={handleSave}>
        {/* Section 1: AI Provider & Agent Personality */}
        <Tile style={{ padding: '1.75rem', marginBottom: '1.5rem', background: '#262626' }}>
          <h4 style={{ fontSize: '1.1rem', color: '#0f62fe', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bot size={20} /> 1. Google Gemini AI Agent & Negotiation Tone
          </h4>

          <Grid style={{ padding: 0, rowGap: '1.25rem', columnGap: '1.25rem' }}>
            <Column lg={8} md={4} sm={4}>
              <TextInput
                id="gemini-api-key-input"
                labelText="Google Gemini API Key (Free at aistudio.google.com)"
                placeholder="AIzaSy... (Leave empty to use built-in negotiator)"
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                helperText="Get your free key from Google AI Studio. Used for real-time dynamic email generation."
              />
            </Column>

            <Column lg={8} md={4} sm={4}>
              <Select
                id="ai-tone-select"
                labelText="AI Negotiator Personality & Tone"
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
              >
                <SelectItem value="Professional Executive & Strategic" text="Professional Executive & Strategic (Recommended)" />
                <SelectItem value="Formal Corporate" text="Formal Corporate & Precise" />
                <SelectItem value="Friendly & Youthful" text="Friendly & Youthful (College Brand Tone)" />
              </Select>
            </Column>

            <Column lg={16} md={8} sm={4}>
              <div style={{ marginTop: '0.5rem' }}>
                <Toggle
                  id="auto-reply-toggle"
                  labelText="Autonomous AI Auto-Reply Mode"
                  labelA="Disabled (Manual Review)"
                  labelB="Enabled (Autonomous 24/7 AI Responding)"
                  toggled={autoReplyEnabled}
                  onToggle={(val) => setAutoReplyEnabled(val)}
                />
              </div>
            </Column>
          </Grid>
        </Tile>

        {/* Section 2: Gmail / SMTP Email Dispatch Configuration */}
        <Tile style={{ padding: '1.75rem', marginBottom: '2rem', background: '#262626' }}>
          <h4 style={{ fontSize: '1.1rem', color: '#42be65', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Email size={20} /> 2. Brand Sender Identity & Gmail / SMTP Integration
          </h4>

          <Grid style={{ padding: 0, rowGap: '1.25rem', columnGap: '1.25rem' }}>
            <Column lg={8} md={4} sm={4}>
              <TextInput
                id="sender-name-input"
                labelText="Brand Sender Name"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Acme Marketing Team"
                helperText="Displays in creator's inbox as the sender title"
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
                helperText="Official outreach email address"
                required
              />
            </Column>

            <Column lg={6} md={4} sm={4}>
              <TextInput
                id="smtp-host-input"
                labelText="SMTP Host Server"
                placeholder="smtp.gmail.com"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
              />
            </Column>

            <Column lg={5} md={4} sm={4}>
              <TextInput
                id="smtp-user-input"
                labelText="SMTP Username / Gmail ID"
                placeholder="collabs@company.com"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
              />
            </Column>

            <Column lg={5} md={4} sm={4}>
              <TextInput
                id="smtp-pass-input"
                type="password"
                labelText="SMTP Password / Gmail App Password"
                placeholder="••••••••••••"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
              />
            </Column>
          </Grid>
        </Tile>

        <Button type="submit" kind="primary" renderIcon={Checkmark} disabled={loading}>
          {loading ? "Saving Settings..." : "Save Organization Email & AI Settings"}
        </Button>
      </form>
    </div>
  );
}
