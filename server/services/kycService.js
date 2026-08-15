import { v4 as uuidv4 } from 'uuid';
import { getDbRow, queryDb, runDb } from '../database/sqliteDb.js';

// Comprehensive Indian Bank Directory from IFSC prefix (first 4 chars)
const IFSC_BANK_DIRECTORY = {
  HDFC: 'HDFC Bank Ltd',
  SBIN: 'State Bank of India',
  ICIC: 'ICICI Bank Ltd',
  UTIB: 'Axis Bank Ltd',
  KKBK: 'Kotak Mahindra Bank Ltd',
  PUNB: 'Punjab National Bank',
  BARB: 'Bank of Baroda',
  YESB: 'Yes Bank Ltd',
  IDFB: 'IDFC FIRST Bank Ltd',
  INDB: 'IndusInd Bank Ltd',
  CNRB: 'Canara Bank',
  UBIN: 'Union Bank of India',
  IOBA: 'Indian Overseas Bank',
  MAHB: 'Bank of Maharashtra',
  FDRL: 'Federal Bank Ltd',
  CITI: 'Citibank N.A.',
  HSBC: 'HSBC India',
  SCBL: 'Standard Chartered Bank',
  PYTM: 'Paytm Payments Bank',
  AIRP: 'Airtel Payments Bank',
  IPOS: 'India Post Payments Bank',
  JAKA: 'Jammu & Kashmir Bank Ltd',
  RATN: 'RBL Bank Ltd',
  AUBL: 'AU Small Finance Bank Ltd'
};

// Indian PAN Entity Code Matrix (4th character of PAN)
const PAN_ENTITY_TYPES = {
  P: 'Individual (P)',
  C: 'Company (C)',
  F: 'Partnership / LLP Firm (F)',
  H: 'Hindu Undivided Family (H)',
  A: 'Association of Persons (A)',
  T: 'Trust (T)',
  B: 'Body of Individuals (B)',
  L: 'Local Authority (L)',
  J: 'Artificial Juridical Person (J)',
  G: 'Government Entity (G)'
};

/**
 * Validates Indian PAN Number format & extracts legal entity classification.
 */
export function validatePanNumber(pan) {
  if (!pan || typeof pan !== 'string') {
    return { isValid: false, error: 'PAN number is required' };
  }
  const cleanPan = pan.trim().toUpperCase();
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(cleanPan)) {
    return {
      isValid: false,
      pan: cleanPan,
      error: 'Invalid PAN format. Must be 5 letters, 4 digits, and 1 letter (e.g. AABPM1234F)'
    };
  }

  const fourthChar = cleanPan.charAt(3);
  const entityType = PAN_ENTITY_TYPES[fourthChar] || 'Individual (P)';

  return {
    isValid: true,
    pan: cleanPan,
    entityType,
    fourthChar
  };
}

/**
 * Validates Indian GSTIN format.
 */
export function validateGstin(gstin) {
  if (!gstin || typeof gstin !== 'string') {
    return { isValid: true, isApplicable: false, gstin: null };
  }
  const cleanGst = gstin.trim().toUpperCase();
  if (!cleanGst) {
    return { isValid: true, isApplicable: false, gstin: null };
  }

  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(cleanGst)) {
    return {
      isValid: false,
      isApplicable: true,
      gstin: cleanGst,
      error: 'Invalid GSTIN format. Must be 15 alphanumeric characters (e.g. 07AABPM1234F1Z5)'
    };
  }

  const stateCode = cleanGst.substring(0, 2);
  const extractedPan = cleanGst.substring(2, 12);

  return {
    isValid: true,
    isApplicable: true,
    gstin: cleanGst,
    stateCode,
    extractedPan
  };
}

/**
 * Validates Indian Bank IFSC Code & resolves the bank name.
 */
export function validateIfscCode(ifsc) {
  if (!ifsc || typeof ifsc !== 'string') {
    return { isValid: false, error: 'IFSC code is required for bank transfer' };
  }
  const cleanIfsc = ifsc.trim().toUpperCase();
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(cleanIfsc)) {
    return {
      isValid: false,
      ifsc: cleanIfsc,
      error: 'Invalid IFSC format. Must be 4 letters, 0, and 6 alphanumeric chars (e.g. HDFC0000123)'
    };
  }

  const bankCode = cleanIfsc.substring(0, 4);
  const bankName = IFSC_BANK_DIRECTORY[bankCode] || `${bankCode} Scheduled Commercial Bank`;

  return {
    isValid: true,
    ifsc: cleanIfsc,
    bankCode,
    bankName
  };
}

/**
 * Validates UPI ID (Virtual Payment Address).
 */
