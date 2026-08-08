import { queryDb } from '../database/sqliteDb.js';

function formatCountInKAndM(val) {
  if (!val) return '0';
  if (val >= 1000000) {
    return `${(val / 1000000).toFixed(1)}M`;
  }
  if (val >= 1000) {
    return `${(val / 1000).toFixed(0)}K`;
  }
  return val.toString();
}

/**
 * AI Campaign Strategy & Creator Portfolio Optimizer
 */
export async function generateCampaignStrategy({
  brandName = "boAt Lifestyle",
  productName = "boAt Airdopes Pro Max 500",
  totalBudget = 250000,
  targetAudience = "College Students & Tech Enthusiasts (18-28 yrs)",
  niche = "All"
}) {
  try {
    let sql = "SELECT * FROM creators WHERE price_per_post <= ?";
    let params = [totalBudget];

    if (niche && niche !== "All") {
      sql += " AND LOWER(niche) LIKE LOWER(?)";
      params.push(`%${niche}%`);
    }

    sql += " ORDER BY followers_raw DESC";

    const allCreators = await queryDb(sql, params);

    let remainingBudget = totalBudget;
    let selectedPortfolio = [];
    let microCount = 0;
    let midCount = 0;
    let macroCount = 0;

    // Greedy portfolio selection to maximize reach & engagement within budget
    for (const c of allCreators) {
      if (c.price_per_post <= remainingBudget) {
        selectedPortfolio.push({
          id: c.id,
          name: c.name,
          handle: c.handle,
          platform: c.platform,
          niche: c.niche,
          followersRaw: c.followers_raw,
          reachText: c.reach_text || `${formatCountInKAndM(c.followers_raw)} Followers`,
          avgViews: c.avg_views,
          engagementRate: c.engagement_rate,
          pricePerPost: c.price_per_post,
          avatar: c.avatar,
          location: c.location
        });

        remainingBudget -= c.price_per_post;

        if (c.followers_raw >= 2000000) macroCount++;
        else if (c.followers_raw >= 500000) midCount++;
        else microCount++;
      }
    }

    // Performance Calculations
    const totalAllocatedSpend = totalBudget - remainingBudget;
    const totalProjectedReachRaw = selectedPortfolio.reduce((sum, c) => sum + (c.followersRaw || 0), 0);
    const totalProjectedViewsRaw = selectedPortfolio.reduce((sum, c) => sum + (c.avgViews || 0), 0);

    const projectedCPM = totalProjectedViewsRaw > 0 
      ? parseFloat(((totalAllocatedSpend / totalProjectedViewsRaw) * 1000).toFixed(2)) 
      : 85.0;

    const estimatedRoiMultiplier = (3.2 + (selectedPortfolio.length * 0.25)).toFixed(1);

    const strategyNarrative = `For ${brandName}'s campaign targeting "${targetAudience}", we have constructed an optimal Creator Portfolio of ${selectedPortfolio.length} creators across ${microCount} Micro, ${midCount} Mid-Tier, and ${macroCount} Macro creators. This mix optimizes brand trust and high-volume viral reach at an efficient CPM of ₹${projectedCPM} per 1,000 impressions.`;

    return {
      campaignDetails: {
        brandName,
        productName,
        totalBudget,
        allocatedSpend: totalAllocatedSpend,
        remainingBudget,
        targetAudience,
        niche
      },
      tierDistribution: {
        microCount,
        midCount,
        macroCount,
        totalCreators: selectedPortfolio.length
      },
      performanceMetrics: {
        totalProjectedReachRaw,
        totalProjectedReachText: formatCountInKAndM(totalProjectedReachRaw),
        totalProjectedViewsRaw,
        totalProjectedViewsText: formatCountInKAndM(totalProjectedViewsRaw),
        projectedCPM,
        estimatedRoiMultiplier: `${estimatedRoiMultiplier}x`
      },
      strategyNarrative,
      recommendedPortfolio: selectedPortfolio
    };
  } catch (err) {
    console.error("Error generating AI campaign strategy:", err);
    throw err;
  }
}
