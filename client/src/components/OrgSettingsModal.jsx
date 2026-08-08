import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  TextInput, 
  Button, 
  InlineNotification, 
  Tabs, 
  TabList, 
  Tab, 
  TabPanels, 
  TabPanel, 
  Toggle, 
  Select, 
  SelectItem,
  Tag
} from '@carbon/react';
import { Enterprise, Settings, Save, Checkmark, User, Bot, Video, Search, Locked } from '@carbon/icons-react';

export default function OrgSettingsModal({ isOpen, onClose, session, onOpenAuthModal }) {
  const [activeTab, setActiveTab] = useState(0);

  // Email & AI Settings State
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [aiTone, setAiTone] = useState('Hinglish Casual & Professional');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [integrationKeys, setIntegrationKeys] = useState({ gemini: '', openai: '', videodb: '', rapidapi: '', youtube: '' });
  const [integrations, setIntegrations] = useState({});
  const [savingIntegrations, setSavingIntegrations] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen && session?.user) {
      fetchSettings();
      fetchIntegrations();
    }
  }, [isOpen, session]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('cc_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch('/api/organization/email-settings', { headers });
      if (res.ok) {
        const data = await res.json();
        setSenderName(data.senderName || `${session?.organization?.name || 'Brand'} AI`);
        setSenderEmail(data.senderEmail || session?.user?.email || '');
        setGeminiApiKey('');
        setSmtpHost(data.smtpHost || 'smtp.gmail.com');
        setSmtpPort(data.smtpPort || 587);
        setSmtpUser(data.smtpUser || '');
        setAiTone(data.aiTone || 'Hinglish Casual & Professional');
        setAutoReplyEnabled(data.autoReplyEnabled ?? true);
      }
    } catch (err) {
      console.error("Failed to load org settings", err);
    }
  };

  const fetchIntegrations = async () => {
    try {
      const token = localStorage.getItem('cc_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`/api/organization/integrations?organizationId=${session?.organization?.id}`, { headers });
      if (res.ok) setIntegrations((await res.json()).connected || {});
    } catch (err) { console.error('Failed to load integration status', err); }
  };

  const handleSaveIntegrations = async (e) => {
    e.preventDefault(); setSavingIntegrations(true); setErrorMsg(null);
    try {
      const token = localStorage.getItem('cc_token');
      const res = await fetch('/api/organization/integrations', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
        body: JSON.stringify({ organizationId: session?.organization?.id, keys: integrationKeys }) 
      });
      if (!res.ok) throw new Error('Failed to save integration keys');
      setIntegrationKeys({ gemini: '', openai: '', videodb: '', rapidapi: '', youtube: '' });
      await fetchIntegrations(); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) { setErrorMsg(err.message); } finally { setSavingIntegrations(false); }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem('cc_token');
      const res = await fetch('/api/organization/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

      if (!res.ok) throw new Error("Failed to save organization settings");

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isGuest = !session?.user;

  return (
    <Modal
      open={isOpen}
      modalHeading="Organization Profile & AI Settings"
      passiveModal
      onRequestClose={onClose}
      size="md"
      aria-label="Organization Settings Modal"
    >
      <div style={{ padding: '0.5rem 0', color: '#ffffff' }}>
        {isGuest ? (
          <div style={{ background: '#262626', padding: '2rem', borderRadius: '4px', textAlign: 'center', border: '1px solid #393939' }}>
            <Locked size={48} style={{ color: '#f1c21b', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '0.5rem' }}>Authentication Required</h3>
            <p style={{ color: '#c6c6c6', maxWidth: '450px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem', lineHeight: '1.5' }}>
              You are currently viewing as an unauthenticated guest. Please sign in or register your workspace to manage organization profiles, API keys, and SMTP settings.
            </p>
            <Button 
              kind="primary" 
              onClick={() => {
                onClose();
                if (onOpenAuthModal) onOpenAuthModal();
              }}
            >
              Sign In / Verify with OTP
            </Button>
          </div>
        ) : (
          <Tabs selectedIndex={activeTab} onChange={({ selectedIndex }) => setActiveTab(selectedIndex)}>
            <TabList aria-label="Org Tabs" style={{ marginBottom: '1.5rem' }}>
              <Tab renderIcon={Enterprise}>Organization Profile & Workspace</Tab>
              <Tab renderIcon={Settings}>Email & delivery</Tab>
              <Tab renderIcon={Bot}>AI & data services</Tab>
            </TabList>

            <TabPanels>
              {/* Tab 1: Organization & Account Details */}
              <TabPanel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ background: '#262626', padding: '1.25rem', borderRadius: '4px', borderLeft: '4px solid #0f62fe' }}>
                    <div style={{ fontSize: '0.8rem', color: '#a8a8a8', textTransform: 'uppercase' }}>Active Workspace</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ffffff', marginTop: '0.25rem' }}>
                      {session?.organization?.name}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <Tag type="blue" size="sm">Plan: {session?.organization?.plan || 'Standard'}</Tag>
                      <Tag type="teal" size="sm">ID: {session?.organization?.id}</Tag>
                    </div>
                  </div>

                  <div style={{ background: '#262626', padding: '1.25rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#a8a8a8', marginBottom: '0.5rem' }}>Current Authenticated User</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img 
                        src={session.user.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'} 
                        alt="User Avatar"
                        style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid #0f62fe' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: '#ffffff' }}>{session.user.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#c6c6c6' }}>{session.user.email}</div>
                        <Tag type="purple" size="sm" style={{ marginTop: '0.25rem' }}>{session.user.role}</Tag>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#262626', padding: '1rem', borderRadius: '4px', border: '1px solid #393939' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#edf5ff', marginBottom: '0.25rem' }}>Organization API Key</div>
                    <div style={{ fontFamily: 'monospace', background: '#161616', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem', color: '#4589ff' }}>
                      {session?.organization?.apiKey || 'No key generated'}
                    </div>
                  </div>
                </div>
              </TabPanel>

              {/* Tab 2: Email & SMTP Config */}
              <TabPanel>
                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {saveSuccess && (
                    <InlineNotification kind="success" title="Settings Saved!" subtitle="Email & AI configuration updated successfully." />
                  )}
                  {errorMsg && (
                    <InlineNotification kind="error" title="Error" subtitle={errorMsg} />
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <TextInput
                      id="modal-sender-name"
                      labelText="Sender Name (AI Outbound)"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      required
                    />
                    <TextInput
                      id="modal-sender-email"
                      labelText="Sender Email Address"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <TextInput
                      id="modal-smtp-host"
                      labelText="SMTP Host"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                    />
                    <TextInput
                      id="modal-smtp-port"
                      labelText="SMTP Port"
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <TextInput
                      id="modal-smtp-user"
                      labelText="SMTP Username"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                    />
                    <TextInput
                      id="modal-smtp-pass"
                      labelText="SMTP Password / App Secret"
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                    />
                  </div>

                  <Select
                    id="modal-ai-tone"
                    labelText="AI Negotiation Persona & Tone"
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                  >
                    <SelectItem value="Hinglish Casual & Professional" text="Hinglish Casual & Professional (Recommended for India)" />
                    <SelectItem value="Formal Corporate" text="Formal Corporate" />
                    <SelectItem value="Creator Friendly & Friendly" text="Creator Friendly & Warm" />
                  </Select>

                  <Toggle
                    id="modal-auto-reply"
                    labelText="Automated AI Response Dispatcher"
                    labelA="Disabled"
                    labelB="Enabled"
                    toggled={autoReplyEnabled}
                    onToggle={(checked) => setAutoReplyEnabled(checked)}
                  />

                  <Button type="submit" renderIcon={Save} disabled={saving}>
                    {saving ? 'Saving Settings...' : 'Save Configuration'}
                  </Button>
                </form>
              </TabPanel>

              {/* Tab 3: API Keys & Integrations */}
              <TabPanel>
                <form onSubmit={handleSaveIntegrations} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ fontSize: '0.9rem', color: '#c6c6c6' }}>
                    Enter real external API keys below to unlock live Google Gemini AI, VideoDB indexing, and YouTube/Instagram live scrapers.
                  </div>

                  <TextInput
                    id="modal-key-gemini"
                    labelText="Google Gemini API Key"
                    type="password"
                    value={integrationKeys.gemini}
                    onChange={(e) => setIntegrationKeys({ ...integrationKeys, gemini: e.target.value })}
                    helperText={integrations.gemini ? "✅ Currently Connected" : "Used for Hinglish negotiation & portfolio generation"}
                  />

                  <TextInput
                    id="modal-key-videodb"
                    labelText="VideoDB API Key"
                    type="password"
                    value={integrationKeys.videodb}
                    onChange={(e) => setIntegrationKeys({ ...integrationKeys, videodb: e.target.value })}
                    helperText={integrations.videodb ? "✅ Currently Connected" : "Used for multimodal video transcript search"}
                  />

                  <TextInput
                    id="modal-key-youtube"
                    labelText="YouTube Data API Key"
                    type="password"
                    value={integrationKeys.youtube}
                    onChange={(e) => setIntegrationKeys({ ...integrationKeys, youtube: e.target.value })}
                    helperText={integrations.youtube ? "✅ Currently Connected" : "Used for live channel metrics search"}
                  />

                  <Button type="submit" renderIcon={Checkmark} disabled={savingIntegrations}>
                    {savingIntegrations ? 'Saving Keys...' : 'Save API Keys'}
                  </Button>
                </form>
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </div>
    </Modal>
  );
}