export function validateUpiId(upiId) {
  if (!upiId || typeof upiId !== 'string') {
    return { isValid: false, error: 'UPI ID is required' };
  }
  const cleanUpi = upiId.trim().toLowerCase();
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,49}$/;
  if (!upiRegex.test(cleanUpi)) {
    return {
      isValid: false,
      upiId: cleanUpi,
      error: 'Invalid UPI ID format (e.g. handle@okhdfcbank or user@upi)'
    };
  }

  const handle = cleanUpi.split('@')[0];
  const psp = cleanUpi.split('@')[1];

  return {
    isValid: true,
    upiId: cleanUpi,
    handle,
    psp
  };
}

/**
 * Computes Indian Income Tax TDS Withholding with statutory rate tiers.
 * 
 * Rules:
 * - Section 194J: 10% (Technical / Professional creator services)
 * - Section 194C: 1% (Contractor video fabrication for Individuals/HUF)
 * - Section 194-O: 1% (E-Commerce marketplace / Promo commission transactions)
 * - Section 206AA Penalty: 20% if valid PAN is missing / invalid
 */
export function calculateTdsWithholding({ grossAmount, tdsSection = '194J', panNumber = '', isPanValid = true }) {
  const numericGross = Number(grossAmount) || 0;
  if (numericGross <= 0) {
    return { grossAmount: 0, tdsRate: 0, tdsAmount: 0, netPayable: 0, tdsSection };
  }

  let tdsRate = 10.0;
  let section = tdsSection ? tdsSection.toUpperCase() : '194J';
  let penaltyApplied = false;

  if (!isPanValid || !panNumber) {
    // Statutory Section 206AA 20% higher withholding penalty
    tdsRate = 20.0;
    section = '206AA (Higher Withholding Penalty)';
    penaltyApplied = true;
  } else {
    switch (section) {
      case '194C':
        tdsRate = 1.0;
        break;
      case '194O':
      case '194-O':
        tdsRate = 1.0;
        section = '194-O';
        break;
      case '194J':
      default:
        tdsRate = 10.0;
        section = '194J';
        break;
    }
  }

  const tdsAmount = Math.round((numericGross * tdsRate) / 100);
  const netPayable = numericGross - tdsAmount;

  return {
    grossAmount: numericGross,
    tdsRate,
    tdsAmount,
    netPayable,
    tdsSection: section,
    penaltyApplied,
    statutoryNote: penaltyApplied 
      ? 'Section 206AA 20% penalty rate applied due to missing or unverified PAN.'
      : `Section ${section} ${tdsRate}% withholding applied per Indian Income Tax Act 1961.`
  };
}

/**
 * Retrieves Creator KYC details from database.
 */
export async function getCreatorKyc(creatorId) {
  if (!creatorId) return null;
  const row = await getDbRow('SELECT * FROM creator_kyc WHERE creator_id = ?', [creatorId]);
  if (!row) return null;

  // Mask sensitive banking data for UI safe display
  return {
    ...row,
    isMasked: true,
    maskedBankAccount: row.bank_account_number 
      ? `••••••••${row.bank_account_number.slice(-4)}` 
      : null,
    maskedPan: row.pan_number 
      ? `${row.pan_number.slice(0, 2)}•••••${row.pan_number.slice(-2)}` 
      : null
  };
}

/**
 * Submits or updates Creator KYC record with validation checks.
 */
