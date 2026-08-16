import React, { useState } from 'react';
import { 
  Tile, 
  Grid, 
  Column, 
  Slider, 
  Select, 
  SelectItem, 
  Button, 
  Tag, 
  ProgressBar, 
  DataTable, 
  Table, 
  TableHead, 
  TableRow, 
  TableHeader, 
  TableBody, 
  TableCell,
  Loading
} from '@carbon/react';
import { Idea, Money, UserFollow, ChartBar, SendAlt, Checkmark, View } from '@carbon/icons-react';

export default function CampaignStrategyGenerator({ onLaunchPortfolio }) {
  const [budgetCap, setBudgetCap] = useState(150000);
  const [serviceType, setServiceType] = useState('cpa');
  const [targetAudience, setTargetAudience] = useState('Tier 1 & 2 Gen Z & Millennials (Metro)');
  const [generating, setGenerating] = useState(false);
  const [strategy, setStrategy] = useState(null);

  const handleGenerateStrategy = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/campaigns/strategy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgetCap, serviceType, targetAudience })
      });
      const data = await res.json();
      setStrategy(data);
    } catch (err) {
      console.error("Strategy generation error", err);
    } finally {
      setGenerating(false);
    }
  };

  const pricingMatrix = strategy?.pricingMatrix;

  const tableHeaders = [
    { key: 'tier', header: 'Follower Tier' },
    { key: 'range', header: 'Audience Reach Range' },
    { key: 'creatorCost', header: 'Est. Creator Payout (₹)' },
    { key: 'totalCost', header: 'Total Fee per Creator (₹)' }
  ];

  return (
    <div style={{ width: '100%' }}>
      {/* ─── Hero Header ──────────────────────────────────────────────────── */}
      <div className="hero-header" style={{ marginBottom: '1.25rem' }}>
        <h1>Algorithmic Campaign Strategy & Creator Mix</h1>
        <p>
          Formulate optimal creator tier allocations, CPM benchmarks in INR (₹), projected audience reach, and structured partnership models.
        </p>
      </div>

      {/* Input Parameters Controls */}
      <Tile style={{ padding: '1.75rem', marginBottom: '1.5rem', background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6 }}>
        <Grid fullWidth style={{ padding: 0, rowGap: '1.5rem', columnGap: '1.5rem' }}>
          <Column lg={6} md={4} sm={4}>
            <Select 
              id="service-model-select"
              labelText="Commercial Engagement Model"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
            >
              <SelectItem value="cpa" text="Creator Partnership Ads (CPA) — Paid Deliverables + Whitelisting" />
              <SelectItem value="gifting" text="Product Gifting Campaigns — UGC Sample Dispatch" />
              <SelectItem value="affiliate" text="Affiliate Channel Management — Performance Commission" />
            </Select>
          </Column>

          <Column lg={10} md={4} sm={4}>
            <div style={{ marginBottom: '0.5rem', color: '#f4f4f4', fontWeight: 600 }}>
              Campaign Maximum Budget Cap: <span style={{ color: '#f1c21b', fontSize: '1.2rem', fontFamily: 'monospace' }}>₹{budgetCap.toLocaleString('en-IN')}</span>
            </div>
            <Slider
              id="budget-cap-slider"
              min={25000}
              max={1000000}
              step={25000}
              value={budgetCap}
              onChange={({ value }) => setBudgetCap(value)}
              hideTextInput
            />
          </Column>

          <Column lg={16} md={8} sm={4}>
            <Button 
              kind="primary" 
              renderIcon={Idea} 
              disabled={generating} 
              onClick={handleGenerateStrategy}
            >
              {generating ? "Computing Optimal Mix..." : "Generate Strategic Creator Allocation"}
            </Button>
          </Column>
        </Grid>
      </Tile>

      {/* Loading Spinner */}
      {generating && (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <Loading description="Synthesizing creator portfolio allocation..." withOverlay={false} />
        </div>
      )}

      {/* Generated Strategy Portfolio Results */}
      {!generating && strategy && (
        <>
          {/* Strategy Output Cards */}
          <Grid fullWidth style={{ padding: 0, marginBottom: '1.5rem', rowGap: '1.25rem', columnGap: '1.25rem' }}>
            <Column lg={4} md={4} sm={4}>
              <Tile style={{ background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Optimal Creator Mix</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#4589ff', margin: '0.25rem 0' }}>
                  {strategy?.recommendedCreatorCount} Creators
                </div>
                <div style={{ fontSize: '0.8rem', color: '#c6c6c6' }}>
                  {strategy?.tierBreakdown}
                </div>
              </Tile>
            </Column>

            <Column lg={4} md={4} sm={4}>
              <Tile style={{ background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Projected Audience Reach</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#42be65', margin: '0.25rem 0' }}>
                  {strategy?.projectedTotalReach}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#8d8d8d' }}>
                  Combined Organic Impressions
                </div>
              </Tile>
            </Column>

            <Column lg={4} md={4} sm={4}>
              <Tile style={{ background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Effective CPM</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f1c21b', margin: '0.25rem 0' }}>
                  {strategy?.projectedCPM}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#8d8d8d' }}>
                  Cost per 1,000 Impressions
                </div>
              </Tile>
            </Column>

            <Column lg={4} md={4} sm={4}>
              <Tile style={{ background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Projected Campaign ROAS</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#8a3ffc', margin: '0.25rem 0' }}>
                  {strategy?.projectedROAS}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#8d8d8d' }}>
                  Return on Ad Spend
                </div>
              </Tile>
            </Column>
          </Grid>

          {/* Pricing Breakdown Table */}
          {pricingMatrix && (
            <Tile style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>{pricingMatrix.title}</h4>
                  <p style={{ color: '#8d8d8d', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>{pricingMatrix.description}</p>
                </div>
                <Tag type="teal" size="md">{pricingMatrix.serviceFeeText}</Tag>
              </div>

              <DataTable rows={pricingMatrix.tiers.map((t, idx) => ({ id: `${idx}`, ...t }))} headers={tableHeaders}>
                {({ rows, headers, getHeaderProps, getRowProps }) => (
                  <Table size="sm">
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
                      {rows.map((row) => (
                        <TableRow key={row.id} {...getRowProps({ row })}>
                          {row.cells.map((cell) => (
                            <TableCell key={cell.id}>{cell.value}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </DataTable>
            </Tile>
          )}

          {/* Portfolio Creator Mix */}
          <Tile style={{ padding: '1.75rem', background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>Recommended Creator Portfolio</h4>
                <p style={{ color: '#8d8d8d', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                  {strategy?.recommendedCreatorCount} verified creators matched for maximum conversion in {targetAudience}.
                </p>
              </div>
              <Button kind="primary" renderIcon={SendAlt} onClick={() => onLaunchPortfolio(strategy?.recommendedPortfolio)}>
                Launch Portfolio Outreach
              </Button>
            </div>

            <Grid fullWidth style={{ padding: 0, rowGap: '1rem', columnGap: '1rem' }}>
              {strategy?.recommendedPortfolio?.map((creator) => (
                <Column lg={8} md={4} sm={4} key={creator.id}>
                  <div style={{ background: '#111111', padding: '1rem 1.25rem', borderRadius: 4, border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{creator.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#8d8d8d' }}>{creator.handle} • {creator.tier} ({creator.followers})</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#42be65', fontFamily: 'monospace' }}>₹{creator.estimatedFee?.toLocaleString('en-IN')}</div>
                      <Tag type="green" size="sm">Match</Tag>
                    </div>
                  </div>
                </Column>
              ))}
            </Grid>
          </Tile>
        </>
      )}
    </div>
  );
}
