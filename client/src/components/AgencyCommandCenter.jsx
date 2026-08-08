import React, { useEffect, useState } from 'react';
import { Button, Column, Grid, InlineNotification, Loading, Tag, Tile } from '@carbon/react';
import { ArrowRight, CheckmarkFilled, Enterprise, Renew, TaskComplete, WarningAlt } from '@carbon/icons-react';

const money = (amount = 0) => `₹${Number(amount).toLocaleString('en-IN')}`;

export default function AgencyCommandCenter({ onOpenCampaign }) {
  const [portfolio, setPortfolio] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    try {
      const response = await fetch('/api/agency/portfolio');
      if (!response.ok) throw new Error('Could not load client portfolio');
      setPortfolio(await response.json());
    } catch (err) { setError(err.message); }
  };

  useEffect(() => { load(); }, []);
  if (!portfolio && !error) return <Loading description="Loading client portfolio" withOverlay />;

  const clients = portfolio?.clients || [];
  const totals = clients.reduce((sum, client) => ({
    clients: sum.clients + 1,
    active: sum.active + (client.active_deals || 0),
    spend: sum.spend + (client.creator_spend || 0)
  }), { clients: 0, active: 0, spend: 0 });

  return <div style={{ color: '#fff', maxWidth: 1200, margin: '0 auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'start', marginBottom: '1.5rem' }}>
      <div><Tag type="purple" size="sm">Agency command centre</Tag><h1 style={{ fontSize: '1.75rem', fontWeight: 400, margin: '.75rem 0 .25rem' }}>Every client. Every creator. One operating view.</h1><p style={{ color: '#a8a8a8', margin: 0 }}>Use this workspace to spot delivery risk, prepare client updates, and open the campaign that needs attention.</p></div>
      <Button kind="tertiary" size="sm" renderIcon={Renew} onClick={load}>Refresh</Button>
    </div>
    {error && <InlineNotification kind="error" title="Portfolio unavailable" subtitle={error} style={{ marginBottom: '1rem' }} />}
    <Grid style={{ padding: 0, marginBottom: '1.5rem', rowGap: '1rem' }}>
      {[[`${totals.clients}`, 'Client campaigns', Enterprise], [`${totals.active}`, 'Active creator tasks', WarningAlt], [money(totals.spend), 'Committed creator spend', TaskComplete]].map(([value, label, Icon]) => <Column key={label} lg={5} md={4} sm={4}><Tile style={{ background: '#262626', padding: '1.25rem' }}><Icon size={20} style={{ color: '#78a9ff' }} /><div style={{ fontSize: '1.75rem', marginTop: '.75rem' }}>{value}</div><div style={{ color: '#a8a8a8', fontSize: '.875rem' }}>{label}</div></Tile></Column>)}
    </Grid>
    <h2 style={{ fontSize: '1.25rem', fontWeight: 400 }}>Client portfolio</h2>
    <Grid style={{ padding: 0, rowGap: '1rem', marginBottom: '2rem' }}>
      {clients.length === 0 && <Column lg={16}><Tile style={{ background: '#262626', padding: '2rem', color: '#a8a8a8' }}>Create a client campaign to begin building your portfolio.</Tile></Column>}
      {clients.map((client) => <Column key={client.campaign_id} lg={8} md={4} sm={4}><Tile style={{ background: '#262626', padding: '1.25rem', height: '100%', borderTop: '3px solid #8a3ffc' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem' }}><div><div style={{ color: '#a8a8a8', fontSize: '.75rem', textTransform: 'uppercase' }}>{client.client_name}</div><h3 style={{ margin: '.35rem 0 1rem' }}>{client.campaign_name}</h3></div><Tag type="green" size="sm">{client.campaign_status || 'ACTIVE'}</Tag></div><div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1rem', color: '#c6c6c6', fontSize: '.875rem' }}><span><strong style={{ color: '#fff' }}>{client.creator_count}</strong> creators</span><span><strong style={{ color: '#fff' }}>{client.active_deals}</strong> in progress</span><span><strong style={{ color: '#fff' }}>{client.approved_deliverables}</strong> approved</span></div><div style={{ borderTop: '1px solid #393939', paddingTop: '.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ color: '#a8a8a8', fontSize: '.8rem' }}>Committed: {money(client.creator_spend)}</span><Button size="sm" kind="ghost" renderIcon={ArrowRight} onClick={() => onOpenCampaign(client)}>Open campaign</Button></div></Tile></Column>)}
    </Grid>
    <Tile style={{ background: '#262626', padding: '1.25rem', borderLeft: '4px solid #42be65' }}><div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><CheckmarkFilled size={20} style={{ color: '#42be65' }} /><h2 style={{ fontSize: '1.125rem', fontWeight: 400, margin: 0 }}>Client closeout queue</h2></div><p style={{ color: '#a8a8a8', margin: '.5rem 0 1rem' }}>Ready-to-report creator work. This is the basis for a shareable client wrap report.</p>{(portfolio?.closeoutQueue || []).map((deal) => <div key={deal.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #393939', padding: '.75rem 0' }}><span><strong>{deal.creator_name}</strong><span style={{ color: '#a8a8a8' }}> · {deal.brand_name} / {deal.product_name}</span></span><Tag type={deal.status === 'PAID' ? 'green' : 'teal'} size="sm">{deal.status.replaceAll('_', ' ')}</Tag></div>)}</Tile>
  </div>;
}
