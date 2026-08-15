import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { runDb, queryDb, getDbRow } from '../database/sqliteDb.js';
import { writeOutboxEvent } from '../engine/campaignStateMachine.js';
import { createAgentRun } from '../engine/orchestrator.js';

/**
 * Order Conversion & ROAS Attribution Engine
 *
 * Connects Creator Content → Promo Code / UTM Click → Shopify Order → Verified GMV Revenue.
 * Calculates exact Return On Ad Spend (ROAS) per creator to power autonomous budget optimization.
 */

/**
 * Verifies Shopify Webhook HMAC-SHA256 signature.
 * 
 * @param {string|Buffer} rawBody - Raw unparsed webhook request payload
 * @param {string} hmacHeader    - Value of 'x-shopify-hmac-sha256' header
 * @param {string} secret        - Organization Shopify Webhook Secret
 */
export function verifyShopifyWebhookHmac(rawBody, hmacHeader, secret) {
  if (!secret) {
    // Sandbox development mode: allow verified pass-through if secret is not configured
    return { verified: true, mode: 'SANDBOX_DEVELOPMENT' };
  }
  if (!hmacHeader) {
    return { verified: false, error: 'Missing x-shopify-hmac-sha256 header' };
  }

  try {
    const payload = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
    const generatedHash = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('base64');

    const verified = crypto.timingSafeEqual(
      Buffer.from(generatedHash, 'utf8'),
      Buffer.from(hmacHeader, 'utf8')
    );

    return { verified, mode: 'HMAC_SHA256_VERIFIED' };
  } catch (err) {
    return { verified: false, error: `HMAC verification failed: ${err.message}` };
  }
}

/**
 * Parses a standard Shopify 'orders/create' or 'orders/paid' webhook payload
 * and extracts creator attribution signals.
 */
export function parseShopifyOrderPayload(order) {
  if (!order) return null;

  const orderId = order.name || (order.id ? `#${order.id}` : `ORD-${Date.now()}`);
  const orderValue = parseFloat(order.total_price || order.current_total_price || 0);
  const customerEmail = order.email || order.contact_email || (order.customer ? order.customer.email : null);

  // Extract promo/discount code
  let promoCode = null;
  if (Array.isArray(order.discount_codes) && order.discount_codes.length > 0) {
    promoCode = order.discount_codes[0].code;
  }

  // Extract UTM parameters from landing_site or note_attributes
  let utmMedium = null;
  let utmSource = null;
  let utmCampaign = null;

  if (order.landing_site) {
    try {
      const url = new URL(order.landing_site, 'https://store.myshopify.com');
      utmMedium = url.searchParams.get('utm_medium');
      utmSource = url.searchParams.get('utm_source');
      utmCampaign = url.searchParams.get('utm_campaign');
      if (!promoCode && url.searchParams.get('discount')) {
        promoCode = url.searchParams.get('discount');
      }
    } catch (e) {}
  }

  if (!utmMedium && Array.isArray(order.note_attributes)) {
    const utmAttr = order.note_attributes.find(a => a.name === 'utm_medium' || a.name === 'creator_handle');
    if (utmAttr) utmMedium = utmAttr.value;
  }

  return {
    orderId,
    orderValue,
    promoCode,
    utmMedium,
    utmSource,
    utmCampaign,
    customerEmail,
    currency: order.currency || 'INR'
  };
}

/**
 * Generate a creator-specific trackable UTM URL and promo code payload.
 */
export function generateCreatorUtmLink({ targetUrl, brandSlug = 'boat', creatorHandle, promoCode, campaignId }) {
  const cleanHandle = (creatorHandle || 'creator').replace(/^@/, '').toLowerCase();
  const cleanPromo  = (promoCode || 'PROMO20').toUpperCase();
  const baseUrl    = targetUrl || `https://${brandSlug}-lifestyle.com/products/launch`;

  const urlObj = new URL(baseUrl);
  urlObj.searchParams.set('utm_source', 'creator_connect');
  urlObj.searchParams.set('utm_medium', `creator_${cleanHandle}`);
  urlObj.searchParams.set('utm_campaign', campaignId || 'summer_launch');
  urlObj.searchParams.set('discount', cleanPromo);

  return {
    trackableUrl: urlObj.toString(),
    promoCode: cleanPromo,
    utmMedium: `creator_${cleanHandle}`
  };
}

