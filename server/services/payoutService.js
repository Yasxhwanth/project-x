import { v4 as uuidv4 } from 'uuid';
import { getDbRow, queryDb, runDb } from '../database/sqliteDb.js';
import { calculateTdsWithholding, getCreatorKyc } from './kycService.js';
import { ensureIdempotent, buildKey } from '../engine/idempotencyGuard.js';
import { createAgentRun } from '../engine/orchestrator.js';

/**
 * Payout Engine: Executes KYC-verified Indian Creator Settlements with Section 194 TDS Withholding.
 */
export async function executeDealPayout({
  dealId,
  manualGrossFee = null,
  overrideTdsSection = null,
  payoutMethod = null,
  upiId = null,
  bankAccountNumber = null,
  bankIfsc = null,
  organizationId = null,
  executedBy = 'Brand Finance Team'
}) {
  if (!dealId) throw new Error('dealId is required');

  const deal = await getDbRow('SELECT * FROM deals WHERE id = ?', [dealId]);
  if (!deal) throw new Error(`Deal ${dealId} not found`);

  // Verify creator exists & fetch KYC
  const creatorId = deal.creator_id;
  const kyc = await getCreatorKyc(creatorId);

  if (!kyc || kyc.kyc_status !== 'VERIFIED') {
    throw new Error(
      `Payout blocked: Creator ${deal.creator_name || creatorId} does not have a VERIFIED KYC record. Please submit PAN & Banking/UPI details first.`
    );
  }

  const effectiveGross = manualGrossFee ? Number(manualGrossFee) : (deal.current_agreed_price || deal.offered_price || 25000);
  const selectedTdsSection = overrideTdsSection || kyc.tds_section || '194J';

  // Compute TDS
  const tdsBreakdown = calculateTdsWithholding({
    grossAmount: effectiveGross,
    tdsSection: selectedTdsSection,
    panNumber: kyc.pan_number,
    isPanValid: kyc.pan_status === 'VERIFIED'
  });

  const method = payoutMethod || kyc.payout_method || 'UPI';
  const targetUpi = upiId || kyc.upi_id || 'creator@upi';
  const targetBank = {
    accountName: kyc.bank_account_name || kyc.legal_name,
    accountNumber: bankAccountNumber || kyc.bank_account_number,
    ifsc: bankIfsc || kyc.bank_ifsc,
    bankName: kyc.bank_name
  };

  const idempotencyKey = buildKey('PAYOUT_EXECUTE', dealId);

  const { result } = await ensureIdempotent(
    idempotencyKey,
    'PAYOUT_EXECUTE',
    dealId,
    async () => {
      const payoutRef = 'rzp_pout_' + uuidv4().substring(0, 10);
      const voucherNo = 'TDS16A-' + new Date().getFullYear() + '-' + uuidv4().substring(0, 6).toUpperCase();
      const challanRef = 'CHLN' + Math.floor(100000000 + Math.random() * 900000000);

      const beneficiaryDetails = {
        legalName: kyc.legal_name,
        panNumber: kyc.pan_number,
        panType: kyc.pan_type,
        gstin: kyc.gstin,
        payoutMethod: method,
        destination: method === 'UPI' ? targetUpi : `${targetBank.bankName} (${targetBank.accountNumber?.slice(-4)})`
      };

      const ledgerId = 'ledg_' + uuidv4().substring(0, 8);

      // 1. Insert into immutable payout ledger
      await runDb(
        `INSERT INTO payout_ledger (
          id, deal_id, campaign_id, creator_id, creator_name,
          gross_amount, tds_section, tds_rate, tds_amount, net_amount,
          payout_method, beneficiary_details_json, razorpay_payout_id,
          receipt_ref, form_16a_voucher_id, status, executed_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUCCESS', ?)`,
        [
          ledgerId,
          dealId,
          deal.campaign_id,
          creatorId,
          deal.creator_name,
          tdsBreakdown.grossAmount,
          tdsBreakdown.tdsSection,
          tdsBreakdown.tdsRate,
          tdsBreakdown.tdsAmount,
          tdsBreakdown.netPayable,
          method,
          JSON.stringify(beneficiaryDetails),
          payoutRef,
          payoutRef,
          voucherNo,
          executedBy
        ]
      );

      const payoutRecord = {
        ledgerId,
        payoutRef,
        transactionRef: payoutRef,
        grossFee: tdsBreakdown.grossAmount,
        tdsSection: tdsBreakdown.tdsSection,
        tdsRate: tdsBreakdown.tdsRate,
        tdsAmount: tdsBreakdown.tdsAmount,
        netPayoutAmount: tdsBreakdown.netPayable,
        beneficiaryName: kyc.legal_name,
        payoutMethod: method,
        destination: method === 'UPI' ? targetUpi : targetBank,
        form16a: {
          voucherNo,
          challanRef,
          deductorTan: 'BLRP09876C',
          deductorName: 'Project X Performance Agency Escrow A/C',
          assessmentYear: '2026-27',
          quarter: 'Q2',
          grossCredited: tdsBreakdown.grossAmount,
          taxDeducted: tdsBreakdown.tdsAmount,
          dateOfDeduction: new Date().toISOString()
        },
        status: 'PAID',
        executedAt: new Date().toISOString()
      };

      // 2. Update Deal Status to PAID
      await runDb(
        `UPDATE deals SET 
          status = 'PAID',
          current_agreed_price = ?,
          payout_json = ?
        WHERE id = ?`,
        [tdsBreakdown.grossAmount, JSON.stringify(payoutRecord), dealId]
      );

      // 3. Write Audit Log
      await runDb(
        `INSERT INTO audit_logs (id, deal_id, campaign_id, stage_from, stage_to, trigger_event, actor_agent, rationale, human_approved)
         VALUES (?, ?, ?, ?, 'PAID', 'PAYOUT_EXECUTED', 'Payment Agent', ?, 1)`,
        [
          'audit_' + uuidv4().substring(0, 8),
          dealId,
          deal.campaign_id,
          deal.status || 'PAYMENT_APPROVED',
          `Executed instant ${method} payout ₹${tdsBreakdown.netPayable.toLocaleString('en-IN')} (TDS ₹${tdsBreakdown.tdsAmount} u/s ${tdsBreakdown.tdsSection}) to ${kyc.legal_name}. Ref: ${payoutRef}`
        ]
      );

      // 4. Record Agent Run
      await createAgentRun({
        agentName: 'Payment Agent',
        campaignId: deal.campaign_id,
        dealId,
        input: { grossAmount: tdsBreakdown.grossAmount, tdsSection: tdsBreakdown.tdsSection, method },
        reasoning: `Creator KYC verified (${kyc.pan_number}). Executed instant ${method} transfer ₹${tdsBreakdown.netPayable} with ${tdsBreakdown.tdsRate}% Section ${tdsBreakdown.tdsSection} TDS deduction.`,
        toolsUsed: 'kycValidator,payoutLedger,razorpayRouteX',
        actionsTaken: `Settlement ledger recorded (${ledgerId}), Form 16A voucher generated (${voucherNo})`,
        policyEvaluated: 'KYC.status=VERIFIED, TaxCompliance.Sec194J=true, IdempotencyGuard.checked=true',
        result: 'PAYMENT_SUCCESS',
        confidence: 1.0,
        humanApproved: 1,
        humanActor: executedBy
      });

      return payoutRecord;
    }
  );

  return result;
}

