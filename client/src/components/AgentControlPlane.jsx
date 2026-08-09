import React, { useState, useEffect } from 'react';
import { Tile, Grid, Column, Tag, Button, InlineNotification, Table, TableHead, TableRow, TableHeader, TableBody, TableCell, Tabs, TabList, Tab, TabPanels, TabPanel } from '@carbon/react';
import { Security, Checkmark, Warning, Renew, UserFollow, Locked, Idea, ArrowRight, Debug, Play } from '@carbon/icons-react';

const RISK_COLORS = { LOW: '#42be65', MEDIUM: '#f1c21b', HIGH: '#ff832b', CRITICAL: '#da1e28' };
const RISK_TAG_TYPE = { LOW: 'green', MEDIUM: 'yellow', HIGH: 'orange', CRITICAL: 'red' };

export default function AgentControlPlane() {
  const [activeTab, setActiveTab] = useState(0);
  const [escalations, setEscalations]   = useState([]);
  const [agentRuns, setAgentRuns]       = useState([]);
  const [deadLetters, setDeadLetters]   = useState([]);
  const [evalResults, setEvalResults]   = useState(null);
  const [auditLogs, setAuditLogs]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [approvalMessage, setApprovalMessage] = useState(null);
  const [runningEval, setRunningEval]   = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [escRes, runsRes, dlqRes, auditRes] = await Promise.all([
        fetch('/api/agents/escalations'),
        fetch('/api/agents/runs'),
        fetch('/api/agents/dead-letter'),
        fetch('/api/agents/audit-logs')
      ]);
      setEscalations(await escRes.json()   || []);
      setAgentRuns(await runsRes.json()    || []);
      setDeadLetters(await dlqRes.json()   || []);
      setAuditLogs(await auditRes.json()   || []);
    } catch (err) {
      console.error('Failed to load control plane data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEscalation = async (ticketId, creatorName) => {
    try {
      const res = await fetch(`/api/agents/escalations/${ticketId}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setApprovalMessage(`Approved for ${creatorName}. State machine transitioned to AGREED.`);
        fetchAll();
        setTimeout(() => setApprovalMessage(null), 4000);
      }
    } catch (err) { console.error('Approval failed', err); }
  };

  const handleDlqRetry = async (id) => {
    await fetch(`/api/agents/dead-letter/${id}/retry`, { method: 'POST' });
    fetchAll();
  };

  const handleRunEval = async () => {
    setRunningEval(true);
    try {
      const res = await fetch('/api/agents/eval-suite');
      const data = await res.json();
      setEvalResults(data);
    } catch (err) { console.error('Eval suite error', err); }
    finally { setRunningEval(false); }
  };

  const tabs = [
    { label: 'Human Approval Queue', icon: UserFollow },
    { label: 'Agent Runs',           icon: Debug },
    { label: 'Dead Letter Queue',    icon: Warning },
    { label: 'Eval Suite',           icon: Play }
  ];

  const pendingEscalations = escalations.filter(e => e.status === 'PENDING');

  return (
    <div className="agent-control-plane-module">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '400', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Security size={22} style={{ color: '#0f62fe' }} /> Agent Control Plane & Governance
          </h2>
          <p style={{ color: '#a8a8a8', fontSize: '0.875rem' }}>
            Deterministic execution oversight — LLM proposes, policy engine authorizes, state machine enforces.
          </p>
        </div>
        <Button size="sm" kind="tertiary" renderIcon={Renew} onClick={fetchAll}>Refresh</Button>
      </div>

      {approvalMessage && (
        <InlineNotification kind="success" title="Approved" subtitle={approvalMessage} style={{ marginBottom: '1.5rem' }} />
      )}

      {/* Status KPIs */}
      <Grid style={{ padding: 0, marginBottom: '1.5rem', rowGap: '1rem', columnGap: '1rem' }}>
        {[
          { label: 'Active Agents', value: '8 Guarded', tag: 'blue', tagLabel: 'Autonomous Execution' },
          { label: 'Pending Approvals', value: `${pendingEscalations.length} Tickets`, tag: pendingEscalations.length > 0 ? 'yellow' : 'green', tagLabel: pendingEscalations.length > 0 ? 'Action Required' : 'Queue Clear' },
          { label: 'Agent Runs', value: `${agentRuns.length} Recorded`, tag: 'teal', tagLabel: 'Full Traceability' },
          { label: 'Dead Letter Queue', value: `${deadLetters.filter(d => d.status === 'PENDING').length} Pending`, tag: deadLetters.filter(d => d.status === 'PENDING').length > 0 ? 'orange' : 'green', tagLabel: deadLetters.filter(d => d.status === 'PENDING').length > 0 ? 'Needs Attention' : 'All Clear' }
        ].map((kpi, i) => (
          <Column key={i} lg={4} md={4} sm={4}>
            <Tile style={{ background: '#262626', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#a8a8a8', marginBottom: '0.25rem' }}>{kpi.label}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#edf5ff', marginBottom: '0.5rem' }}>{kpi.value}</div>
              <Tag type={kpi.tag} size="sm">{kpi.tagLabel}</Tag>
            </Tile>
          </Column>
        ))}
      </Grid>

      {/* Carbon Standard Tabs Navigation */}
      <Tabs selectedIndex={activeTab} onChange={({ selectedIndex }) => setActiveTab(selectedIndex)} style={{ marginBottom: '1.5rem' }}>
        <TabList aria-label="Agent Control Plane Navigation">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const hasBadge = (idx === 0 && pendingEscalations.length > 0) || (idx === 2 && deadLetters.filter(d => d.status === 'PENDING').length > 0);
            return (
              <Tab key={idx} renderIcon={Icon}>
                {tab.label}
                {hasBadge && (
                  <Tag type="warning" size="sm" style={{ marginLeft: '6px', padding: '0 4px', fontWeight: '700' }}>
                    !
                  </Tag>
                )}
              </Tab>
            );
          })}
        </TabList>
      </Tabs>

      {/* Tab 0: Human Approval Queue */}
      {activeTab === 0 && (
        <Tile style={{ padding: '1.5rem', background: '#262626', borderLeft: pendingEscalations.length > 0 ? '4px solid #f1c21b' : '4px solid #42be65' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <UserFollow size={20} style={{ color: pendingEscalations.length > 0 ? '#f1c21b' : '#42be65' }} />
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#edf5ff' }}>
              Human Approval Queue — Brand Manager Governance
            </h4>
          </div>

          {escalations.length === 0 ? (
            <p style={{ color: '#a8a8a8' }}>No escalations. All agent decisions within autonomous authority.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {escalations.map(ticket => (
                <div key={ticket.id} style={{ background: '#161616', padding: '1rem', borderRadius: '4px', border: '1px solid #393939', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <strong style={{ color: '#ffffff' }}>{ticket.creator_name}</strong>
                      <Tag type="magenta" size="sm">{ticket.actor_agent}</Tag>
                      <Tag type={RISK_TAG_TYPE[ticket.risk_level] || 'orange'} size="sm">
                        {ticket.risk_level || 'HIGH'} Risk
                      </Tag>
                      {ticket.status === 'APPROVED' && <Tag type="green" size="sm">✓ Resolved</Tag>}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#c6c6c6', marginBottom: '0.25rem' }}>{ticket.reason}</div>
                    <div style={{ fontSize: '0.8rem', color: '#a8a8a8' }}>
                      Requested: <strong style={{ color: '#f1c21b' }}>₹{ticket.requested_rate?.toLocaleString('en-IN')}</strong>
                      {ticket.max_allowed_rate && ticket.max_allowed_rate !== ticket.requested_rate && (
                        <> • Policy ceiling: ₹{ticket.max_allowed_rate?.toLocaleString('en-IN')}</>
                      )}
                    </div>
                  </div>
                  {ticket.status === 'PENDING' ? (
                    <Button size="sm" kind="primary" renderIcon={Checkmark}
                      onClick={() => handleApproveEscalation(ticket.id, ticket.creator_name)}>
                      Approve
                    </Button>
                  ) : (
                    <Tag type="green" size="md">✓ Resolved</Tag>
                  )}
                </div>
              ))}
            </div>
          )}
        </Tile>
      )}

      {/* Tab 1: Agent Runs */}
      {activeTab === 1 && (
        <Tile style={{ padding: '1.5rem', background: '#262626' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Debug size={20} style={{ color: '#0f62fe' }} />
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#edf5ff' }}>
              Agent Run Ledger — Full Autonomous Decision Traceability
            </h4>
          </div>

          {agentRuns.length === 0 ? (
            <p style={{ color: '#a8a8a8' }}>No agent runs recorded yet. Runs will appear as agents execute operations.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {agentRuns.map(run => (
                <div key={run.id} style={{ background: '#161616', padding: '1rem', borderRadius: '4px', border: '1px solid #393939' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ color: '#be95ff', fontSize: '0.9rem' }}>{run.agent_name}</strong>
                      <span style={{ color: '#525252', fontSize: '0.75rem' }}>#{run.id}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Tag type={run.result === 'COMPLETED' || run.result === 'QA_PASSED' || run.result === 'AUTO_APPROVED' || run.result === 'PAYMENT_EXECUTED' ? 'green' : run.result === 'ESCALATED' || run.result === 'REVISION_REQUIRED' ? 'yellow' : 'teal'} size="sm">
                        {run.result || 'IN_PROGRESS'}
                      </Tag>
                      {run.confidence !== null && (
                        <span style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>
                          Model confidence: {(run.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                      {run.human_approved === 1 && <Tag type="green" size="sm">✓ Human Approved: {run.human_actor || 'Brand Admin'}</Tag>}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#c6c6c6', marginBottom: '0.35rem' }}>
                    <strong style={{ color: '#4589ff' }}>Reasoning:</strong> {run.reasoning}
                  </div>
                  {run.policy_evaluated && (
                    <div style={{ fontSize: '0.78rem', color: '#8d8d8d', fontFamily: 'monospace' }}>
                      Policy: {run.policy_evaluated}
                    </div>
                  )}
                  {run.actions_taken && (
                    <div style={{ fontSize: '0.78rem', color: '#a8a8a8', marginTop: '0.25rem' }}>
                      Actions: {run.actions_taken}
                    </div>
                  )}
                  <div style={{ fontSize: '0.72rem', color: '#525252', marginTop: '0.5rem' }}>
                    {run.created_at} · Deal: {run.deal_id || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Audit Trail collapsible below agent runs */}
          {auditLogs.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Locked size={16} style={{ color: '#42be65' }} />
                <h5 style={{ margin: 0, fontSize: '0.9rem', color: '#edf5ff' }}>State Machine Audit Trail (Immutable)</h5>
              </div>
              <Table size="sm" useZebraStyles={false}>
                <TableHead>
                  <TableRow>
                    <TableHeader>Trigger Event</TableHeader>
                    <TableHeader>Stage Delta</TableHeader>
                    <TableHeader>Actor</TableHeader>
                    <TableHeader>Rationale</TableHeader>
                    <TableHeader>Status</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLogs.slice(0, 15).map(log => (
                    <TableRow key={log.id}>
                      <TableCell style={{ color: '#4589ff', fontWeight: '600' }}>{log.trigger_event}</TableCell>
                      <TableCell>
                        <Tag type="cool-gray" size="sm">{log.stage_from} → {log.stage_to}</Tag>
                      </TableCell>
                      <TableCell style={{ color: '#be95ff' }}>{log.actor_agent}</TableCell>
                      <TableCell style={{ color: '#c6c6c6', maxWidth: '300px' }}>{log.rationale}</TableCell>
                      <TableCell>
                        <Tag type={log.human_approved ? 'green' : 'teal'} size="sm">
                          {log.human_approved ? 'Human' : 'Auto'}
                        </Tag>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Tile>
      )}

      {/* Tab 2: Dead Letter Queue */}
      {activeTab === 2 && (
        <Tile style={{ padding: '1.5rem', background: '#262626', borderLeft: deadLetters.filter(d => d.status === 'PENDING').length > 0 ? '4px solid #ff832b' : '4px solid #42be65' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Warning size={20} style={{ color: '#ff832b' }} />
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#edf5ff' }}>
              Dead Letter Queue — Failed Agent Actions (retries exhausted)
            </h4>
          </div>

          {deadLetters.length === 0 ? (
            <p style={{ color: '#a8a8a8' }}>No failed actions. All agent operations executing cleanly.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {deadLetters.map(entry => (
                <div key={entry.id} style={{ background: '#161616', padding: '1rem', borderRadius: '4px', border: '1px solid #4d2400', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <strong style={{ color: '#ff8389' }}>{entry.agent_name}</strong>
                      <Tag type="orange" size="sm">{entry.action_type}</Tag>
                      <Tag type={entry.status === 'RESOLVED' ? 'green' : 'red'} size="sm">{entry.status}</Tag>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#c6c6c6', marginBottom: '0.25rem' }}>
                      Error: <code style={{ color: '#ff8389', fontSize: '0.78rem' }}>{entry.error}</code>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#a8a8a8' }}>
                      Retries: {entry.retry_count}/{entry.max_retries} · Deal: {entry.deal_id || 'N/A'} · {entry.created_at}
                    </div>
                  </div>
                  {entry.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button size="sm" kind="tertiary" onClick={() => handleDlqRetry(entry.id)}>
                        Retry Now
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Tile>
      )}

      {/* Tab 3: Agent Evaluation Suite */}
      {activeTab === 3 && (
        <Tile style={{ padding: '1.5rem', background: '#262626' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Play size={20} style={{ color: '#0f62fe' }} />
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#edf5ff' }}>
                Automated Agent Evaluation Suite
              </h4>
            </div>
            <Button size="sm" kind="primary" renderIcon={Play} onClick={handleRunEval} disabled={runningEval}>
              {runningEval ? 'Running...' : 'Run All Tests'}
            </Button>
          </div>

          {!evalResults && !runningEval && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#a8a8a8' }}>
              <Play size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <p>Click "Run All Tests" to execute deterministic regression tests across all agents.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Tests verify guardrails, QA outcomes, risk classification, and state topology — without touching live data.</p>
            </div>
          )}

          {evalResults && (
            <>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <Tile style={{ background: '#161616', padding: '1rem', flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: '#a8a8a8' }}>Total Tests</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#edf5ff' }}>{evalResults.total}</div>
                </Tile>
                <Tile style={{ background: '#161616', padding: '1rem', flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: '#a8a8a8' }}>Passed</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#42be65' }}>{evalResults.passed}</div>
                </Tile>
                <Tile style={{ background: '#161616', padding: '1rem', flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: '#a8a8a8' }}>Failed</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: evalResults.failed > 0 ? '#da1e28' : '#42be65' }}>{evalResults.failed}</div>
                </Tile>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {evalResults.results?.map(tc => (
                  <div key={tc.id} style={{
                    background: '#161616', padding: '0.75rem 1rem', borderRadius: '4px',
                    border: `1px solid ${tc.status === 'PASS' ? '#24a148' : '#da1e28'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <code style={{ color: '#4589ff', fontSize: '0.78rem' }}>{tc.id}</code>
                        <Tag type="cool-gray" size="sm">{tc.agent}</Tag>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#c6c6c6' }}>{tc.description}</div>
                      {tc.status === 'FAIL' && (
                        <div style={{ fontSize: '0.78rem', color: '#ff8389', marginTop: '0.25rem' }}>
                          Actual: {tc.actual}
                        </div>
                      )}
                    </div>
                    <Tag type={tc.status === 'PASS' ? 'green' : 'red'} size="md">
                      {tc.status === 'PASS' ? '✓ PASS' : '✗ FAIL'}
                    </Tag>
                  </div>
                ))}
              </div>
            </>
          )}
        </Tile>
      )}
    </div>
  );
}
