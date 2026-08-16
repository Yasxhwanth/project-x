import React, { useState, useEffect, useCallback } from 'react';
import {
  Button, Tag, InlineNotification, TextArea, Modal,
  SkeletonText, Tooltip, Tile
} from '@carbon/react';
import {
  CheckmarkFilled, CloseFilled, Warning, User, Currency,
  Email, ArrowRight, Renew, Time, Information, ChevronDown, ChevronUp
} from '@carbon/icons-react';

const TICKET_TYPE = (t) => {
  if (!t) return 'negotiation';
  if (t.actor_agent === 'Payment Agent' || t.reason?.toLowerCase().includes('payment')) return 'payment';
  if (t.reason?.toLowerCase().includes('outreach') || t.reason?.toLowerCase().includes('email')) return 'outreach';
  return 'negotiation';
};

const TYPE_META = {
  payment:     { label: 'Payment',     color: '#f1c21b', tagType: 'yellow',  icon: Currency,  description: 'Approve to release payment to creator.' },
  negotiation: { label: 'Negotiation', color: '#ff832b', tagType: 'orange',  icon: ArrowRight, description: 'Approve to lock in this rate and progress the deal.' },
  outreach:    { label: 'Outreach',    color: '#4589ff', tagType: 'blue',    icon: Email,      description: 'Approve to send the first outreach email.' },
};

const RISK_META = {
  LOW:      { tagType: 'green',    label: 'Low Risk' },
  MEDIUM:   { tagType: 'teal',     label: 'Med Risk' },
  HIGH:     { tagType: 'orange',   label: 'High Risk' },
  CRITICAL: { tagType: 'red',      label: 'Critical' },
};

