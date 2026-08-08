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
import { Enterprise, Settings, Save, Checkmark, User, Bot, Video, Search } from '@carbon/icons-react';

export default function OrgSettingsModal({ isOpen, onClose, session, onUpdateSession }) {
  const [activeTab, setActiveTab] = useState(0);

  // Email & AI Settings State
  const [senderName, setSenderName] = useState('boAt Marketing AI');
  const [senderEmail, setSenderEmail] = useState('collabs@boat-lifestyle.com');
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
    if (isOpen) {
      fetchSettings();
      fetchIntegrations();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/organization/email-settings');
      if (res.ok) {
        const data = await res.json();
        setSenderName(data.senderName || 'boAt Marketing AI');
        setSenderEmail(data.senderEmail || 'collabs@boat-lifestyle.com');
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
      const res = await fetch(`/api/organization/integrations?organizationId=${session?.organization?.id || 'org_boat_01'}`);
      if (res.ok) setIntegrations((await res.json()).connected || {});
    } catch (err) { console.error('Failed to load integration status', err); }
  };

  const handleSaveIntegrations = async (e) => {
    e.preventDefault(); setSavingIntegrations(true); setErrorMsg(null);
    try {
      const res = await fetch('/api/organization/integrations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organizationId: session?.organization?.id || 'org_boat_01', keys: integrationKeys }) });
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

      if (!res.ok) throw new Error("Failed to save organization settings");

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      modalHeading="Organization Profile & AI Settings"
      passiveModal
      onRequestClose={onClose}
      size="md"
      aria-label="Organization Settings Modal"
    >
      <div style={{ padding: '0.5rem 0' }}>
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
                    {session?.organization?.name || 'boAt Lifestyle'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <Tag type="blue" size="sm">Plan: {session?.organization?.plan || 'Enterprise'}</Tag>
                    <Tag type="teal" size="sm">ID: {session?.organization?.id || 'org_boat_01'}</Tag>
                  </div>
                </div>

                <div style={{ background: '#262626', padding: '1.25rem', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#a8a8a8', marginBottom: '0.5rem' }}>Current Authenticated User</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img 
                      src={session?.user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'} 
                      alt="User Avatar"
                      style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid #0f62fe' }}
                    />
                    <div>
                      <div style={{ fontWeight: '600', color: '#ffffff' }}>{session?.user?.name || 'Aman Gupta'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#c6c6c6' }}>{session?.user?.email || 'admin@boat-lifestyle.com'}</div>
                      <Tag type="purple" size="sm" style={{ marginTop: '0.25rem' }}>{session?.user?.role || 'Brand Admin'}</Tag>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#262626', padding: '1rem', borderRadius: '4px', border: '1px solid #393939' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#edf5ff', marginBottom: '0.25rem' }}>Organization API Key</div>
                  <div style={{ fontFamily: 'monospace', background: '#161616', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem', color: '#4589ff' }}>
                    {session?.organization?.apiKey || 'cc_live_boat_lifestyle_98a1x'}
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
                    labelText="SMTP Server Host"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                  />
                  <TextInput
                    id="modal-smtp-port"
                    labelText="Port"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <TextInput
                    id="modal-smtp-user"
                    labelText="SMTP Username / Email"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                  />
                  <TextInput
                    id="modal-smtp-pass"
                    labelText="SMTP / App Password"
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                  />
                </div>

                <Select
                  id="modal-ai-tone"
                  labelText="AI Agent Tone & Persona"
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                >
                  <SelectItem value="Hinglish Casual & Professional" text="Hinglish Casual & Professional (Recommended for India)" />
                  <SelectItem value="Formal Corporate English" text="Formal Corporate English" />
                  <SelectItem value="High-Energy Creator Hype" text="High-Energy Creator Hype" />
                </Select>

                <Toggle
                  id="modal-auto-reply"
                  labelText="Enable Autonomous AI Auto-Reply to Creator Emails"
                  toggled={autoReplyEnabled}
                  onToggle={(t) => setAutoReplyEnabled(t)}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <Button type="submit" renderIcon={Save} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Organization Settings'}
                  </Button>
                </div>
              </form>
            </TabPanel>
            <TabPanel>
              <form onSubmit={handleSaveIntegrations} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {saveSuccess && <InlineNotification kind="success" title="Integration keys saved" subtitle="Keys are stored server-side and are never shown again in this workspace." />}
                {errorMsg && <InlineNotification kind="error" title="Could not save keys" subtitle={errorMsg} />}
                <p style={{ color: '#a8a8a8', margin: 0, fontSize: '.875rem' }}>Paste a replacement key only when changing it. Connected keys are masked and cannot be read back from the browser.</p>
                <IntegrationField id="gemini" label="Google Gemini" helper="AI negotiator and campaign strategy" placeholder="AIzaSy..." icon={Bot} connected={integrations.gemini} value={integrationKeys.gemini} onChange={(value) => setIntegrationKeys({ ...integrationKeys, gemini: value })} />
                <IntegrationField id="openai" label="OpenAI" helper="Fallback provider for the AI negotiator" placeholder="sk-..." icon={Bot} connected={integrations.openai} value={integrationKeys.openai} onChange={(value) => setIntegrationKeys({ ...integrationKeys, openai: value })} />
                <IntegrationField id="videodb" label="VideoDB" helper="Video verification, spoken phrase and promo-code checks" placeholder="VideoDB API key" icon={Video} connected={integrations.videodb} value={integrationKeys.videodb} onChange={(value) => setIntegrationKeys({ ...integrationKeys, videodb: value })} />
                <IntegrationField id="rapidapi" label="RapidAPI" helper="Live creator discovery providers" placeholder="RapidAPI key" icon={Search} connected={integrations.rapidapi} value={integrationKeys.rapidapi} onChange={(value) => setIntegrationKeys({ ...integrationKeys, rapidapi: value })} />
                <IntegrationField id="youtube" label="YouTube Data API" helper="Live YouTube creator and channel search" placeholder="AIzaSy..." icon={Search} connected={integrations.youtube} value={integrationKeys.youtube} onChange={(value) => setIntegrationKeys({ ...integrationKeys, youtube: value })} />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button type="submit" renderIcon={Save} disabled={savingIntegrations}>{savingIntegrations ? 'Saving...' : 'Save integration keys'}</Button></div>
              </form>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </Modal>
  );
}

function IntegrationField({ id, label, helper, placeholder, icon: Icon, connected, value, onChange }) {
  return <div style={{ background: '#262626', border: '1px solid #393939', padding: '1rem', borderRadius: '4px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}><span style={{ display: 'flex', gap: '.5rem', alignItems: 'center', fontWeight: 600 }}><Icon size={18} style={{ color: '#78a9ff' }} />{label}</span><Tag type={connected ? 'green' : 'gray'} size="sm">{connected ? 'Connected' : 'Not connected'}</Tag></div>
    <TextInput id={`integration-${id}`} labelText={helper} hideLabel placeholder={placeholder} type="password" value={value} onChange={(e) => onChange(e.target.value)} />
  </div>;
}
