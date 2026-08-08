import React, { useState } from 'react';
import { 
  Tile, 
  Grid, 
  Column, 
  TextInput, 
  Button, 
  Tag, 
  InlineNotification,
  Loading
} from '@carbon/react';
import { Currency, Checkmark, Edit, DocumentDownload, Send } from '@carbon/icons-react';

export default function PayoutDashboard({ activeDeal }) {
  const deal = activeDeal || {
    id: 'deal_01',
    creatorName: 'Vivek Mittal (Fit Tuber)',
    creatorEmail: 'vivek@fittuber.com',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    currentAgreedPrice: 45000,
    status: 'VERIFIED'
  };

  const [grossFee, setGrossFee] = useState(deal.currentAgreedPrice || 45000);
  const [manualOverrideFee, setManualOverrideFee] = useState('');
  const [upiId, setUpiId] = useState('vivek@upi');
  
  const [payoutResult, setPayoutResult] = useState(deal.payout || null);
  const [loading, setLoading] = useState(false);

  const effectiveGrossFee = manualOverrideFee ? parseInt(manualOverrideFee, 10) : grossFee;
  const tdsAmount = Math.round(effectiveGrossFee * 0.10);
  const netPayoutAmount = effectiveGrossFee - tdsAmount;

  const handleExecutePayout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${deal.id}/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grossPrice: effectiveGrossFee,
          tdsPercent: 10,
          upiId,
          manualOverride: !!manualOverrideFee
        })
      });
      const data = await res.json();
      if (data.deal) {
        setPayoutResult(data.deal.payout);
      }
    } catch (err) {
      console.error("Failed to execute UPI payout", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payout-dashboard-module">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '400', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Currency size={24} style={{ color: '#f1c21b' }} /> Razorpay UPI Settlement & Section 194J 10% TDS Tax Receipt
        </h2>
        <p style={{ color: '#a8a8a8' }}>
          Automated Indian Income Tax Section 194J 10% TDS withholding calculator and instant UPI settlement with manual fee override controls.
        </p>
      </div>

      <Grid style={{ padding: 0, rowGap: '1.5rem', columnGap: '1.5rem' }}>
        {/* Payout Calculation & Inline Fee Override */}
        <Column lg={8} md={8} sm={4}>
          <Tile style={{ padding: '1.75rem', background: '#262626' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem' }}>
              Payout Calculation & Manual Fee Override
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <TextInput
                id="agreed-gross-fee"
                labelText="Agreed Gross Fee (₹)"
                value={`₹${grossFee.toLocaleString('en-IN')}`}
                disabled
              />

              <div style={{ background: '#161616', padding: '1rem', borderRadius: '4px', border: '1px solid #393939' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f1c21b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Edit size={16} /> Manual Payout Fee Override (₹)
                  </span>
                  <Tag type={manualOverrideFee ? "purple" : "gray"} size="sm">
                    {manualOverrideFee ? "Manual Fee Applied" : "AI Auto-Calculated"}
                  </Tag>
                </div>
                <TextInput
                  id="manual-fee-override-input"
                  labelText=""
                  placeholder="Override gross fee in ₹ (e.g. 50000)"
                  value={manualOverrideFee}
                  onChange={(e) => setManualOverrideFee(e.target.value)}
                  helperText="Leave empty to use agreed rate, or type custom amount in ₹."
                />
              </div>

              <TextInput
                id="upi-id-input"
                labelText="Creator UPI ID (PhonePe / GPay / Paytm)"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                required
              />
            </div>

            <Button kind="primary" renderIcon={Send} disabled={loading} onClick={handleExecutePayout} style={{ width: '100%' }}>
              {loading ? "Settling Payout via Razorpay UPI..." : `Execute Instant UPI Payout (₹${netPayoutAmount.toLocaleString('en-IN')})`}
            </Button>
          </Tile>
        </Column>

        {/* Section 194J 10% TDS Receipt Breakdown */}
        <Column lg={8} md={8} sm={4}>
          <Tile style={{ padding: '1.75rem', background: '#262626' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem' }}>
              Section 194J Tax & Net Settlement Summary
            </h4>

            <div style={{ background: '#161616', padding: '1.25rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ color: '#a8a8a8' }}>Agreed Gross Commercial Fee:</span>
                <span style={{ fontWeight: '600', color: '#f4f4f4' }}>₹{effectiveGrossFee.toLocaleString('en-IN')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ color: '#da1e28' }}>10% TDS Withholding (Sec 194J):</span>
                <span style={{ fontWeight: '600', color: '#da1e28' }}>- ₹{tdsAmount.toLocaleString('en-IN')}</span>
              </div>

              <hr style={{ borderColor: '#393939', margin: '0.25rem 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '700' }}>
                <span style={{ color: '#42be65' }}>Net Instant UPI Payout:</span>
                <span style={{ color: '#42be65' }}>₹{netPayoutAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {payoutResult && (
              <div style={{ marginTop: '1.5rem', background: '#161616', padding: '1rem', borderRadius: '4px', borderLeft: '4px solid #42be65' }}>
                <div style={{ fontWeight: '600', color: '#42be65', marginBottom: '0.25rem' }}>
                  ✓ Razorpay Instant UPI Settlement Executed!
                </div>
                <div style={{ fontSize: '0.85rem', color: '#a8a8a8' }}>
                  Transaction Ref ID: <strong>{payoutResult.transactionRef || 'upi_rzp_98a72b'}</strong>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <Button size="sm" kind="tertiary" renderIcon={DocumentDownload}>
                    Download Form 16A TDS Tax Receipt
                  </Button>
                </div>
              </div>
            )}
          </Tile>
        </Column>
      </Grid>
    </div>
  );
}
