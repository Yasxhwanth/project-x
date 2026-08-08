import React, { useState, useEffect } from 'react';
import { 
  Tile, 
  Grid, 
  Column, 
  Slider, 
  Button, 
  Tag, 
  ProgressBar,
  Select,
  SelectItem,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Loading
} from '@carbon/react';
import { Idea, SendAlt, Analytics, Money, ChartBar, UserFollow, View } from '@carbon/icons-react';

export default function CampaignStrategyGenerator({ onLaunchPortfolio }) {
  const [budgetCap, setBudgetCap] = useState(250000); // ₹2,50,000 INR
  const [targetAudience, setTargetAudience] = useState('Youth & Fitness Enthusiasts (Tier 1 & 2 Cities)');
  const [serviceType, setServiceType] = useState('cpa');
  
  const [strategy, setStrategy] = useState(null);
  const [pricingMatrix, setPricingMatrix] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStrategy();
    fetchPricingMatrix();
  }, [budgetCap, serviceType]);

  const fetchStrategy = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgetCap, targetAudience, serviceType })
      });
      const data = await res.json();
      setStrategy(data);
    } catch (err) {
      console.error("Failed to generate campaign strategy", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPricingMatrix = async () => {
    try {
      const res = await fetch(`/api/tano/pricing-matrix?service=${serviceType}`);
      const data = await res.json();
      setPricingMatrix(data);
    } catch (err) {
      console.error("Failed to fetch pricing matrix", err);
    }
  };

  const tableHeaders = [
    { key: 'tier', header: 'Follower Tier' },
    { key: 'range', header: 'Follower Reach Range' },
    { key: 'creatorCost', header: 'Est. Creator Payout (₹)' },
    { key: 'totalCost', header: 'Total Fee per Creator (₹)' }
  ];

  return (
    <div className="campaign-strategy-generator-module">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '400', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Idea size={24} style={{ color: '#be95ff' }} /> AI Campaign Strategy & Tano-Style Creator Mix Generator
        </h2>
        <p style={{ color: '#a8a8a8' }}>
          Formulate optimal creator portfolio allocations, CPM in ₹ INR, projected Reel views, and Tano-style service model pricing matrices.
        </p>
      </div>

      {/* Input Parameters Controls */}
      <Tile style={{ padding: '1.75rem', marginBottom: '2rem', background: '#262626' }}>
        <Grid style={{ padding: 0, rowGap: '1.5rem', columnGap: '1.5rem' }}>
          <Column lg={6} md={4} sm={4}>
            <Select 
              id="tano-service-select"
              labelText="Campaign Service Model (Tano Framework)"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
            >
              <SelectItem value="cpa" text="Creator Partnership Ads (CPA) — Paid Reels + Whitelisting" />
              <SelectItem value="gifting" text="Product Gifting Campaigns — UGC Sample Dispatch" />
              <SelectItem value="affiliate" text="Affiliate Channel Management — Monthly Commission" />
            </Select>
          </Column>

          <Column lg={10} md={4} sm={4}>
            <div style={{ marginBottom: '0.5rem', color: '#f4f4f4', fontWeight: '600' }}>
              Campaign Maximum Budget Cap: <span style={{ color: '#f1c21b', fontSize: '1.2rem' }}>₹{budgetCap.toLocaleString('en-IN')}</span>
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
        </Grid>
      </Tile>

      {loading && (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Loading description="Optimizing AI Creator Portfolio Mix..." withOverlay={false} />
        </div>
      )}

      {/* Strategy Results */}
      {!loading && strategy && (
        <>
          {/* KPI Metrics */}
          <Grid style={{ padding: 0, marginBottom: '2rem', rowGap: '1.25rem', columnGap: '1.25rem' }}>
            <Column lg={4} md={4} sm={4}>
              <Tile style={{ background: '#262626', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#a8a8a8', fontSize: '0.85rem' }}>Combined Audience Reach</span>
                  <UserFollow size={20} style={{ color: '#4589ff' }} />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#4589ff' }}>
                  {strategy?.totalReachText || '0'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#8d8d8d', marginTop: '0.25rem' }}>
                  Across {strategy?.recommendedCreatorCount || 0} Creators
                </div>
              </Tile>
            </Column>

            <Column lg={4} md={4} sm={4}>
              <Tile style={{ background: '#262626', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#a8a8a8', fontSize: '0.85rem' }}>Projected Reel Views</span>
                  <View size={20} style={{ color: '#42be65' }} />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#42be65' }}>
                  {strategy?.totalViewsText || '0'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#8d8d8d', marginTop: '0.25rem' }}>
                  Organic Impressions
                </div>
              </Tile>
            </Column>

            <Column lg={4} md={4} sm={4}>
              <Tile style={{ background: '#262626', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#a8a8a8', fontSize: '0.85rem' }}>Estimated Campaign CPM</span>
                  <Analytics size={20} style={{ color: '#be95ff' }} />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#be95ff' }}>
                  {strategy?.campaignCPM || '₹0'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#8d8d8d', marginTop: '0.25rem' }}>
                  Cost per 1,000 Views
                </div>
              </Tile>
            </Column>

            <Column lg={4} md={4} sm={4}>
              <Tile style={{ background: '#262626', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#a8a8a8', fontSize: '0.85rem' }}>Projected ROI</span>
                  <Money size={20} style={{ color: '#f1c21b' }} />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#f1c21b' }}>
                  {strategy?.projectedROI || '3.5x ROI'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#8d8d8d', marginTop: '0.25rem' }}>
                  Return on Ad Spend
                </div>
              </Tile>
            </Column>
          </Grid>

          {/* Tano-Style Service Model Pricing Breakdown Table */}
          {pricingMatrix && (
            <Tile style={{ padding: '1.5rem', marginBottom: '2rem', background: '#262626' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{pricingMatrix.title}</h4>
                  <p style={{ color: '#a8a8a8', fontSize: '0.85rem' }}>{pricingMatrix.description}</p>
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
          <Tile style={{ padding: '1.75rem', background: '#262626' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Recommended Creator Portfolio</h4>
                <p style={{ color: '#a8a8a8', fontSize: '0.85rem' }}>
                  {strategy?.recommendedCreatorCount} Indian creators matched for maximum conversion in {targetAudience}.
                </p>
              </div>
              <Button kind="primary" renderIcon={SendAlt} onClick={() => onLaunchPortfolio(strategy?.recommendedPortfolio)}>
                1-Click Launch Portfolio Outreach
              </Button>
            </div>

            <Grid style={{ padding: 0, rowGap: '1rem' }}>
              {strategy?.recommendedPortfolio?.map((creator) => (
                <Column lg={8} md={4} sm={4} key={creator.id}>
                  <Tile style={{ background: '#161616', padding: '1rem', borderLeft: '4px solid #0f62fe' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <img 
                        src={creator.avatar} 
                        alt={creator.name} 
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: '#f4f4f4' }}>{creator.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#a8a8a8' }}>{creator.handle}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#c6c6c6', marginTop: '0.5rem' }}>
                      <span>Reach: <strong>{creator.reachText}</strong></span>
                      <span style={{ color: '#f1c21b', fontWeight: '600' }}>₹{creator.pricePerPost?.toLocaleString('en-IN')}</span>
                    </div>
                  </Tile>
                </Column>
              ))}
            </Grid>
          </Tile>
        </>
      )}
    </div>
  );
}