const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const elapsed = (d) => {
  if (!d) return '';
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

function TicketCard({ ticket, actorName, onApprove, onReject, loading }) {
  const [expanded, setExpanded]       = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject]   = useState(false);
  const type    = TICKET_TYPE(ticket);
  const meta    = TYPE_META[type];
  const risk    = RISK_META[ticket.risk_level] || RISK_META.MEDIUM;
  const TypeIcon = meta.icon;

  const budgetUtilization = ticket.requested_rate && ticket.max_allowed_rate
    ? Math.min(100, Math.round((ticket.requested_rate / ticket.max_allowed_rate) * 100))
    : null;

  return (
    <div
      id={`ticket-${ticket.id}`}
      className="interactive-card"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderLeft: `4px solid ${meta.color}`,
        borderRadius: 6,
        marginBottom: '0.85rem',
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.85rem',
          padding: '1rem 1.25rem', cursor: 'pointer',
          background: expanded ? 'rgba(255, 255, 255, 0.04)' : 'transparent'
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: `${meta.color}15`, border: `1px solid ${meta.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <TypeIcon size={16} style={{ color: meta.color }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: '#f4f4f4', fontSize: '0.9rem' }}>
              {ticket.creator_name || 'Unknown Creator'}
            </span>
            <Tag type={meta.tagType} size="sm" style={{ margin: 0 }}>{meta.label}</Tag>
            <Tag type={risk.tagType} size="sm" style={{ margin: 0 }}>{risk.label}</Tag>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#a8a8a8', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ticket.reason}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {ticket.requested_rate && (
            <div style={{ fontWeight: 700, color: '#42be65', fontSize: '1rem', fontFamily: 'monospace' }}>
              {fmt(ticket.requested_rate)}
            </div>
          )}
          <div style={{ fontSize: '0.72rem', color: '#8d8d8d', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
            <Time size={10} />
            {elapsed(ticket.created_at)}
          </div>
        </div>

        <div style={{ color: '#8d8d8d', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 1.25rem 1rem 1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          {budgetUtilization !== null && (
            <div style={{ margin: '0.875rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a8a8a8', marginBottom: '0.3rem' }}>
                <span>Budget utilization</span>
                <span style={{ color: budgetUtilization > 90 ? '#ff832b' : '#42be65', fontWeight: 600 }}>
                  {fmt(ticket.requested_rate)} / {fmt(ticket.max_allowed_rate)} ({budgetUtilization}%)
                </span>
              </div>
              <div style={{ height: 6, background: '#111111', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${budgetUtilization}%`,
                  background: budgetUtilization > 90 ? '#ff832b' : budgetUtilization > 70 ? '#f1c21b' : '#42be65',
                  transition: 'width 0.4s'
                }} />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
            <div style={{ background: '#111111', borderRadius: 4, padding: '0.5rem 0.75rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ color: '#8d8d8d', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>AGENT</div>
              <div style={{ color: '#c6c6c6' }}>{ticket.actor_agent || '—'}</div>
            </div>
            <div style={{ background: '#111111', borderRadius: 4, padding: '0.5rem 0.75rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ color: '#8d8d8d', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>TICKET ID</div>
              <div style={{ color: '#c6c6c6', fontFamily: 'monospace', fontSize: '0.75rem' }}>{ticket.id}</div>
            </div>
            <div style={{ background: '#111111', borderRadius: 4, padding: '0.5rem 0.75rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ color: '#8d8d8d', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>CREATED</div>
              <div style={{ color: '#c6c6c6' }}>{fmtDate(ticket.created_at)}</div>
            </div>
            <div style={{ background: '#111111', borderRadius: 4, padding: '0.5rem 0.75rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ color: '#8d8d8d', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>DEAL ID</div>
              <div style={{ color: '#c6c6c6', fontFamily: 'monospace', fontSize: '0.75rem' }}>{ticket.deal_id || '—'}</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 98, 254, 0.08)', border: '1px solid rgba(15, 98, 254, 0.3)', borderRadius: 4,
            padding: '0.625rem 0.875rem', marginBottom: '1rem',
            display: 'flex', gap: '0.5rem', alignItems: 'flex-start'
          }}>
            <Information size={14} style={{ color: '#4589ff', flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: '0.8rem', color: '#a8a8a8', lineHeight: 1.5 }}>
              <strong style={{ color: '#78a9ff' }}>If you approve: </strong>{meta.description}
              <br />
              <strong style={{ color: '#ff8389' }}>If you reject: </strong>Deal moves to NEGOTIATION_FAILED. Creator is not contacted further.
            </div>
          </div>

          {showReject && (
            <div style={{ marginBottom: '0.875rem' }}>
              <TextArea
                id={`reject-reason-${ticket.id}`}
                labelText="Rejection reason (optional)"
                placeholder="e.g. Rate too high, try counter-offering ₹30,000..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
                style={{ fontSize: '0.8rem' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button
              id={`approve-btn-${ticket.id}`}
              size="sm"
              kind="primary"
              renderIcon={CheckmarkFilled}
              disabled={loading}
              onClick={() => onApprove(ticket.id, ticket.creator_name)}
              style={{ background: '#24a148', borderColor: '#24a148' }}
            >
              Approve
            </Button>

            {!showReject ? (
              <Button
                id={`show-reject-btn-${ticket.id}`}
                size="sm"
                kind="tertiary"
                renderIcon={CloseFilled}
                onClick={() => setShowReject(true)}
              >
                Reject
              </Button>
            ) : (
              <>
                <Button
                  id={`confirm-reject-btn-${ticket.id}`}
                  size="sm"
                  kind="danger"
                  renderIcon={CloseFilled}
                  disabled={loading}
                  onClick={() => onReject(ticket.id, rejectReason)}
                >
                  Confirm Reject
                </Button>
                <Button
                  id={`cancel-reject-btn-${ticket.id}`}
                  size="sm"
                  kind="ghost"
                  onClick={() => { setShowReject(false); setRejectReason(''); }}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HITLApprovalInbox({ session, compact = false }) {
  const [tickets, setTickets]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]             = useState(null);
  const [filter, setFilter]           = useState('PENDING');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const actorName = session?.user?.name || 'Brand Admin';

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/escalations');
      if (!res.ok) return;
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[HITL Inbox] fetch failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchTickets, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchTickets]);

  const showToast = (msg, kind = 'success') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 4000);
  };

  const handleApprove = async (ticketId, creatorName) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/agents/escalations/${ticketId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorName })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchTickets();
      } else {
        showToast(data.error || 'Approval failed', 'error');
      }
    } catch (e) {
      showToast('Network error during approval', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (ticketId, reason) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/agents/escalations/${ticketId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, actorName })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'warning');
        fetchTickets();
      } else {
        showToast(data.error || 'Rejection failed', 'error');
      }
    } catch (e) {
      showToast('Network error during rejection', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = tickets.filter(t => filter === 'ALL' ? true : t.status === filter);
  const pending  = tickets.filter(t => t.status === 'PENDING');

  if (compact) {
    if (loading) return <SkeletonText paragraph lines={3} />;
    if (pending.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#8d8d8d', fontSize: '0.85rem' }}>
          No pending approvals
        </div>
      );
    }
    return (
      <div>
        {pending.slice(0, 3).map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.625rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f4f4f4' }}>{t.creator_name}</div>
              <div style={{ fontSize: '0.75rem', color: '#a8a8a8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.reason}</div>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#42be65', fontFamily: 'monospace', flexShrink: 0 }}>{fmt(t.requested_rate)}</div>
            <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
              <Button size="sm" kind="primary" renderIcon={CheckmarkFilled}
                onClick={() => handleApprove(t.id, t.creator_name)}
                style={{ background: '#24a148', borderColor: '#24a148', minWidth: 0, paddingRight: '0.75rem' }}>
                OK
              </Button>
              <Button size="sm" kind="ghost" renderIcon={CloseFilled}
                onClick={() => handleReject(t.id, '')}
                style={{ minWidth: 0, paddingRight: '0.75rem' }}>
                No
              </Button>
            </div>
          </div>
        ))}
        {pending.length > 3 && (
          <div style={{ fontSize: '0.75rem', color: '#8d8d8d', padding: '0.5rem 0 0', textAlign: 'center' }}>
            +{pending.length - 3} more in Approval Inbox
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
      {/* Page Hero Header */}
      <div className="hero-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Approval Inbox</h1>
            <p>
              Autonomous agents pause and escalate when rates or risks exceed safety thresholds. You govern every decision.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Button
              kind="ghost"
              size="sm"
              renderIcon={Renew}
              onClick={fetchTickets}
              style={{ color: '#78a9ff' }}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {toast && (
        <InlineNotification
          kind={toast.kind}
          title={toast.kind === 'success' ? 'Decision Recorded' : 'Action Required'}
          subtitle={toast.msg}
          onCloseButtonClick={() => setToast(null)}
          style={{ marginBottom: '1.25rem' }}
        />
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(f => (
          <Button
            key={f}
            size="sm"
            kind={filter === f ? 'primary' : 'ghost'}
            onClick={() => setFilter(f)}
            style={{ fontSize: '0.75rem', height: '2rem' }}
          >
            {f === 'PENDING' ? `Pending (${pending.length})` : f}
          </Button>
        ))}
      </div>

      {/* Ticket List */}
      {loading ? (
        <Tile style={{ background: 'var(--color-surface)', padding: '3rem', textAlign: 'center', borderRadius: 6 }}>
          <SkeletonText paragraph lines={4} />
        </Tile>
      ) : filtered.length === 0 ? (
        <Tile style={{ background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '3.5rem 2rem', textAlign: 'center', borderRadius: 6 }}>
          <CheckmarkFilled size={36} style={{ color: '#42be65', marginBottom: '0.75rem' }} />
          <h3 style={{ color: '#f4f4f4', fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
            {filter === 'PENDING' ? 'Zero pending escalations' : 'No tickets in this view'}
          </h3>
          <p style={{ color: '#8d8d8d', margin: 0, fontSize: '0.875rem' }}>
            All autonomous negotiation and payout agents are operating safely within approved guardrails.
          </p>
        </Tile>
      ) : (
        filtered.map(t => (
          <TicketCard
            key={t.id}
            ticket={t}
            actorName={actorName}
            onApprove={handleApprove}
            onReject={handleReject}
            loading={actionLoading}
          />
        ))
      )}
    </div>
  );
}