export async function submitCreatorKyc({
  creatorId,
  legalName,
  panNumber,
  gstin,
  payoutMethod = 'UPI',
  bankAccountName,
  bankAccountNumber,
  bankIfsc,
  upiId,
  tdsSection = '194J'
}) {
  if (!creatorId) throw new Error('creatorId is required');
  if (!legalName || legalName.trim().length < 2) throw new Error('Valid Legal Name is required');

  // Validate PAN
  const panValidation = validatePanNumber(panNumber);
  if (!panValidation.isValid) {
    throw new Error(panValidation.error);
  }

  // Validate GSTIN if provided
  let cleanGstin = null;
  let gstinStatus = 'NOT_APPLICABLE';
  if (gstin && gstin.trim()) {
    const gstValidation = validateGstin(gstin);
    if (!gstValidation.isValid) {
      throw new Error(gstValidation.error);
    }
    cleanGstin = gstValidation.gstin;
    gstinStatus = 'ACTIVE_VERIFIED';
  }

  // Validate Payout details based on method
  let cleanIfsc = null;
  let bankName = null;
  let cleanUpi = null;
  let upiStatus = 'NOT_APPLICABLE';

  if (payoutMethod === 'BANK_ACCOUNT') {
    if (!bankAccountNumber || bankAccountNumber.trim().length < 6) {
      throw new Error('Valid Bank Account Number is required for Bank Transfer');
    }
    const ifscValidation = validateIfscCode(bankIfsc);
    if (!ifscValidation.isValid) {
      throw new Error(ifscValidation.error);
    }
    cleanIfsc = ifscValidation.ifsc;
    bankName = ifscValidation.bankName;
  } else {
    // Default UPI
    const upiValidation = validateUpiId(upiId);
    if (!upiValidation.isValid) {
      throw new Error(upiValidation.error);
    }
    cleanUpi = upiValidation.upiId;
    upiStatus = 'VERIFIED';
  }

  // Calculate default TDS rate
  const tdsCalculation = calculateTdsWithholding({
    grossAmount: 10000,
    tdsSection,
    panNumber: panValidation.pan,
    isPanValid: true
  });

  const existing = await getDbRow('SELECT id FROM creator_kyc WHERE creator_id = ?', [creatorId]);
  const kycId = existing ? existing.id : 'kyc_' + uuidv4().substring(0, 8);

  const verificationNotes = 'Verified via Automated Format & Entity Code Inspection';

  if (existing) {
    await runDb(
      `UPDATE creator_kyc SET
        legal_name = ?,
        pan_number = ?,
        pan_type = ?,
        pan_status = 'VERIFIED',
        gstin = ?,
        gstin_status = ?,
        payout_method = ?,
        bank_account_name = ?,
        bank_account_number = COALESCE(?, bank_account_number),
        bank_ifsc = ?,
        bank_name = ?,
        upi_id = ?,
        upi_status = ?,
        tds_section = ?,
        tds_rate = ?,
        kyc_status = 'VERIFIED',
        verification_notes = ?,
        verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        legalName.trim(),
        panValidation.pan,
        panValidation.entityType,
        cleanGstin,
        gstinStatus,
        payoutMethod,
        bankAccountName || legalName.trim(),
        bankAccountNumber ? bankAccountNumber.trim() : null,
        cleanIfsc,
        bankName,
        cleanUpi,
        upiStatus,
        tdsCalculation.tdsSection,
        tdsCalculation.tdsRate,
        verificationNotes,
        kycId
      ]
    );
  } else {
    await runDb(
      `INSERT INTO creator_kyc (
        id, creator_id, legal_name, pan_number, pan_type, pan_status, gstin, gstin_status,
        payout_method, bank_account_name, bank_account_number, bank_ifsc, bank_name,
        upi_id, upi_status, tds_section, tds_rate, kyc_status, verification_notes
      ) VALUES (?, ?, ?, ?, ?, 'VERIFIED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', ?)`,
      [
        kycId,
        creatorId,
        legalName.trim(),
        panValidation.pan,
        panValidation.entityType,
        cleanGstin,
        gstinStatus,
        payoutMethod,
        bankAccountName || legalName.trim(),
        bankAccountNumber ? bankAccountNumber.trim() : null,
        cleanIfsc,
        bankName,
        cleanUpi,
        upiStatus,
        tdsCalculation.tdsSection,
        tdsCalculation.tdsRate,
        verificationNotes
      ]
    );
  }

  return await getCreatorKyc(creatorId);
}

/**
 * Admin manual verification or rejection of Creator KYC.
 */
export async function updateKycStatus({ creatorId, kycStatus, notes }) {
  if (!['VERIFIED', 'PENDING', 'REJECTED'].includes(kycStatus)) {
    throw new Error('Invalid KYC status. Must be VERIFIED, PENDING, or REJECTED');
  }

  await runDb(
    `UPDATE creator_kyc SET
      kyc_status = ?,
      verification_notes = COALESCE(?, verification_notes),
      verified_at = CASE WHEN ? = 'VERIFIED' THEN CURRENT_TIMESTAMP ELSE NULL END,
      updated_at = CURRENT_TIMESTAMP
    WHERE creator_id = ?`,
    [kycStatus, notes, kycStatus, creatorId]
  );

  return await getCreatorKyc(creatorId);
}

/**
 * Lists all KYC records with optional status filtering.
 */
export async function listAllKycs({ status = null, limit = 50, offset = 0 } = {}) {
  let sql = `
    SELECT k.*, c.name as creator_handle, c.avatar as creator_avatar, c.followers_raw
    FROM creator_kyc k
    LEFT JOIN creators c ON k.creator_id = c.id
  `;
  const params = [];

  if (status) {
    sql += ' WHERE k.kyc_status = ?';
    params.push(status);
  }

  sql += ' ORDER BY k.updated_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return await queryDb(sql, params);
}