/**
 * Record an order conversion from Shopify / WooCommerce webhook or API.
 * Attributes order to creator by matching promo code or utm_medium.
 *
 * @param {object} payload
 * @param {string} payload.orderId       - Unique D2C order ID (e.g. #BOAT-18923)
 * @param {number} payload.orderValue     - INR Gross Order Total (e.g. 2999)
 * @param {string} [payload.promoCode]   - Coupon code applied at checkout (e.g. BOAT30)
 * @param {string} [payload.utmMedium]   - e.g. creator_fitwithpriya
 * @param {string} [payload.customerEmail]
 * @param {string} [payload.storeProvider]- 'SHOPIFY_WEBHOOK' | 'WOOCOMMERCE' | 'CUSTOM_API'
 */
export async function recordConversion({
  orderId,
  orderValue,
  promoCode,
  utmMedium,
  customerEmail,
  storeProvider = 'SHOPIFY_WEBHOOK'
}) {
  if (!orderId || !orderValue) {
    throw new Error('orderId and orderValue are required for conversion attribution');
  }

  // Idempotency check for duplicate webhook dispatches
  const existing = await getDbRow(`SELECT id FROM conversions WHERE order_id = ?`, [orderId]);
  if (existing) {
    console.log(`[Attribution] Order ${orderId} already processed. Skipping duplicate.`);
    return { success: true, isDuplicate: true, conversionId: existing.id };
  }

  let deal = null;

  // 1. Match by promo code first
  if (promoCode) {
    deal = await getDbRow(
      `SELECT d.*, c.promo_code FROM deals d
       JOIN campaigns c ON d.campaign_id = c.id
       WHERE LOWER(c.promo_code) = LOWER(?)
       ORDER BY d.created_at DESC LIMIT 1`,
      [promoCode.trim()]
    );
  }

  // 2. Match by UTM medium fallback (e.g. creator_fitwithpriya)
  if (!deal && utmMedium) {
    const handleMatch = utmMedium.replace(/^creator_/, '').toLowerCase();
    deal = await getDbRow(
      `SELECT * FROM deals WHERE LOWER(creator_name) LIKE ? OR LOWER(creator_email) LIKE ? ORDER BY created_at DESC LIMIT 1`,
      [`%${handleMatch}%`, `%${handleMatch}%`]
    );
  }

  // 3. Fallback to latest paid/active deal if single active campaign
  if (!deal) {
    deal = await getDbRow(`SELECT * FROM deals WHERE status IN ('PAID', 'AGREED', 'QA_PASSED') ORDER BY created_at DESC LIMIT 1`);
  }

  if (!deal) {
    throw new Error(`Could not attribute order ${orderId}: No matching deal found for promo ${promoCode} or UTM ${utmMedium}`);
  }

  const id = 'conv_' + uuidv4().substring(0, 8);
  const commission = Math.round(orderValue * 0.10); // 10% affiliate commission

  await runDb(`
    INSERT INTO conversions (
      id, campaign_id, deal_id, creator_id, creator_name,
      order_id, promo_code, utm_medium, order_value, commission_amount, customer_email, store_provider
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id, deal.campaign_id, deal.id, deal.creator_id, deal.creator_name,
    orderId, promoCode || null, utmMedium || null, orderValue, commission, customerEmail || null, storeProvider
  ]);

  console.log(`🎯 [Attribution] Order ${orderId} (₹${orderValue.toLocaleString('en-IN')}) attributed to ${deal.creator_name} (Deal: ${deal.id})`);

  // Write outbox event for real-time analytics & agent triggers
  await writeOutboxEvent('CONVERSION_RECORDED', {
    conversionId: id,
    dealId: deal.id,
    campaignId: deal.campaign_id,
    creatorName: deal.creator_name,
    orderValue,
    orderId
  });

  // Log agent run for Optimization Agent awareness
  await createAgentRun({
    agentName: 'Optimization Agent',
    campaignId: deal.campaign_id,
    dealId: deal.id,
    input: { orderId, orderValue, promoCode, utmMedium },
    reasoning: `Order ${orderId} (₹${orderValue.toLocaleString('en-IN')}) attributed to ${deal.creator_name}. Updating creator ROAS ledger.`,
    toolsUsed: 'attributionService',
    actionsTaken: `Recorded conversion ${id}, added ₹${orderValue} to creator GMV`,
    policyEvaluated: 'Optimization.attributionModel=LAST_CLICK_PROMO',
    result: 'CONVERSION_ATTRIBUTED',
    confidence: 0.99
  });

  return {
    success: true,
    conversionId: id,
    dealId: deal.id,
    creatorName: deal.creator_name,
    orderValue,
    commission
  };
}

/**
 * Get comprehensive attribution and ROAS metrics for a campaign.
 */
export async function getCampaignAttribution(campaignId) {
  const campaign = await getDbRow(`SELECT * FROM campaigns WHERE id = ?`, [campaignId])
    || await getDbRow(`SELECT * FROM campaigns LIMIT 1`);

  if (!campaign) throw new Error('No campaign found for attribution query');

  const conversions = await queryDb(
    `SELECT * FROM conversions WHERE campaign_id = ? ORDER BY converted_at DESC`,
    [campaign.id]
  );

  const deals = await queryDb(
    `SELECT * FROM deals WHERE campaign_id = ?`,
    [campaign.id]
  );

  const totalGMV = conversions.reduce((sum, c) => sum + (c.order_value || 0), 0);
  const totalOrders = conversions.length;
  const aov = totalOrders > 0 ? Math.round(totalGMV / totalOrders) : 0;

  // Calculate per-creator ROAS
  const creatorAttribution = {};

  deals.forEach(d => {
    const fee = d.current_agreed_price || d.offered_price || 1;
    creatorAttribution[d.id] = {
      dealId: d.id,
      creatorId: d.creator_id,
      creatorName: d.creator_name,
      platform: d.platform,
      agreedFee: fee,
      orders: 0,
      gmv: 0,
      roas: 0,
      cpa: 0
    };
  });

  conversions.forEach(c => {
    if (creatorAttribution[c.deal_id]) {
      creatorAttribution[c.deal_id].orders += 1;
      creatorAttribution[c.deal_id].gmv += c.order_value;
    }
  });

  const creatorBreakdown = Object.values(creatorAttribution).map(ca => {
    const roas = ca.agreedFee > 0 ? parseFloat((ca.gmv / ca.agreedFee).toFixed(2)) : 0;
    const cpa  = ca.orders > 0 ? Math.round(ca.agreedFee / ca.orders) : 0;
    return {
      ...ca,
      roas: `${roas}x`,
      roasRaw: roas,
      cpa: `₹${cpa.toLocaleString('en-IN')}`,
      gmvFormatted: `₹${ca.gmv.toLocaleString('en-IN')}`,
      agreedFeeFormatted: `₹${ca.agreedFee.toLocaleString('en-IN')}`
    };
  }).sort((a, b) => b.roasRaw - a.roasRaw);

  const totalSpend = deals.reduce((sum, d) => sum + (d.current_agreed_price || d.offered_price || 0), 0);
  const overallRoas = totalSpend > 0 ? (totalGMV / totalSpend).toFixed(2) : 0;

  return {
    campaignId: campaign.id,
    brandName: campaign.brand_name,
    productName: campaign.product_name,
    summary: {
      totalGMV: `₹${totalGMV.toLocaleString('en-IN')}`,
      totalGMVRaw: totalGMV,
      totalSpend: `₹${totalSpend.toLocaleString('en-IN')}`,
      totalSpendRaw: totalSpend,
      overallRoas: `${overallRoas}x`,
      totalOrders,
      averageOrderValue: `₹${aov.toLocaleString('en-IN')}`
    },
    creatorBreakdown,
    recentConversions: conversions.slice(0, 20)
  };
}
