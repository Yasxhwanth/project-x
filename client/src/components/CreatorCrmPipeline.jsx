import React, { useState, useEffect } from 'react';
import { 
  Tile, 
  Tag, 
  Button, 
  Loading, 
  Grid, 
  Column,
  Select,
  SelectItem,
  TextInput,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell
} from '@carbon/react';
import { 
  Application, 
  Email, 
  Video, 
  Currency, 
  Checkmark, 
  ArrowRight, 
  User, 
  Time, 
  Chat, 
  Idea,
  Filter
} from '@carbon/icons-react';

export default function CreatorCrmPipeline({ campaignId, onSelectDealForNegotiation, onSelectDealForVideo, onSelectDealForPayout }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('stream');
  const [filterStage, setFilterStage] = useState('ALL');

  const pipelineStages = [
    { id: 'DISCOVERED', label: '1. Discovered', color: 'gray' },
    { id: 'SHORTLISTED', label: '2. Shortlisted', color: 'blue' },
    { id: 'INVITED', label: '3. Contacted', color: 'cyan' },
    { id: 'NEGOTIATING', label: '4. Negotiating', color: 'magenta' },
    { id: 'AGREED', label: '5. Accepted', color: 'purple' },
    { id: 'CONTENT_PENDING', label: '6. Content Pending', color: 'teal' },
    { id: 'VIDEO_SUBMITTED', label: '7. Posted & Verified', color: 'green' },
    { id: 'PAID', label: '8. Paid & Closed', color: 'warm-gray' }
  ];

  useEffect(() => {
    fetchDeals();
  }, [campaignId]);;

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const url = campaignId ? `/api/deals?campaignId=${campaignId}` : '/api/deals';
      const res = await fetch(url);
      const data = await res.json();
      setDeals(data || []);
    } catch (err) {
      console.error("Failed to load CRM deals", err);
    } finally {
      setLoading(false);
    }
  };

  const getStageDeals = (stageId) => {
    return deals.filter(d => {
      const s = (d.status || 'INVITED').toUpperCase();
      if (stageId === 'DISCOVERED') return s === 'DISCOVERED';
      if (stageId === 'SHORTLISTED') return s === 'SHORTLISTED';
      if (stageId === 'INVITED') return s === 'INVITED' || s === 'CONTACTED';
      if (stageId === 'NEGOTIATING') return s === 'NEGOTIATING' || s === 'COUNTER_OFFER';
      if (stageId === 'AGREED') return s === 'AGREED' || s === 'ACCEPTED';
      if (stageId === 'CONTENT_PENDING') return s === 'CONTENT_PENDING' || s === 'REVISION_REQUESTED';
      if (stageId === 'VIDEO_SUBMITTED') return s === 'VIDEO_SUBMITTED' || s === 'VERIFIED';
      if (stageId === 'PAID') return s === 'PAID';
      return false;
    });
  };

  const filteredDeals = filterStage === 'ALL' ? deals : getStageDeals(filterStage);

  const headers = [
    { key: 'creator', header: 'Creator & Channel' },
    { key: 'platform', header: 'Platform' },
    { key: 'status', header: 'Pipeline Stage' },
    { key: 'fee', header: 'Agreed Commercial Fee' },
    { key: 'agent', header: 'Assigned AI Agent' },
    { key: 'action', header: 'Action' }
  ];

  const tableRows = filteredDeals.map(d => ({
    id: d.id,
    creator: d.creatorName || 'Creator',
    platform: d.platform || 'INSTAGRAM',
    status: d.status || 'INVITED',
    fee: `₹${(d.currentAgreedPrice || d.offeredPrice || 0).toLocaleString('en-IN')}`,
    agent: d.status === 'PAID' ? 'Payment Agent' : d.status === 'VIDEO_SUBMITTED' ? 'Content QA Agent' : 'Director Agent',
    rawDeal: d
  }));

  return (
    <div className="creator-crm-pipeline-module">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '400', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Application size={24} style={{ color: '#0f62fe' }} /> Layer 2: Creator CRM & Autonomous Agentic Pipeline
          </h2>
          <p style={{ color: '#a8a8a8' }}>
            End-to-end autonomous relationship tracking governed by event-driven AI state machines.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button 
            size="sm" 
            kind={selectedView === 'stream' ? 'primary' : 'tertiary'}
            onClick={() => setSelectedView('stream')}
          >
            ⚡ Autonomous Agent Stream
          </Button>
          <Button 
            size="sm" 
            kind={selectedView === 'datatable' ? 'primary' : 'tertiary'}
            onClick={() => setSelectedView('datatable')}
          >
            📊 Carbon Data Table
          </Button>
          <Button 
            size="sm" 
            kind={selectedView === 'lifecycle' ? 'primary' : 'tertiary'}
            onClick={() => setSelectedView('lifecycle')}
          >
            🗺️ Stage Lifecycle Map
          </Button>
        </div>
      </div>

      {/* Stage Summary Header */}
      <Tile style={{ background: '#262626', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          <div 
            style={{ 
              flex: '1 0 110px', 
              background: filterStage === 'ALL' ? '#0f62fe' : '#161616', 
              padding: '0.75rem', 
              borderRadius: '4px',
              border: '1px solid #393939',
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={() => setFilterStage('ALL')}
          >
            <div style={{ fontSize: '0.75rem', color: '#a8a8a8', marginBottom: '0.25rem' }}>ALL CREATORS</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff' }}>{deals.length}</div>
          </div>
          {pipelineStages.map(stage => {
            const count = getStageDeals(stage.id).length;
            const isSelected = filterStage === stage.id;
            return (
              <div 
                key={stage.id}
                style={{ 
                  flex: '1 0 130px', 
                  background: isSelected ? '#0f62fe' : '#161616', 
                  padding: '0.75rem', 
                  borderRadius: '4px',
                  border: '1px solid #393939',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => setFilterStage(stage.id)}
              >
                <div style={{ fontSize: '0.75rem', color: isSelected ? '#ffffff' : '#a8a8a8', marginBottom: '0.25rem' }}>{stage.label}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff' }}>{count}</div>
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
        /* ⚡ VIEW 1: Autonomous AI Agent Workflow Stream (Modern Feed) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredDeals.length === 0 ? (
            <Tile style={{ background: '#262626', padding: '3rem', textAlign: 'center', color: '#a8a8a8' }}>
              No active creator deals found in this pipeline filter.
            </Tile>
          ) : (
            filteredDeals.map(deal => (
              <Tile key={deal.id} style={{ background: '#262626', padding: '1.25rem', borderLeft: `4px solid ${deal.status === 'PAID' ? '#42be65' : deal.status === 'NEGOTIATING' ? '#f1c21b' : '#0f62fe'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img 
                      src={deal.creatorAvatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80"} 
                      alt={deal.creatorName} 
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #393939' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h4 style={{ color: '#ffffff', fontSize: '1.1rem', margin: 0 }}>{deal.creatorName}</h4>
                        <Tag type="blue" size="sm">{deal.platform || 'INSTAGRAM'}</Tag>
                        <Tag type={deal.status === 'PAID' ? 'green' : deal.status === 'NEGOTIATING' ? 'yellow' : 'cyan'} size="sm">
                          {deal.status}
                        </Tag>
                      </div>
                      <div style={{ color: '#a8a8a8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {deal.creatorHandle} • {deal.creatorEmail || 'Verified Business Email'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#a8a8a8', fontSize: '0.8rem' }}>Agreed Sponsorship Fee</div>
                    <div style={{ color: '#f1c21b', fontSize: '1.25rem', fontWeight: '700' }}>
                      ₹{(deal.currentAgreedPrice || deal.offeredPrice || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Workflow Agent Status Bar */}
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #393939', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d0d0d0', fontSize: '0.85rem' }}>
                    <Idea size={16} style={{ color: '#0f62fe' }} />
                    <span>Assigned Agent: <strong>{deal.status === 'PAID' ? 'Payment Authorization Agent' : deal.status === 'VIDEO_SUBMITTED' ? 'Multimodal VideoDB QA Agent' : 'Autonomous Director Agent'}</strong></span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(deal.status === 'INVITED' || deal.status === 'NEGOTIATING') && (
                      <Button 
                        size="sm" 
                        kind="primary" 
                        renderIcon={Email}
                        onClick={() => onSelectDealForNegotiation && onSelectDealForNegotiation(deal)}
                      >
                        Launch AI Negotiation Studio
                      </Button>
                    )}
                    {(deal.status === 'AGREED' || deal.status === 'CONTENT_PENDING') && (
                      <Button 
                        size="sm" 
                        kind="tertiary" 
                        renderIcon={Video}
                        onClick={() => onSelectDealForVideo && onSelectDealForVideo(deal)}
                      >
                        Execute VideoDB Multimodal Verification
                      </Button>
                    )}
                    {deal.status === 'VIDEO_SUBMITTED' && (
                      <Button 
                        size="sm" 
                        kind="primary" 
                        renderIcon={Currency}
                        onClick={() => onSelectDealForPayout && onSelectDealForPayout(deal)}
                      >
                        Authorize Sec 194J TDS UPI Settlement
                      </Button>
                    )}
                    {deal.status === 'PAID' && (
                      <Tag type="green" size="md">✓ Payout Complete & Closed</Tag>
                    )}
                  </div>
                </div>
              </Tile>
            ))
          )}
        </div>
      ) : selectedView === 'datatable' ? (
        /* 📊 VIEW 2: Enterprise Carbon DataTable Matrix */
        <DataTable rows={tableRows} headers={headers}>
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer title="Creator Campaign Deal Matrix">
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader key={header.key} {...getHeaderProps({ header })}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const d = filteredDeals.find(item => item.id === row.id) || {};
                    return (
                      <TableRow key={row.id} {...getRowProps({ row })}>
                        <TableCell>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img src={d.creatorAvatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                            <div>
                              <div style={{ fontWeight: '600' }}>{row.cells[0].value}</div>
                              <div style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>{d.creatorHandle}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Tag type="blue" size="sm">{row.cells[1].value}</Tag></TableCell>
                        <TableCell><Tag type="cyan" size="sm">{row.cells[2].value}</Tag></TableCell>
                        <TableCell style={{ color: '#f1c21b', fontWeight: '600' }}>{row.cells[3].value}</TableCell>
                        <TableCell>{row.cells[4].value}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            kind="ghost" 
                            onClick={() => onSelectDealForNegotiation && onSelectDealForNegotiation(d)}
                          >
                            Open Deal Workspace
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
      ) : (
        /* 🗺️ VIEW 3: Interactive Stage Lifecycle Map */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {pipelineStages.map(stage => {
            const stageDeals = getStageDeals(stage.id);
            return (
              <Tile key={stage.id} style={{ background: '#262626', padding: '1.25rem', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ color: '#ffffff', margin: 0, fontSize: '1rem' }}>{stage.label}</h4>
                  <Tag type="blue" size="sm">{stageDeals.length} Deals</Tag>
                </div>
                {stageDeals.map(d => (
                  <div key={d.id} style={{ background: '#161616', padding: '0.75rem', borderRadius: '4px', marginBottom: '0.5rem', border: '1px solid #393939' }}>
                    <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.85rem' }}>{d.creatorName}</div>
                    <div style={{ color: '#f1c21b', fontSize: '0.8rem', marginTop: '0.25rem' }}>₹{(d.currentAgreedPrice || d.offeredPrice || 0).toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </Tile>
            );
          })}
        </div>
      )}
    </div>
  );
}