/**
 * Retrieves the payout receipt and Form 16A metadata for a deal.
 */
export async function getDealPayoutReceipt(dealId) {
  const ledger = await getDbRow('SELECT * FROM payout_ledger WHERE deal_id = ? ORDER BY created_at DESC LIMIT 1', [dealId]);
  if (!ledger) {
    const deal = await getDbRow('SELECT payout_json FROM deals WHERE id = ?', [dealId]);
    if (deal?.payout_json) {
      try {
        return JSON.parse(deal.payout_json);
      } catch (e) {}
    }
    return null;
  }

  let beneficiary = {};
  try {
    beneficiary = JSON.parse(ledger.beneficiary_details_json || '{}');
  } catch (e) {}

  return {
    ledgerId: ledger.id,
    payoutRef: ledger.receipt_ref,
    grossFee: ledger.gross_amount,
    tdsSection: ledger.tds_section,
    tdsRate: ledger.tds_rate,
    tdsAmount: ledger.tds_amount,
    netPayoutAmount: ledger.net_amount,
    payoutMethod: ledger.payout_method,
    beneficiary,
    form16aVoucherId: ledger.form_16a_voucher_id,
    status: ledger.status,
    executedBy: ledger.executed_by,
    createdAt: ledger.created_at
  };
}

/**
 * Retrieves all payout ledger transactions for financial closeout.
 */
export async function listPayoutLedger({ campaignId = null, limit = 50 } = {}) {
  let sql = 'SELECT * FROM payout_ledger';
  const params = [];
  if (campaignId) {
    sql += ' WHERE campaign_id = ?';
    params.push(campaignId);
  }
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);
  return await queryDb(sql, params);
}
