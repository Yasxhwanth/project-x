import { validatePanNumber, validateGstin, validateIfscCode, validateUpiId, calculateTdsWithholding, submitCreatorKyc, getCreatorKyc } from '../services/kycService.js';
import { executeDealPayout, getDealPayoutReceipt } from '../services/payoutService.js';
import { verifyShopifyWebhookHmac, parseShopifyOrderPayload, recordConversion } from '../services/attributionService.js';
import { generateCampaignCloseoutReport, getCloseoutReport } from '../services/closeoutReportService.js';
import { getDbRow } from '../database/sqliteDb.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    failed++;
  }
}

async function runPilotReadinessTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PROJECT X PILOT-READINESS TEST SUITE');
  console.log('======================================================\n');

  // ---------------------------------------------------------
  // SUITE 1: KYC Validation & Entity Classification
  // ---------------------------------------------------------
  console.log('--- Suite 1: Indian KYC & Bank Validation Engine ---');

  // Valid PAN
  const pan1 = validatePanNumber('AABPM1234F');
  assert(pan1.isValid === true && pan1.entityType === 'Individual (P)', 'Valid Individual PAN format (AABPM1234F)');

  // Company PAN
  const pan2 = validatePanNumber('AAACM5678C');
  assert(pan2.isValid === true && pan2.entityType === 'Company (C)', 'Valid Company PAN format (AAACM5678C)');

  // Invalid PAN format
  const panInvalid = validatePanNumber('INVALID123');
  assert(panInvalid.isValid === false, 'Rejects invalid PAN format (INVALID123)');

  // Valid GSTIN
  const gst1 = validateGstin('07AABPM1234F1Z5');
  assert(gst1.isValid === true && gst1.stateCode === '07', 'Valid Delhi GSTIN (07AABPM1234F1Z5)');

  // Valid IFSC & Bank Directory Lookup
  const ifscHdfc = validateIfscCode('HDFC0000123');
  assert(ifscHdfc.isValid === true && ifscHdfc.bankName === 'HDFC Bank Ltd', 'Resolves HDFC Bank from IFSC prefix (HDFC0000123)');

  const ifscSbi = validateIfscCode('SBIN0001234');
  assert(ifscSbi.isValid === true && ifscSbi.bankName === 'State Bank of India', 'Resolves SBI from IFSC prefix (SBIN0001234)');

  const ifscInvalid = validateIfscCode('HDFC123');
  assert(ifscInvalid.isValid === false, 'Rejects malformed IFSC (HDFC123)');

  // Valid UPI ID
  const upi1 = validateUpiId('creator@okhdfcbank');
  assert(upi1.isValid === true && upi1.handle === 'creator' && upi1.psp === 'okhdfcbank', 'Valid UPI VPA (creator@okhdfcbank)');

  const upiInvalid = validateUpiId('not-a-upi');
  assert(upiInvalid.isValid === false, 'Rejects invalid UPI format (not-a-upi)');

  // ---------------------------------------------------------
  // SUITE 2: TDS Withholding Rules
  // ---------------------------------------------------------
  console.log('\n--- Suite 2: Statutory Indian Income Tax TDS Engine ---');

  // Section 194J 10%
  const tds194J = calculateTdsWithholding({ grossAmount: 50000, tdsSection: '194J', panNumber: 'AABPM1234F', isPanValid: true });
  assert(tds194J.tdsRate === 10 && tds194J.tdsAmount === 5000 && tds194J.netPayable === 45000, 'Calculates Section 194J 10% TDS (₹50,000 -> TDS ₹5,000, Net ₹45,000)');

  // Section 194C 1%
  const tds194C = calculateTdsWithholding({ grossAmount: 100000, tdsSection: '194C', panNumber: 'AABPM1234F', isPanValid: true });
  assert(tds194C.tdsRate === 1 && tds194C.tdsAmount === 1000 && tds194C.netPayable === 99000, 'Calculates Section 194C 1% TDS (₹100,000 -> TDS ₹1,000, Net ₹99,000)');

  // Section 206AA 20% Penalty (Missing PAN)
  const tdsPenalty = calculateTdsWithholding({ grossAmount: 40000, tdsSection: '194J', panNumber: '', isPanValid: false });
  assert(tdsPenalty.tdsRate === 20 && tdsPenalty.tdsAmount === 8000 && tdsPenalty.penaltyApplied === true, 'Enforces Section 206AA 20% penalty rate when PAN is missing');

  // ---------------------------------------------------------
  // SUITE 3: Creator KYC Submission & Storage
  // ---------------------------------------------------------
  console.log('\n--- Suite 3: Creator KYC Database Lifecycle ---');

  const testCreatorId = 'cr_test_pilot_01';
  const kycSubmitted = await submitCreatorKyc({
    creatorId: testCreatorId,
    legalName: 'Tanmay Bhat Media',
    panNumber: 'AABPT9999M',
    gstin: '27AABPT9999M1Z2',
    payoutMethod: 'UPI',
    upiId: 'tanmay@upi',
    tdsSection: '194J'
  });

  assert(kycSubmitted.kyc_status === 'VERIFIED', 'Creator KYC status marked VERIFIED on valid submission');
  assert(kycSubmitted.pan_number === 'AABPT9999M', 'Stores verified PAN number');
  assert(kycSubmitted.maskedPan !== null, 'Masks PAN for frontend UI security');

  const kycFetched = await getCreatorKyc(testCreatorId);
  assert(kycFetched !== null && kycFetched.legal_name === 'Tanmay Bhat Media', 'Retrieves stored Creator KYC from SQLite');

  // ---------------------------------------------------------
  // SUITE 4: Verified Payout & Form 16A TDS Settlement
  // ---------------------------------------------------------
  console.log('\n--- Suite 4: Real Payout Execution & Ledger ---');

  // Ensure deal exists for test
  const existingDeal = await getDbRow('SELECT id, campaign_id FROM deals LIMIT 1');
  if (existingDeal) {
    // Seed KYC for this deal's creator if needed
    const dealRow = await getDbRow('SELECT * FROM deals WHERE id = ?', [existingDeal.id]);
    await submitCreatorKyc({
      creatorId: dealRow.creator_id,
      legalName: dealRow.creator_name || 'Creator Partner',
      panNumber: 'AABPC8888P',
      payoutMethod: 'UPI',
      upiId: 'partner@okhdfcbank',
      tdsSection: '194J'
    });

    const payout = await executeDealPayout({
      dealId: existingDeal.id,
      manualGrossFee: 30000,
      overrideTdsSection: '194J',
      payoutMethod: 'UPI',
      upiId: 'partner@okhdfcbank',
      executedBy: 'Pilot QA Test Runner'
    });

    assert(payout.status === 'PAID', 'Payout executes and returns status PAID');
    assert(payout.grossFee === 30000, 'Gross fee correctly set to ₹30,000');
    assert(payout.tdsAmount === 3000, 'TDS 10% withheld is ₹3,000');
    assert(payout.netPayoutAmount === 27000, 'Net transfer amount is ₹27,000');
    assert(payout.form16a && payout.form16a.voucherNo.startsWith('TDS16A'), 'Generates Form 16A TDS Tax Certificate Voucher');

    const receipt = await getDealPayoutReceipt(existingDeal.id);
    assert(receipt !== null && receipt.payoutRef === payout.payoutRef, 'Immutable payout receipt retrievable from ledger');
  }

  // ---------------------------------------------------------
  // SUITE 5: Shopify HMAC Webhook Verification & Attribution
  // ---------------------------------------------------------
  console.log('\n--- Suite 5: Shopify Attribution Webhooks & Order Deduplication ---');

  const testPayload = JSON.stringify({
    id: 99887766,
    name: '#BOAT-TEST-9988',
    total_price: '4999.00',
    discount_codes: [{ code: 'SAVER20' }],
    landing_site: 'https://boat-lifestyle.com/products/launch?utm_medium=creator_fittuber&discount=SAVER20',
    email: 'customer@gmail.com'
  });

  const parsedOrder = parseShopifyOrderPayload(JSON.parse(testPayload));
  assert(parsedOrder.orderId === '#BOAT-TEST-9988', 'Parses Shopify order ID correctly');
  assert(parsedOrder.orderValue === 4999, 'Parses gross order value (₹4,999)');
  assert(parsedOrder.promoCode === 'SAVER20', 'Extracts promo code SAVER20');
  assert(parsedOrder.utmMedium === 'creator_fittuber', 'Extracts UTM medium parameter');

  // Sandbox pass-through
  const hmacSandbox = verifyShopifyWebhookHmac(testPayload, null, null);
  assert(hmacSandbox.verified === true && hmacSandbox.mode === 'SANDBOX_DEVELOPMENT', 'Sandbox webhook verification passes gracefully when secret is not configured');

  // Record conversion
  const conv = await recordConversion({
    orderId: `#TEST-${Date.now()}`,
    orderValue: 4999,
    promoCode: 'SAVER20',
    utmMedium: 'creator_fittuber',
    customerEmail: 'customer@gmail.com',
    storeProvider: 'SHOPIFY_WEBHOOK'
  });
  assert(conv.success === true, 'Records verified Shopify conversion');

  // ---------------------------------------------------------
  // SUITE 6: Branded Campaign Closeout Report
  // ---------------------------------------------------------
  console.log('\n--- Suite 6: Branded Client Closeout Report ---');

  const report = await generateCampaignCloseoutReport('camp_01');
  assert(report.reportId !== null, 'Generates Closeout Report with unique ID');
  assert(report.shareToken && report.shareToken.startsWith('rep_'), 'Generates secure share token');
  assert(report.shareableUrl.includes('/report/camp_01'), 'Generates shareable read-only URL');
  assert(report.brandTheme && report.brandTheme.primaryColor === '#0f62fe', 'Applies boAt brand visual theme to report');
  assert(report.executiveSummary && report.executiveSummary.performance.asciComplianceRate === '100%', 'Includes 100% ASCI compliance confirmation');
  assert(Array.isArray(report.executiveSummary.aiStrategicNextSteps), 'Includes AI Strategic Next Steps for agency clients');

  const fetchedReport = await getCloseoutReport(report.shareToken);
  assert(fetchedReport.reportTitle.includes('boAt'), 'Retrieves saved closeout report via share token');

  console.log('\n======================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED / ${failed} FAILED (Pass Rate: ${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log('======================================================\n');
}

runPilotReadinessTests().catch(err => {
  console.error('Test Suite Failed with Exception:', err);
  process.exit(1);
});
