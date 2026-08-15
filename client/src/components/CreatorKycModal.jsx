import React, { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  RadioButtonGroup,
  RadioButton,
  Select,
  SelectItem,
  InlineNotification,
  Tag,
  Button,
  Loading
} from '@carbon/react';
import {
  Identification,
  Currency,
  CheckmarkFilled,
  WarningFilled
} from '@carbon/icons-react';

export default function CreatorKycModal({ open, onClose, creator, onKycUpdated }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form State
  const [legalName, setLegalName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [panEntityType, setPanEntityType] = useState('Individual (P)');
  const [panError, setPanError] = useState('');
  
  const [gstin, setGstin] = useState('');
  const [gstinError, setGstinError] = useState('');

  const [payoutMethod, setPayoutMethod] = useState('UPI'); // 'UPI' | 'BANK_ACCOUNT'
  
  // UPI
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState('');

  // Bank
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscError, setIfscError] = useState('');

  // Tax
  const [tdsSection, setTdsSection] = useState('194J');

  // Existing KYC record
  const [existingKyc, setExistingKyc] = useState(null);

  useEffect(() => {
    if (open && creator?.id) {
      fetchExistingKyc(creator.id);
    }
  }, [open, creator]);

  const fetchExistingKyc = async (creatorId) => {
    setLoading(true);
    setNotification(null);
    try {
      const res = await fetch(`/api/creators/${creatorId}/kyc`);
      const data = await res.json();
      if (data.success && data.kyc) {
        const k = data.kyc;
        setExistingKyc(k);
        setLegalName(k.legal_name || creator?.name || '');
        setPanNumber(k.pan_number || '');
        setPanEntityType(k.pan_type || 'Individual (P)');
        setGstin(k.gstin || '');
        setPayoutMethod(k.payout_method || 'UPI');
        setUpiId(k.upi_id || '');
        setBankAccountName(k.bank_account_name || k.legal_name || '');
        setBankAccountNumber(k.bank_account_number || '');
        setBankIfsc(k.bank_ifsc || '');
        setBankName(k.bank_name || '');
        setTdsSection(k.tds_section || '194J');
      } else {
        // Preset defaults for new submission
        setExistingKyc(null);
        setLegalName(creator?.name || '');
        setPanNumber('');
        setGstin('');
        setUpiId('');
        setBankAccountNumber('');
        setBankIfsc('');
        setBankName('');
      }
    } catch (err) {
      console.error('Failed to fetch creator KYC:', err);
    } finally {
      setLoading(false);
    }
  };

  // PAN Validation on blur / change
  const handlePanChange = (val) => {
    const clean = val.toUpperCase().trim();
    setPanNumber(clean);
    setPanError('');
    if (clean.length === 10) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(clean)) {
        setPanError('Invalid PAN format (e.g. AABPM1234F)');
      } else {
        const char4 = clean.charAt(3);
        if (char4 === 'P') setPanEntityType('Individual (P)');
        else if (char4 === 'C') setPanEntityType('Company (C)');
        else if (char4 === 'F') setPanEntityType('Firm / LLP (F)');
        else setPanEntityType(`Entity (${char4})`);
      }
    }
  };

  // IFSC Validation & Bank Directory Lookup
  const handleIfscChange = (val) => {
    const clean = val.toUpperCase().trim();
    setBankIfsc(clean);
    setIfscError('');
    if (clean.length >= 4) {
      const prefix = clean.substring(0, 4);
      const directory = {
        HDFC: 'HDFC Bank Ltd',
        SBIN: 'State Bank of India',
        ICIC: 'ICICI Bank Ltd',
        UTIB: 'Axis Bank Ltd',
        KKBK: 'Kotak Mahindra Bank Ltd',
        YESB: 'Yes Bank Ltd',
        PUNB: 'Punjab National Bank'
      };
      if (directory[prefix]) {
        setBankName(directory[prefix]);
      }
    }
    if (clean.length === 11) {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(clean)) {
        setIfscError('Invalid IFSC code (e.g. HDFC0000123)');
      }
    }
  };

  // UPI Validation
  const handleUpiChange = (val) => {
    const clean = val.toLowerCase().trim();
    setUpiId(clean);
    setUpiError('');
    if (clean.length > 5 && !clean.includes('@')) {
      setUpiError('UPI ID must include @bank (e.g. handle@okhdfcbank)');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!panNumber || panNumber.length !== 10) {
      setPanError('A valid 10-digit PAN is mandatory for Indian tax compliance');
      return;
    }
    if (payoutMethod === 'UPI' && (!upiId || !upiId.includes('@'))) {
      setUpiError('A valid UPI ID is required for UPI payout');
      return;
    }
    if (payoutMethod === 'BANK_ACCOUNT' && (!bankAccountNumber || !bankIfsc)) {
      setIfscError('Account Number & IFSC Code are required for Bank Transfer');
      return;
    }

    setSubmitting(true);
    setNotification(null);

    try {
      const res = await fetch(`/api/creators/${creator.id}/kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legalName,
          panNumber,
          gstin,
          payoutMethod,
          upiId,
          bankAccountName: bankAccountName || legalName,
          bankAccountNumber,
          bankIfsc,
          tdsSection
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to verify & save KYC');
      }

      setNotification({
        kind: 'success',
        title: 'KYC Verified Successfully!',
        subtitle: `PAN ${data.kyc.pan_number} linked with ${data.kyc.tds_section} (${data.kyc.tds_rate}% TDS). Status: VERIFIED.`
      });

      setExistingKyc(data.kyc);
      if (onKycUpdated) onKycUpdated(data.kyc);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setNotification({
        kind: 'error',
        title: 'KYC Verification Failed',
        subtitle: err.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      modalHeading="Creator KYC & Indian Tax Banking Compliance"
      modalLabel={creator?.name ? `Creator: ${creator.name} (${creator.handle || 'Verified Profile'})` : 'Tax & Banking Setup'}
      primaryButtonText={submitting ? 'Verifying & Saving...' : 'Verify & Lock KYC'}
      secondaryButtonText="Cancel"
      onRequestSubmit={handleSubmit}
      primaryButtonDisabled={submitting || loading}
      size="md"
    >
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <Loading description="Loading KYC Records..." withOverlay={false} />
        </div>
      ) : (
        <div style={{ padding: '0.5rem 0' }}>
          {/* Status Header Badge */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: existingKyc?.kyc_status === 'VERIFIED' ? 'rgba(66, 190, 101, 0.15)' : 'rgba(241, 194, 27, 0.15)',
            border: `1px solid ${existingKyc?.kyc_status === 'VERIFIED' ? '#42be65' : '#f1c21b'}`,
            borderRadius: '4px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {existingKyc?.kyc_status === 'VERIFIED' ? (
                <CheckmarkFilled size={20} style={{ color: '#42be65' }} />
              ) : (
                <WarningFilled size={20} style={{ color: '#f1c21b' }} />
              )}
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                  {existingKyc?.kyc_status === 'VERIFIED' ? 'KYC Status: Verified & Ready for Payout' : 'KYC Status: Pending Verification'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#c6c6c6' }}>
                  {existingKyc?.verification_notes || 'Requires valid Indian PAN and Bank / UPI for statutory Section 194 TDS withholding.'}
                </div>
              </div>
            </div>
            <Tag type={existingKyc?.kyc_status === 'VERIFIED' ? 'green' : 'warm-gray'} size="md">
              {existingKyc?.kyc_status === 'VERIFIED' ? 'VERIFIED' : 'PENDING'}
            </Tag>
          </div>

          {notification && (
            <InlineNotification
              kind={notification.kind}
              title={notification.title}
              subtitle={notification.subtitle}
              style={{ marginBottom: '1rem' }}
            />
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Section 1: Legal Identity & PAN */}
            <div style={{ background: '#161616', padding: '1rem', borderRadius: '4px', border: '1px solid #393939' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f62fe', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Identification size={16} /> 1. LEGAL IDENTITY & INCOME TAX PAN
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                <TextInput
                  id="kyc-legal-name"
                  labelText="Legal Name (as on PAN card)"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="e.g. Vivek Mittal"
                  required
                />

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label className="cds--label" htmlFor="kyc-pan-number" style={{ margin: 0 }}>
                      Permanent Account Number (PAN) *
                    </label>
                    {panEntityType && (
                      <span style={{ fontSize: '0.75rem', color: '#42be65', fontWeight: '600' }}>
                        {panEntityType}
                      </span>
                    )}
                  </div>
                  <TextInput
                    id="kyc-pan-number"
                    labelText=""
                    value={panNumber}
                    onChange={(e) => handlePanChange(e.target.value)}
                    placeholder="e.g. AABPM1234F"
                    invalid={!!panError}
                    invalidText={panError}
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <TextInput
                  id="kyc-gstin"
                  labelText="GSTIN (Optional / If Registered)"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 07AABPM1234F1Z5"
                  helperText="Required only if annual creator revenue exceeds ₹20 Lakhs."
                />

                <Select
                  id="kyc-tds-section"
                  labelText="Applicable TDS Withholding Section"
                  value={tdsSection}
                  onChange={(e) => setTdsSection(e.target.value)}
                >
                  <SelectItem value="194J" text="Sec 194J — 10% (Technical / Professional Content Services)" />
                  <SelectItem value="194C" text="Sec 194C — 1% (Contractor Video Production Services)" />
                  <SelectItem value="194O" text="Sec 194-O — 1% (E-Commerce / Affiliate Promo Sales)" />
                </Select>
              </div>
            </div>

            {/* Section 2: Payout Destination */}
            <div style={{ background: '#161616', padding: '1rem', borderRadius: '4px', border: '1px solid #393939' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#42be65', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Currency size={16} /> 2. PAYOUT SETTLEMENT DESTINATION
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <RadioButtonGroup
                  name="payout-method-group"
                  valueSelected={payoutMethod}
                  onChange={(val) => setPayoutMethod(val)}
                  legendText="Preferred Settlement Channel"
                >
                  <RadioButton
                    value="UPI"
                    id="method-upi"
                    labelText="Instant UPI (GPay / PhonePe / Paytm / BHIM)"
                  />
                  <RadioButton
                    value="BANK_ACCOUNT"
                    id="method-bank"
                    labelText="Direct Bank Transfer (NEFT / RTGS / IMPS)"
                  />
                </RadioButtonGroup>
              </div>

              {payoutMethod === 'UPI' ? (
                <TextInput
                  id="kyc-upi-id"
                  labelText="Creator UPI Virtual Payment Address (VPA) *"
                  value={upiId}
                  onChange={(e) => handleUpiChange(e.target.value)}
                  placeholder="e.g. vivek@okhdfcbank or creator@upi"
                  invalid={!!upiError}
                  invalidText={upiError}
                  helperText="Instant 24x7 automated disbursement via Razorpay RouteX UPI rails."
                  required
                />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <TextInput
                    id="kyc-bank-acct"
                    labelText="Bank Account Number *"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="e.g. 50200012345678"
                    required
                  />

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <label className="cds--label" htmlFor="kyc-ifsc" style={{ margin: 0 }}>
                        Bank IFSC Code *
                      </label>
                      {bankName && (
                        <span style={{ fontSize: '0.75rem', color: '#42be65', fontWeight: '600' }}>
                          {bankName}
                        </span>
                      )}
                    </div>
                    <TextInput
                      id="kyc-ifsc"
                      labelText=""
                      value={bankIfsc}
                      onChange={(e) => handleIfscChange(e.target.value)}
                      placeholder="e.g. HDFC0000123"
                      invalid={!!ifscError}
                      invalidText={ifscError}
                      maxLength={11}
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Compliance Guarantee Note */}
            <div style={{ fontSize: '0.75rem', color: '#8d8d8d', background: '#262626', padding: '0.75rem', borderRadius: '4px' }}>
              🔒 <strong>Statutory Indian Tax Note:</strong> PAN details are cryptographically hashed and verified against NSDL/CBDT format specifications. Form 16A TDS Tax Withholding certificates are generated quarterly per Section 203 of the Income Tax Act, 1961.
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
}
