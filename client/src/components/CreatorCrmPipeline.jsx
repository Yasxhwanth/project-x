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

export default function CreatorCrmPipeline({ onSelectDealForNegotiation, onSelectDealForVideo, onSelectDealForPayout }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('kanban'); // 'kanban' or 'list'
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
  }, []);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/deals');
      const data = await res.json();
      setDeals(data || []);
    } catch (err) {
      console.error("Failed to load CRM deals", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (dealId, newStatus) => {
    try {
      // Optimistic update
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, status: newStatus } : d));
    } catch (err) {
      console.error("Failed to update deal status", err);
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

  return (
    <div className="creator-crm-pipeline-module">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '400', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Application size={24} style={{ color: '#0f62fe' }} /> Layer 2: Creator CRM & 8-Stage Campaign Pipeline
          </h2>
          <p style={{ color: '#a8a8a8' }}>
            Full end-to-end relationship tracking from Sourcing → Negotiation → Deliverable Review → VideoDB Verification → Razorpay Payout.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button 
            size="sm" 
            kind={selectedView === 'kanban' ? 'primary' : 'tertiary'}
            onClick={() => setSelectedView('kanban')}
          >
            Kanban Board
          </Button>
          <Button 
            size="sm" 
            kind={selectedView === 'list' ? 'primary' : 'tertiary'}
            onClick={() => setSelectedView('list')}
          >
            List View
          </Button>
        </div>
      </div>

      {/* Stage Summary Header */}
      <Tile style={{ background: '#262626', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {pipelineStages.map(stage => {
            const count = getStageDeals(stage.id).length;
            return (
              <div 
                key={stage.id}
                style={{ 
                  flex: '1 0 130px', 
                  background: '#161616', 
                  padding: '0.75rem', 
                  borderRadius: '4px',
                  border: '1px solid #393939',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => setFilterStage(stage.id)}
              >
                <div style={{ fontSize: '0.75rem', color: '#a8a8a8', marginBottom: '0.25rem' }}>{stage.label}</div>
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
      ) : selectedView === 'kanban' ? (
        /* Kanban Horizontal Scroll Board */
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', minHeight: '520px' }}>
          {pipelineStages.map(stage => {
            const stageDeals = getStageDeals(stage.id);
            return (
              <div 
                key={stage.id} 
                style={{ 
                  flex: '0 0 280px', 
                  background: '#262626', 
                  borderRadius: '6px', 
                  padding: '1rem', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderTop: `4px solid ${stage.id === 'PAID' ? '#42be65' : stage.id === 'NEGOTIATING' ? '#f1c21b' : '#0f62fe'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#edf5ff' }}>{stage.label}</span>
                  <Tag type="blue" size="sm">{stageDeals.length}</Tag>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stageDeals.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#707070', fontSize: '0.8rem', border: '1px dashed #393939', borderRadius: '4px' }}>
                      No creators in this stage
                    </div>
                  ) : (
                    stageDeals.map(deal => (
                      <Tile 
                        key={deal.id} 
                        style={{ background: '#161616', padding: '0.9rem', borderRadius: '4px', border: '1px solid #393939' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <img 
                            src={deal.creatorAvatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80"} 
                            alt={deal.creatorName} 
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                              {deal.creatorName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>{deal.platform}</div>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: '#c6c6c6', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Agreed Fee:</span>
                          <strong style={{ color: '#f1c21b' }}>₹{(deal.currentAgreedPrice || deal.offeredPrice || 0).toLocaleString('en-IN')}</strong>
                        </div>

                        {/* Quick Action Button based on Stage */}
                        <div style={{ marginTop: '0.5rem' }}>
                          {(stage.id === 'INVITED' || stage.id === 'NEGOTIATING') && (
                            <Button 
                              size="sm" 
                              kind="primary" 
                              renderIcon={Email}
                              style={{ width: '100%', justifyContent: 'center' }}
                              onClick={() => onSelectDealForNegotiation && onSelectDealForNegotiation(deal)}
                            >
                              AI Negotiate
                            </Button>
                          )}

                          {(stage.id === 'AGREED' || stage.id === 'CONTENT_PENDING') && (
                            <Button 
                              size="sm" 
                              kind="tertiary" 
                              renderIcon={Video}
                              style={{ width: '100%', justifyContent: 'center' }}
                              onClick={() => onSelectDealForVideo && onSelectDealForVideo(deal)}
                            >
                              Verify VideoDB
                            </Button>
                          )}

                          {stage.id === 'VIDEO_SUBMITTED' && (
                            <Button 
                              size="sm" 
                              kind="primary" 
                              renderIcon={Currency}
                              style={{ width: '100%', justifyContent: 'center' }}
                              onClick={() => onSelectDealForPayout && onSelectDealForPayout(deal)}
                            >
                              Execute Payout
                            </Button>
                          )}

                          {stage.id === 'PAID' && (
                            <Tag type="green" size="md" style={{ width: '100%', textAlign: 'center' }}>
                              ✓ Payout Complete
                            </Tag>
                          )}
                        </div>
                      </Tile>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <Tile style={{ background: '#262626', padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ffffff', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #393939', textAlign: 'left', color: '#a8a8a8' }}>
                <th style={{ padding: '0.75rem' }}>Creator</th>
                <th style={{ padding: '0.75rem' }}>Platform</th>
                <th style={{ padding: '0.75rem' }}>Current Stage</th>
                <th style={{ padding: '0.75rem' }}>Agreed Fee</th>
                <th style={{ padding: '0.75rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {deals.map(deal => (
                <tr key={deal.id} style={{ borderBottom: '1px solid #161616' }}>
                  <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img src={deal.creatorAvatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                    <div>
                      <div>{deal.creatorName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>{deal.creatorEmail}</div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{deal.platform}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <Tag type="blue" size="sm">{deal.status}</Tag>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#f1c21b', fontWeight: '600' }}>
                    ₹{(deal.currentAgreedPrice || deal.offeredPrice || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <Button 
                      size="sm" 
                      kind="ghost" 
                      onClick={() => onSelectDealForNegotiation && onSelectDealForNegotiation(deal)}
                    >
                      Open Workspace
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tile>
      )}
    </div>
  );
}
