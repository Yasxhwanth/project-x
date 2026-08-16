import React, { useState, useEffect } from 'react';
import { 
  Tile, 
  Grid, 
  Column, 
  Tag, 
  Button, 
  InlineNotification, 
  Table, 
  TableHead, 
  TableRow, 
  TableHeader, 
  TableBody, 
  TableCell,
  TableContainer
} from '@carbon/react';
import { Currency, ChartBar, ShoppingBag, Renew, ArrowRight, Locked } from '@carbon/icons-react';

export default function AttributionDashboard({ campaignId = 'campaign_e2e_bangalore' }) {
  const [attribution, setAttribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState(null);

  useEffect(() => {
    fetchAttribution();
  }, [campaignId]);

  const fetchAttribution = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/attribution`);
      const data = await res.json();
      setAttribution(data);
    } catch (err) {
      console.error('Failed to load attribution data:', err);
    } finally {
      setLoading(false);
    }
  };

  const summary = attribution?.summary;
  const breakdown = attribution?.creatorBreakdown || [];
  const recentConversions = attribution?.recentConversions || [];

  const handleSimulateWebhook = async () => {
    setSimulatingWebhook(true);
    try {
      const orderNum = Math.floor(10000 + Math.random() * 90000);
      const val = Math.floor(2499 + Math.random() * 8500);
      const brandPrefix = (attribution?.brandName || 'ORD').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'D2C';
      const sampleCreator = breakdown.length > 0 ? breakdown[0] : null;

      const res = await fetch('/api/conversions/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: `#${brandPrefix}-${orderNum}`,
          orderValue: val,
          promoCode: attribution?.promoCode || 'PROMO20',
          utmMedium: sampleCreator ? `creator_${(sampleCreator.creatorName || 'partner').toLowerCase().replace(/\s+/g, '')}` : 'creator_partner',
          customerEmail: `customer${orderNum}@d2c.in`,
          storeProvider: 'SHOPIFY_WEBHOOK'
        })
      });

      const data = await res.json();
      if (data.success) {
        setWebhookMessage(`Simulated Shopify Order ${data.orderId || `#${brandPrefix}-${orderNum}`} (₹${val.toLocaleString('en-IN')}) attributed to ${data.creatorName || sampleCreator?.creatorName || 'Creator Partner'}!`);
        fetchAttribution();
        setTimeout(() => setWebhookMessage(null), 5000);
      }
    } catch (err) {
      console.error('Webhook simulation error:', err);
    } finally {
      setSimulatingWebhook(false);
    }
  };

  return (
    <div style={{ color: '#ffffff', width: '100%' }}>
      {/* ─── Hero Header ──────────────────────────────────────────────────── */}
      <div className="hero-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Revenue Attribution & Shopify ROAS</h1>
            <p>
              Direct economic attribution: Creator Content → Promo Code / UTM Click → Cart Checkout → Attributed GMV Revenue & Verified ROAS.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button size="sm" kind="tertiary" renderIcon={Renew} onClick={fetchAttribution}>
              Refresh
            </Button>
            <Button size="sm" kind="primary" renderIcon={ArrowRight} onClick={handleSimulateWebhook} disabled={simulatingWebhook}>
              {simulatingWebhook ? 'Triggering...' : 'Simulate Shopify Webhook Order'}
            </Button>
          </div>
        </div>
      </div>

      {webhookMessage && (
        <InlineNotification kind="success" title="Shopify Webhook Received" subtitle={webhookMessage} style={{ marginBottom: '1.25rem' }} />
      )}

      {/* ─── KPI Metric Cards ─────────────────────────────────────────────── */}
      <Grid fullWidth style={{ padding: 0, marginBottom: '1.5rem', rowGap: '1.25rem', columnGap: '1.25rem' }}>
        <Column lg={4} md={4} sm={4}>
          <Tile style={{ background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Attributed Campaign GMV</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#42be65', marginBottom: '0.25rem' }}>
              {summary?.totalGMV || '₹0'}
            </div>
            <Tag type="green" size="sm">Verified D2C Revenue</Tag>
          </Tile>
        </Column>

        <Column lg={4} md={4} sm={4}>
          <Tile style={{ background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Overall Campaign ROAS</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f1c21b', marginBottom: '0.25rem' }}>
              {summary?.overallRoas || '0.0x'}
            </div>
            <Tag type="yellow" size="sm">Revenue / Creator Spend</Tag>
          </Tile>
        </Column>

        <Column lg={4} md={4} sm={4}>
          <Tile style={{ background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Total Tracked Orders</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#4589ff', marginBottom: '0.25rem' }}>
              {summary?.totalOrders || 0} Orders
            </div>
            <Tag type="blue" size="sm">AOV: {summary?.averageOrderValue || '₹0'}</Tag>
          </Tile>
        </Column>

        <Column lg={4} md={4} sm={4}>
          <Tile style={{ background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Total Creator Spend</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#be95ff', marginBottom: '0.25rem' }}>
              {summary?.totalSpend || '₹0'}
            </div>
            <Tag type="purple" size="sm">Locked Creator Fees</Tag>
          </Tile>
        </Column>
      </Grid>

      {/* ─── Per-Creator ROAS Ledger ──────────────────────────────────────── */}
      <Tile style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <ChartBar size={20} style={{ color: '#0f62fe' }} />
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#edf5ff' }}>
            Per-Creator ROAS & Customer Acquisition Cost (CPA)
          </h4>
        </div>

        {breakdown.length === 0 ? (
          <p style={{ color: '#8d8d8d', margin: 0 }}>No creator conversions recorded yet.</p>
        ) : (
          <Table size="lg" useZebraStyles={false}>
            <TableHead>
              <TableRow>
                <TableHeader>Creator</TableHeader>
                <TableHeader>Platform</TableHeader>
                <TableHeader>Agreed Fee</TableHeader>
                <TableHeader>Orders</TableHeader>
                <TableHeader>Attributed GMV</TableHeader>
                <TableHeader>ROAS</TableHeader>
                <TableHeader>CPA</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {breakdown.map((c, i) => (
                <TableRow key={c.dealId}>
                  <TableCell style={{ fontWeight: 600, color: '#ffffff' }}>
                    {c.creatorName}
                    {i === 0 && <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: '#42be65', background: 'rgba(66, 190, 101, 0.15)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>TOP ROAS</span>}
                  </TableCell>
                  <TableCell style={{ color: '#a8a8a8' }}>{c.platform}</TableCell>
                  <TableCell style={{ color: '#c6c6c6' }}>{c.agreedFeeFormatted}</TableCell>
                  <TableCell style={{ color: '#4589ff', fontWeight: 700 }}>{c.orders}</TableCell>
                  <TableCell style={{ color: '#42be65', fontWeight: 700 }}>{c.gmvFormatted}</TableCell>
                  <TableCell>
                    <Tag type={c.roasRaw >= 4.0 ? 'green' : c.roasRaw >= 1.5 ? 'yellow' : 'red'} size="sm">
                      {c.roas}
                    </Tag>
                  </TableCell>
                  <TableCell style={{ color: '#c6c6c6' }}>{c.cpa}</TableCell>
                  <TableCell>
                    <Tag type={c.orders > 0 ? 'teal' : 'gray'} size="sm">
                      {c.orders > 0 ? 'Active Revenue' : 'Pending Sales'}
                    </Tag>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Tile>

      {/* ─── Recent Shopify Order Conversions Ledger ───────────────────────── */}
      <Tile style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Locked size={18} style={{ color: '#42be65' }} />
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#edf5ff' }}>
            Verified Webhook Order Stream
          </h4>
        </div>

        {recentConversions.length === 0 ? (
          <p style={{ color: '#8d8d8d', margin: 0 }}>No webhook conversions received yet.</p>
        ) : (
          <Table size="sm" useZebraStyles={false}>
            <TableHead>
              <TableRow>
                <TableHeader>Order ID</TableHeader>
                <TableHeader>Attributed Creator</TableHeader>
                <TableHeader>Order Value</TableHeader>
                <TableHeader>Promo Code</TableHeader>
                <TableHeader>UTM Medium</TableHeader>
                <TableHeader>Store Channel</TableHeader>
                <TableHeader>Timestamp</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentConversions.map(conv => (
                <TableRow key={conv.id}>
                  <TableCell style={{ color: '#4589ff', fontFamily: 'monospace', fontWeight: 600 }}>{conv.order_id}</TableCell>
                  <TableCell style={{ color: '#be95ff', fontWeight: 600 }}>{conv.creator_name}</TableCell>
                  <TableCell style={{ color: '#42be65', fontWeight: 700 }}>₹{conv.order_value?.toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    {conv.promo_code ? <Tag type="teal" size="sm">{conv.promo_code}</Tag> : <span style={{ color: '#8d8d8d' }}>N/A</span>}
                  </TableCell>
                  <TableCell style={{ color: '#a8a8a8', fontFamily: 'monospace', fontSize: '0.75rem' }}>{conv.utm_medium || 'direct'}</TableCell>
                  <TableCell>
                    <Tag type="cool-gray" size="sm">{conv.store_provider}</Tag>
                  </TableCell>
                  <TableCell style={{ color: '#8d8d8d', fontSize: '0.75rem' }}>{conv.converted_at}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Tile>
    </div>
  );
}
