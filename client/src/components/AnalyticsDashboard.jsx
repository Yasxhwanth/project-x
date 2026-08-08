import React, { useState, useEffect } from 'react';
import { 
  Tile, 
  Grid, 
  Column, 
  ProgressBar, 
  Tag, 
  Loading,
  Button,
  InlineNotification
} from '@carbon/react';
import { Analytics, Currency, UserFollow, ChartBar, Renew, Checkmark, View, Idea, Security, ArrowRight } from '@carbon/icons-react';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reallocated, setReallocated] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/summary');
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to fetch campaign analytics", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <Loading description="Loading Real-Time Campaign Analytics & Category Benchmarks..." withOverlay={false} />
      </div>
    );
  }

  const kpi = analytics?.kpiOverview;
  const benchmark = analytics?.categoryBenchmarking;
  const optAgent = analytics?.aiAgentOptimization;
  const funnel = analytics?.dealPipelineFunnel;
  const platform = analytics?.platformBreakdown;

  return (
    <div className="analytics-dashboard-module">
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '400', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ChartBar size={24} style={{ color: '#42be65' }} /> Layer 3 & 4: Campaign Intelligence, Benchmarks & Autonomous Optimization
          </h2>
          <p style={{ color: '#a8a8a8' }}>
            Closed-loop ROI attribution (Views → Conversions → Revenue → ROI), India D2C market benchmarking, and autonomous AI budget reallocation recommendations.
          </p>
        </div>
        <Button size="sm" kind="tertiary" renderIcon={Renew} onClick={fetchAnalytics}>
          Refresh Metrics
        </Button>
      </div>

      {reallocated && (
        <InlineNotification
          kind="success"
          title="Autonomous AI Budget Reallocation Applied!"
          subtitle="Transferred ₹50,000 budget from Ananya Desi Style (0.8x ROI) to Vikram Fitness (5.2x ROI). Projected incremental revenue: +₹2.1 Lakhs!"
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      {/* Primary KPI Metrics Row */}
      <Grid style={{ padding: 0, marginBottom: '1.5rem', rowGap: '1.25rem', columnGap: '1.25rem' }}>
        <Column lg={4} md={4} sm={4}>
          <Tile style={{ background: '#262626', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ color: '#a8a8a8', fontSize: '0.85rem' }}>Total Spend vs Budget</span>
              <Currency size={20} style={{ color: '#f1c21b' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#f1c21b' }}>
              ₹{kpi?.totalSpent?.toLocaleString('en-IN') || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#8d8d8d', marginTop: '0.25rem' }}>
              Budget Cap: ₹{kpi?.totalBudgetCap?.toLocaleString('en-IN')}
            </div>
            <ProgressBar value={kpi?.spendProgressPercent || 0} style={{ marginTop: '0.75rem' }} hideLabel />
          </Tile>
        </Column>

        <Column lg={4} md={4} sm={4}>
          <Tile style={{ background: '#262626', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ color: '#a8a8a8', fontSize: '0.85rem' }}>Total Audience Reach</span>
              <UserFollow size={20} style={{ color: '#4589ff' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#4589ff' }}>
              {kpi?.totalReachText || '0'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#8d8d8d', marginTop: '0.25rem' }}>
              Across {kpi?.totalCreators} Indian Creators
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <Tag type="blue" size="sm">Combined Reach</Tag>
            </div>
          </Tile>
        </Column>

        <Column lg={4} md={4} sm={4}>
          <Tile style={{ background: '#262626', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ color: '#a8a8a8', fontSize: '0.85rem' }}>Projected Post Views</span>
              <View size={20} style={{ color: '#42be65' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#42be65' }}>
              {kpi?.totalViewsText || '0'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#8d8d8d', marginTop: '0.25rem' }}>
              Estimated Organic Views
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <Tag type="green" size="sm">Organic Views</Tag>
            </div>
          </Tile>
        </Column>

        <Column lg={4} md={4} sm={4}>
          <Tile style={{ background: '#262626', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ color: '#a8a8a8', fontSize: '0.85rem' }}>Cost-per-View (CPV)</span>
              <Analytics size={20} style={{ color: '#be95ff' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#be95ff' }}>
              {kpi?.costPerView}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#8d8d8d', marginTop: '0.25rem' }}>
              Campaign CPM: {kpi?.campaignCPM}
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <Tag type="purple" size="sm">{kpi?.estimatedROI}</Tag>
            </div>
          </Tile>
        </Column>
      </Grid>

      {/* Layer 4: Autonomous Campaign Optimization Agent Card */}
      <Tile style={{ padding: '1.5rem', background: '#262626', marginBottom: '1.5rem', borderLeft: '4px solid #42be65' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Idea size={22} style={{ color: '#42be65' }} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#edf5ff', margin: 0 }}>
              Layer 4: AI Campaign Optimization Agent Recommendation
            </h4>
          </div>
          <Tag type="teal" size="md">Confidence Score: {optAgent?.confidence || '94%'}</Tag>
        </div>

        <Grid style={{ padding: 0, rowGap: '1rem', columnGap: '1rem' }}>
          <Column lg={8} md={4} sm={4}>
            <div style={{ background: '#161616', padding: '1rem', borderRadius: '4px', border: '1px solid #393939' }}>
              <div style={{ fontSize: '0.75rem', color: '#42be65', fontWeight: '600', marginBottom: '0.25rem' }}>🔥 Top Performing Creator</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff' }}>{optAgent?.topPerformer?.creatorName}</div>
              <div style={{ fontSize: '0.85rem', color: '#c6c6c6', marginTop: '0.25rem' }}>
                ROI: <strong style={{ color: '#42be65' }}>{optAgent?.topPerformer?.roi}</strong> • Generated {optAgent?.topPerformer?.conversions} Orders ({optAgent?.topPerformer?.revenue})
              </div>
            </div>
          </Column>

          <Column lg={8} md={4} sm={4}>
            <div style={{ background: '#161616', padding: '1rem', borderRadius: '4px', border: '1px solid #393939' }}>
              <div style={{ fontSize: '0.75rem', color: '#da1e28', fontWeight: '600', marginBottom: '0.25rem' }}>📉 Underperforming Creator</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff' }}>{optAgent?.underPerformer?.creatorName}</div>
              <div style={{ fontSize: '0.85rem', color: '#c6c6c6', marginTop: '0.25rem' }}>
                ROI: <strong style={{ color: '#da1e28' }}>{optAgent?.underPerformer?.roi}</strong> • Generated {optAgent?.underPerformer?.conversions} Orders ({optAgent?.underPerformer?.revenue})
              </div>
            </div>
          </Column>

          <Column lg={16} md={8} sm={4}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161616', padding: '1rem', borderRadius: '4px' }}>
              <div>
                <span style={{ fontWeight: '600', color: '#edf5ff', fontSize: '0.9rem' }}>
                  AI Autonomous Recommendation: {optAgent?.recommendationAction}
                </span>
                <div style={{ fontSize: '0.8rem', color: '#42be65', marginTop: '0.25rem' }}>
                  Expected Incremental Revenue: <strong>+{optAgent?.expectedIncrementalRevenue}</strong>
                </div>
              </div>
              <Button 
                size="sm" 
                kind="primary" 
                renderIcon={ArrowRight}
                disabled={reallocated}
                onClick={() => setReallocated(true)}
              >
                {reallocated ? "Reallocated!" : "Execute Autonomous Reallocation"}
              </Button>
            </div>
          </Column>
        </Grid>
      </Tile>

      {/* Layer 3: Category Benchmarks & Deal Pipeline Funnel */}
      <Grid style={{ padding: 0, rowGap: '1.5rem', columnGap: '1.5rem' }}>
        {/* Category Benchmarking Tile */}
        <Column lg={8} md={4} sm={4}>
          <Tile style={{ padding: '1.5rem', background: '#262626', height: '100%' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1.25rem', color: '#edf5ff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Security size={18} style={{ color: '#0f62fe' }} /> Category Benchmarking (India Market)
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#161616', padding: '1rem', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.8rem', color: '#a8a8a8' }}>Market: {benchmark?.categoryName}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#42be65', margin: '0.25rem 0' }}>
                  Your CPM: ₹{benchmark?.yourCPM} vs Category Median ₹{benchmark?.categoryMedianCPM}
                </div>
                <Tag type="green" size="md" style={{ fontWeight: '700' }}>
                  {benchmark?.performanceVerdict}
                </Tag>
              </div>

              <div style={{ background: '#161616', padding: '1rem', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.8rem', color: '#a8a8a8' }}>Engagement Rate Benchmark</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#ffffff', marginTop: '0.25rem' }}>
                  Your Avg: {benchmark?.avgEngagement} (Category Median: {benchmark?.categoryMedianEngagement})
                </div>
              </div>
            </div>
          </Tile>
        </Column>

        {/* Funnel & Platform */}
        <Column lg={8} md={4} sm={4}>
          <Tile style={{ padding: '1.5rem', background: '#262626', height: '100%' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1.25rem', color: '#edf5ff' }}>
              Deal Pipeline Conversion Funnel
            </h4>
            <Grid style={{ padding: 0, rowGap: '1rem' }}>
              <Column lg={5} md={2} sm={2}>
                <div style={{ background: '#161616', padding: '1rem', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>Outreach Sent</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4589ff', margin: '0.25rem 0' }}>
                    {funnel?.totalInvited}
                  </div>
                </div>
              </Column>

              <Column lg={5} md={2} sm={2}>
                <div style={{ background: '#161616', padding: '1rem', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>Negotiating</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f1c21b', margin: '0.25rem 0' }}>
                    {funnel?.totalNegotiating}
                  </div>
                </div>
              </Column>

              <Column lg={6} md={4} sm={4}>
                <div style={{ background: '#161616', padding: '1rem', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>Verified & Paid</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#42be65', margin: '0.25rem 0' }}>
                    {funnel?.totalPaid + funnel?.totalVerified}
                  </div>
                </div>
              </Column>
            </Grid>
          </Tile>
        </Column>
      </Grid>
    </div>
  );
}
