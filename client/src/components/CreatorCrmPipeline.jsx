import React, { useState, useEffect } from 'react';
import { 
  Tile, 
  Grid, 
  Column, 
  Tag, 
  Button, 
  ProgressBar, 
  DataTable, 
  Table, 
  TableHead, 
  TableRow, 
  TableHeader, 
  TableBody, 
  TableCell,
  TableContainer,
  Loading
} from '@carbon/react';
import { 
  Application, 
  Email, 
  Video, 
  Money, 
  CheckmarkFilled, 
  WarningAlt, 
  Time, 
  Renew, 
  UserFollow,
  ArrowRight,
  Idea
} from '@carbon/icons-react';

export default function CreatorCrmPipeline({ onSelectDealForNegotiation, onSelectDealForVerification, onSelectDealForPayout }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState('ALL');
  const [selectedView, setSelectedView] = useState('stream'); // 'stream' | 'datatable' | 'lifecycle'

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/deals');
      const data = await res.json();
      setDeals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch CRM deals", err);
    } finally {
      setLoading(false);
    }
  };

  const pipelineStages = [
    { id: 'INVITED', label: 'Outreach Sent', color: 'blue', tag: 'blue' },
    { id: 'NEGOTIATING', label: 'Negotiating Rate', color: 'yellow', tag: 'yellow' },
    { id: 'AGREED', label: 'Terms Locked', color: 'teal', tag: 'teal' },
    { id: 'VIDEO_SUBMITTED', label: 'Submitted for QA', color: 'purple', tag: 'purple' },
    { id: 'VERIFIED_PASSED', label: 'QA Approved', color: 'green', tag: 'green' },
    { id: 'PAID', label: 'Disbursed', color: 'green', tag: 'green' }
  ];

  const getStageDeals = (stageId) => deals.filter(d => d.status === stageId);
  const filteredDeals = filterStage === 'ALL' ? deals : deals.filter(d => d.status === filterStage);

  const tableHeaders = [
    { key: 'creator', header: 'Creator' },
    { key: 'platform', header: 'Platform' },
    { key: 'status', header: 'Pipeline Stage' },
    { key: 'fee', header: 'Agreed Fee (₹)' },
    { key: 'agent', header: 'Governing Agent' },
    { key: 'actions', header: 'Actions' }
  ];

  const tableRows = filteredDeals.map(d => ({
    id: d.id,
    creator: d.creatorName || 'Creator',
    platform: d.platform || 'INSTAGRAM',
    status: d.status || 'INVITED',
    fee: `₹${(d.currentAgreedPrice || d.offeredPrice || 0).toLocaleString('en-IN')}`,
    agent: d.status === 'PAID' ? 'Payment Settlement Agent' : d.status === 'VIDEO_SUBMITTED' ? 'Content QA Agent' : 'Negotiation Director',
    rawDeal: d
  }));

  return (
    <div style={{ width: '100%' }}>
      {/* ─── Hero Header ──────────────────────────────────────────────────── */}
      <div className="hero-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Creator CRM & Commercial Pipeline</h1>
            <p>
              End-to-end relationship management governed by event-driven policy state machines and milestone trackers.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button 
              size="sm" 
              kind={selectedView === 'stream' ? 'primary' : 'tertiary'}
              onClick={() => setSelectedView('stream')}
            >
              Execution Stream
            </Button>
            <Button 
              size="sm" 
              kind={selectedView === 'datatable' ? 'primary' : 'tertiary'}
              onClick={() => setSelectedView('datatable')}
            >
              Data Ledger
            </Button>
            <Button 
              size="sm" 
              kind={selectedView === 'lifecycle' ? 'primary' : 'tertiary'}
              onClick={() => setSelectedView('lifecycle')}
            >
              Lifecycle Map
            </Button>
          </div>
        </div>
      </div>

      {/* Stage Summary Header */}
      <Tile style={{ background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          <div 
            style={{ 
              flex: '1 0 110px', 
              background: filterStage === 'ALL' ? '#0f62fe' : '#111111', 
              padding: '0.75rem', 
              borderRadius: 4,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={() => setFilterStage('ALL')}
          >
            <div style={{ fontSize: '0.7rem', color: filterStage === 'ALL' ? '#ffffff' : '#8d8d8d', textTransform: 'uppercase', marginBottom: '0.25rem' }}>ALL CREATORS</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>{deals.length}</div>
          </div>
          {pipelineStages.map(stage => {
            const count = getStageDeals(stage.id).length;
            const isSelected = filterStage === stage.id;
            return (
              <div 
                key={stage.id}
                style={{ 
                  flex: '1 0 130px', 
                  background: isSelected ? '#0f62fe' : '#111111', 
                  padding: '0.75rem', 
                  borderRadius: 4,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => setFilterStage(stage.id)}
              >
                <div style={{ fontSize: '0.7rem', color: isSelected ? '#ffffff' : '#8d8d8d', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{stage.label}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>{count}</div>
              </div>
            );
          })}
        </div>
      </Tile>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <Loading description="Loading CRM pipeline deals..." withOverlay={false} />
        </div>
      ) : selectedView === 'stream' ? (
        /* VIEW 1: Autonomous Workflow Stream */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredDeals.length === 0 ? (
            <Tile style={{ background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '3rem', textAlign: 'center', color: '#8d8d8d' }}>
              No active creator deals found in this pipeline filter.
            </Tile>
          ) : (
            filteredDeals.map(deal => (
              <Tile key={deal.id} style={{ background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '1.25rem', borderLeft: `4px solid ${deal.status === 'PAID' ? '#42be65' : deal.status === 'NEGOTIATING' ? '#f1c21b' : '#0f62fe'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img 
                      src={deal.creatorAvatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80"} 
                      alt={deal.creatorName} 
                      style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.12)' }} 
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h4 style={{ color: '#ffffff', fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>{deal.creatorName}</h4>
                        <Tag type="blue" size="sm">{deal.platform || 'INSTAGRAM'}</Tag>
                        <Tag type={deal.status === 'PAID' ? 'green' : deal.status === 'NEGOTIATING' ? 'yellow' : 'cyan'} size="sm">
                          {deal.status}
                        </Tag>
                      </div>
                      <div style={{ color: '#8d8d8d', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        {deal.creatorHandle} • {deal.creatorEmail || 'Verified Business Email'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#8d8d8d', fontSize: '0.75rem', textTransform: 'uppercase' }}>Agreed Sponsorship Fee</div>
                    <div style={{ color: '#42be65', fontSize: '1.25rem', fontWeight: 700, fontFamily: 'monospace' }}>
                      ₹{(deal.currentAgreedPrice || deal.offeredPrice || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Workflow Agent Status Bar */}
                <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c6c6c6', fontSize: '0.8rem' }}>
                    <Idea size={16} style={{ color: '#0f62fe' }} />
                    <span>Governing Agent: <strong>{deal.status === 'PAID' ? 'Payment Settlement Agent' : deal.status === 'VIDEO_SUBMITTED' ? 'Content QA Agent' : 'Negotiation Director'}</strong></span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(deal.status === 'INVITED' || deal.status === 'NEGOTIATING') && (
                      <Button 
                        size="sm" 
                        kind="primary" 
                        renderIcon={Email}
                        onClick={() => onSelectDealForNegotiation && onSelectDealForNegotiation(deal)}
                      >
                        Negotiation Studio
                      </Button>
                    )}
                    {(deal.status === 'AGREED' || deal.status === 'CONTENT_PENDING') && (
                      <Button 
                        size="sm" 
                        kind="tertiary" 
                        renderIcon={Video}
                        onClick={() => onSelectDealForVerification && onSelectDealForVerification(deal)}
                      >
                        Verify Content
                      </Button>
                    )}
                    {(deal.status === 'VERIFIED_PASSED' || deal.status === 'PAYMENT_PENDING') && (
                      <Button 
                        size="sm" 
                        kind="primary" 
                        renderIcon={Money}
                        onClick={() => onSelectDealForPayout && onSelectDealForPayout(deal)}
                        style={{ background: '#24a148', borderColor: '#24a148' }}
                      >
                        Disburse Payout
                      </Button>
                    )}
                  </div>
                </div>
              </Tile>
            ))
          )}
        </div>
      ) : selectedView === 'datatable' ? (
        /* VIEW 2: Data Ledger */
        <Tile style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6 }}>
          <DataTable rows={tableRows} headers={tableHeaders}>
            {({ rows, headers, getHeaderProps, getRowProps }) => (
              <TableContainer>
                <Table size="md">
                  <TableHead>
                    <TableRow>
                      {headers.map(header => (
                        <TableHeader key={header.key} {...getHeaderProps({ header })}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map(row => {
                      const deal = tableRows.find(r => r.id === row.id)?.rawDeal;
                      return (
                        <TableRow key={row.id} {...getRowProps({ row })}>
                          <TableCell style={{ fontWeight: 600, color: '#ffffff' }}>
                            {deal?.creatorName}
                          </TableCell>
                          <TableCell>
                            <Tag type="blue" size="sm">{deal?.platform}</Tag>
                          </TableCell>
                          <TableCell>
                            <Tag type={deal?.status === 'PAID' ? 'green' : deal?.status === 'NEGOTIATING' ? 'yellow' : 'cyan'} size="sm">
                              {deal?.status}
                            </Tag>
                          </TableCell>
                          <TableCell style={{ color: '#42be65', fontWeight: 700, fontFamily: 'monospace' }}>
                            ₹{(deal?.currentAgreedPrice || deal?.offeredPrice || 0).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell style={{ color: '#8d8d8d' }}>
                            {deal?.status === 'PAID' ? 'Payment Agent' : deal?.status === 'VIDEO_SUBMITTED' ? 'QA Agent' : 'Negotiator'}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              kind="ghost" 
                              renderIcon={ArrowRight}
                              onClick={() => {
                                if (deal?.status === 'PAID' || deal?.status === 'VERIFIED_PASSED') onSelectDealForPayout && onSelectDealForPayout(deal);
                                else if (deal?.status === 'VIDEO_SUBMITTED') onSelectDealForVerification && onSelectDealForVerification(deal);
                                else onSelectDealForNegotiation && onSelectDealForNegotiation(deal);
                              }}
                            >
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
        </Tile>
      ) : (
        /* VIEW 3: Lifecycle Map */
        <Grid fullWidth style={{ padding: 0, rowGap: '1.25rem', columnGap: '1.25rem' }}>
          {pipelineStages.map(stage => {
            const stageDeals = getStageDeals(stage.id);
            return (
              <Column lg={5} md={4} sm={4} key={stage.id}>
                <Tile style={{ background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '1.25rem', minHeight: '380px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <h4 style={{ color: '#ffffff', margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{stage.label}</h4>
                    <Tag type={stage.tag} size="sm">{stageDeals.length}</Tag>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {stageDeals.length === 0 ? (
                      <div style={{ color: '#6f6f6f', fontSize: '0.8rem', textAlign: 'center', padding: '2rem 0' }}>
                        No creators in this stage.
                      </div>
                    ) : (
                      stageDeals.map(d => (
                        <div 
                          key={d.id} 
                          style={{ 
                            background: '#111111', 
                            padding: '0.85rem', 
                            borderRadius: 4, 
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            if (d.status === 'PAID' || d.status === 'VERIFIED_PASSED') onSelectDealForPayout && onSelectDealForPayout(d);
                            else if (d.status === 'VIDEO_SUBMITTED') onSelectDealForVerification && onSelectDealForVerification(d);
                            else onSelectDealForNegotiation && onSelectDealForNegotiation(d);
                          }}
                        >
                          <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>{d.creatorName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#8d8d8d', marginTop: '0.2rem' }}>{d.creatorHandle}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#42be65', fontWeight: 700, fontFamily: 'monospace' }}>
                              ₹{(d.currentAgreedPrice || d.offeredPrice || 0).toLocaleString('en-IN')}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#78a9ff' }}>Open &rarr;</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Tile>
              </Column>
            );
          })}
        </Grid>
      )}
    </div>
  );
}
