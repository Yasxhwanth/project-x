import React, { useState, useEffect } from 'react';
import { 
  Tile, 
  Grid, 
  Column, 
  TextInput, 
  Button, 
  Tag, 
  InlineNotification,
  Loading,
  Select,
  SelectItem
} from '@carbon/react';
import { 
  Currency, 
  Checkmark, 
  Edit, 
  DocumentDownload, 
  Send,
  Identification,
  CheckmarkFilled,
  WarningAltFilled,
  Receipt,
  Finance
} from '@carbon/icons-react';
import CreatorKycModal from './CreatorKycModal';

export default function PayoutDashboard({ activeDeal }) {
  const deal = activeDeal || {
    id: 'deal_01',
    creatorId: 'cr_yt_fittuber',
    creatorName: 'Vivek Mittal (Fit Tuber)',
    creatorEmail: 'vivek@fittuber.com',
    creatorAvatar: 'https://ui-avatars.com/api/?name=Vivek%20Mittal&background=e65100&color=ffffff&bold=true&size=256',
    currentAgreedPrice: 45000,
    status: 'VERIFIED'
  };

  const [grossFee, setGrossFee] = useState(deal.currentAgreedPrice || 45000);
  const [manualOverrideFee, setManualOverrideFee] = useState('');
  const [tdsSection, setTdsSection] = useState('194J');
  const [upiId, setUpiId] = useState('vivek@upi');
  
  const [kycData, setKycData] = useState(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);

  const [payoutResult, setPayoutResult] = useState(deal.payout || null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (deal?.creator_id || deal?.creatorId) {
      const cId = deal.creator_id || deal.creatorId;
      fetchKyc(cId);
    }
  }, [deal]);

  const fetchKyc = async (creatorId) => {
    setKycLoading(true);
    try {
      const res = await fetch(`/api/creators/${creatorId}/kyc`);
      const data = await res.json();
      if (data.success && data.kyc) {
        setKycData(data.kyc);
        if (data.kyc.upi_id) setUpiId(data.kyc.upi_id);
        if (data.kyc.tds_section) setTdsSection(data.kyc.tds_section);
      } else {
        setKycData(null);
      }
    } catch (e) {
      console.error('Failed to load KYC for deal creator:', e);
    } finally {
      setKycLoading(false);
    }
  };

  const effectiveGrossFee = manualOverrideFee ? parseInt(manualOverrideFee, 10) : grossFee;
  const tdsRate = tdsSection === '194C' ? 1.0 : (tdsSection === '194O' ? 1.0 : 10.0);
  const tdsAmount = Math.round(effectiveGrossFee * (tdsRate / 100));
  const netPayoutAmount = effectiveGrossFee - tdsAmount;

  const isKycVerified = kycData?.kyc_status === 'VERIFIED';

  const handleExecutePayout = async () => {
    if (!isKycVerified) {
      setErrorMsg('Creator KYC is missing or unverified. Please complete KYC verification before releasing funds.');
      setKycModalOpen(true);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/deals/${deal.id}/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grossPrice: effectiveGrossFee,
          tdsSection,
          payoutMethod: kycData?.payout_method || 'UPI',
          upiId: upiId || kycData?.upi_id,
          executedBy: 'Brand Finance Lead'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Payout execution failed');
      }
      if (data.payout) {
        setPayoutResult(data.payout);
      }
    } catch (err) {
      console.error("Failed to execute payout:", err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      
      {/* ─── Hero Header ──────────────────────────────────────────────────── */}
      <div className="hero-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Payouts & Section 194J TDS Settlement</h1>
            <p>
              Statutory Indian Income Tax Section 194J/194C TDS withholding calculator, PAN validation, and instant automated bank / UPI settlement.
            </p>
          </div>

          <Button
            kind={isKycVerified ? "secondary" : "primary"}
            size="md"
            renderIcon={Identification}
            onClick={() => setKycModalOpen(true)}
          >
            {isKycVerified ? "View / Edit Creator KYC" : "Verify Creator KYC (Required)"}
          </Button>
        </div>
      </div>

      {/* ─── KYC Compliance Status Ribbon ─────────────────────────────────── */}
      <Tile 
        style={{
          background: isKycVerified ? 'rgba(66, 190, 101, 0.08)' : 'rgba(218, 30, 40, 0.08)',
          border: `1px solid ${isKycVerified ? 'rgba(66, 190, 101, 0.3)' : 'rgba(218, 30, 40, 0.3)'}`,
          borderLeft: `4px solid ${isKycVerified ? '#42be65' : '#da1e28'}`,
          borderRadius: 6,
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isKycVerified ? (
            <CheckmarkFilled size={22} style={{ color: '#42be65' }} />
          ) : (
            <WarningAltFilled size={22} style={{ color: '#da1e28' }} />
          )}
          <div>
            <div style={{ fontWeight: 600, color: '#f4f4f4', fontSize: '0.95rem' }}>
              {isKycVerified ? `KYC Verified: ${kycData.legal_name} (PAN: ${kycData.maskedPan || kycData.pan_number})` : 'Creator KYC Verification Incomplete'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#a8a8a8' }}>
              {isKycVerified
                ? `Payout Destination: ${kycData.payout_method === 'UPI' ? `UPI (${kycData.upi_id})` : `${kycData.bank_name} (${kycData.maskedBankAccount})`}`
                : 'Indian Tax Regulations require verified PAN and bank/UPI destination before disbursing commercial payments.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Tag type={isKycVerified ? "green" : "red"} size="md">
            {isKycVerified ? "KYC APPROVED • COMPLIANT" : "ACTION REQUIRED"}
          </Tag>
          {!isKycVerified && (
            <Button size="sm" kind="danger--tertiary" onClick={() => setKycModalOpen(true)}>
              Complete KYC
            </Button>
          )}
        </div>
      </Tile>

      {errorMsg && (
        <InlineNotification
          kind="error"
          title="Payout Action Blocked"
          subtitle={errorMsg}
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      {/* ─── Main 16-Column Layout ────────────────────────────────────────── */}
      <Grid fullWidth style={{ padding: 0, rowGap: '1.25rem', columnGap: '1.25rem' }}>
        
        {/* Left Column: Payout Calculation & Overrides */}
        <Column lg={8} md={8} sm={4}>
          <Tile style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6 }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f4f4f4', marginBottom: '1.25rem' }}>
              Settlement Calculation & Fee Overrides
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <TextInput
                id="agreed-gross-fee"
                labelText="Agreed Commercial Gross Fee (INR ₹)"
                value={`₹${grossFee.toLocaleString('en-IN')}`}
                disabled
              />

              <div style={{ background: '#111111', padding: '1rem', borderRadius: 4, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1c21b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Edit size={15} /> Manual Fee Override (₹)
                  </span>
                  <Tag type={manualOverrideFee ? "purple" : "gray"} size="sm">
                    {manualOverrideFee ? "Manual Override" : "Agreed Deal Value"}
                  </Tag>
                </div>
                <TextInput
                  id="manual-fee-override-input"
                  labelText=""
                  placeholder="Override gross fee in ₹ (e.g. 50000)"
                  value={manualOverrideFee}
                  onChange={(e) => setManualOverrideFee(e.target.value)}
                  helperText="Leave empty to use agreed deal fee, or enter custom INR amount."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Select
                  id="payout-tds-section"
                  labelText="Applicable Tax Section"
                  value={tdsSection}
                  onChange={(e) => setTdsSection(e.target.value)}
                >
                  <SelectItem value="194J" text="Sec 194J (10% Professional Services)" />
                  <SelectItem value="194C" text="Sec 194C (1% Contractor Video Work)" />
                  <SelectItem value="194O" text="Sec 194-O (1% E-Commerce Marketplace)" />
                </Select>

                <TextInput
                  id="upi-id-input"
                  labelText="Beneficiary UPI VPA"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  disabled={!isKycVerified}
                  required
                />
              </div>
            </div>

            <Button
              kind="primary"
              renderIcon={Send}
              disabled={loading || !isKycVerified}
              onClick={handleExecutePayout}
              style={{ width: '100%', maxWidth: 'none' }}
            >
              {loading ? "Settling via RouteX UPI..." : `Execute Verified Payout (₹${netPayoutAmount.toLocaleString('en-IN')})`}
            </Button>
          </Tile>
        </Column>

        {/* Right Column: Statutory Form 16A Breakdown */}
        <Column lg={8} md={8} sm={4}>
          <Tile style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6 }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f4f4f4', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={18} style={{ color: '#42be65' }} /> Indian Income Tax Withholding Summary
            </h4>

            <div style={{ background: '#111111', padding: '1.25rem', borderRadius: 4, border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ color: '#a8a8a8' }}>Agreed Gross Commercial Fee:</span>
                <span style={{ fontWeight: 600, color: '#f4f4f4' }}>₹{effectiveGrossFee.toLocaleString('en-IN')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ color: '#ff8389' }}>{tdsRate}% TDS Withholding (Sec {tdsSection}):</span>
                <span style={{ fontWeight: 600, color: '#ff8389' }}>- ₹{tdsAmount.toLocaleString('en-IN')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#8d8d8d' }}>
                <span>Beneficiary PAN:</span>
                <span>{kycData?.maskedPan || (isKycVerified ? kycData?.pan_number : 'PAN NOT LINKED')}</span>
              </div>

              <hr style={{ borderColor: 'rgba(255, 255, 255, 0.08)', margin: '0.25rem 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 700 }}>
                <span style={{ color: '#42be65' }}>Net Instant Bank / UPI Disbursement:</span>
                <span style={{ color: '#42be65' }}>₹{netPayoutAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {payoutResult && (
              <div style={{ marginTop: '1.5rem', background: '#111111', padding: '1.25rem', borderRadius: 4, borderLeft: '4px solid #42be65', border: '1px solid rgba(66, 190, 101, 0.3)', borderLeftWidth: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#42be65', marginBottom: '0.35rem' }}>
                  <CheckmarkFilled size={18} /> Razorpay UPI Payout Settled Successfully!
                </div>
                <div style={{ fontSize: '0.85rem', color: '#c6c6c6', marginBottom: '0.25rem' }}>
                  Transaction Ref: <strong>{payoutResult.transactionRef || payoutResult.payoutRef}</strong>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#c6c6c6', marginBottom: '0.75rem' }}>
                  Form 16A Voucher: <strong>{payoutResult.form16a?.voucherNo || 'TDS16A-2026-V889'}</strong>
                </div>
                <div>
                  <Button
                    size="sm"
                    kind="tertiary"
                    renderIcon={DocumentDownload}
                    onClick={() => {
                      alert(`Form 16A TDS Tax Certificate:\n\nCertificate No: ${payoutResult.form16a?.voucherNo || 'TDS16A-2026'}\nDeductor TAN: BLRP09876C\nDeductee PAN: ${kycData?.pan_number || 'AABPM1234F'}\nGross Credited: ₹${effectiveGrossFee.toLocaleString('en-IN')}\nTax Deposited: ₹${tdsAmount.toLocaleString('en-IN')}`);
                    }}
                  >
                    Download Form 16A TDS Certificate
                  </Button>
                </div>
              </div>
            )}
          </Tile>
        </Column>
      </Grid>

      {/* KYC Modal */}
      <CreatorKycModal
        open={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
        creator={{
          id: deal.creator_id || deal.creatorId,
          name: deal.creator_name || deal.creatorName,
          handle: deal.creatorEmail || 'creator'
        }}
        onKycUpdated={(updatedKyc) => {
          setKycData(updatedKyc);
          if (updatedKyc.upi_id) setUpiId(updatedKyc.upi_id);
          if (updatedKyc.tds_section) setTdsSection(updatedKyc.tds_section);
        }}
      />
    </div>
  );
}
