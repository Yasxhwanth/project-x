/**
 * IBM Carbon Design System (g100 / Enterprise Dark Architecture)
 * Responsive HTML Email Card & Header Generator for Creator Partnerships
 */

export function buildBrandedEmailHtml({
  recipientName = 'Creator',
  senderName = 'boAt Creator Partnerships',
  brandName = 'boAt Lifestyle',
  productName = 'boAt Airdopes Pro Max 500',
  offeredPrice = 25000,
  mandatoryPhrase = 'Use code SAVER20 for 20% off',
  promoCode = 'SAVER20',
  bodyText = ''
}) {
  const formattedFee = Number(offeredPrice).toLocaleString('en-IN');
  const tdsAmount = Math.round(Number(offeredPrice) * 0.10).toLocaleString('en-IN');
  const netAmount = (Number(offeredPrice) - Math.round(Number(offeredPrice) * 0.10)).toLocaleString('en-IN');

  const formattedBody = bodyText
    ? bodyText.split('\n\n').map(p => `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #c6c6c6; font-size: 14px;">${p.replace(/\n/g, '<br>')}</p>`).join('')
    : `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #c6c6c6; font-size: 14px;">Namaste <strong>${recipientName}</strong>,</p>
       <p style="margin: 0 0 16px 0; line-height: 1.6; color: #c6c6c6; font-size: 14px;">We are officially extending a commercial partnership offer for the launch campaign of <strong>${productName}</strong>.</p>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} — Commercial Partnership Agreement</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #121212; font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; color: #f4f4f4;">
  <center style="width: 100%; table-layout: fixed; background-color: #121212; padding-top: 28px; padding-bottom: 40px;">
    
    <!-- MAIN CARBON CONTAINER (Max 600px) -->
    <div style="max-width: 600px; margin: 0 auto; background-color: #161616; border: 1px solid #393939; text-align: left;">
      
      <!-- CARBON HEADER BAR (cds--header) -->
      <div style="background-color: #161616; padding: 18px 24px; border-bottom: 1px solid #393939;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align: middle;">
              <span style="font-family: 'IBM Plex Sans', sans-serif; font-size: 15px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">
                ${brandName}
              </span>
              <span style="font-family: 'IBM Plex Sans', sans-serif; font-size: 13px; font-weight: 400; color: #8d8d8d; margin-left: 8px;">
                / Partnerships
              </span>
            </td>
            <td align="right" style="vertical-align: middle;">
              <!-- CARBON STATUS TAG (Green) -->
              <span style="display: inline-block; background-color: #1c2b21; color: #42be65; border: 1px solid #24a148; padding: 3px 10px; font-size: 11px; font-weight: 600; font-family: 'IBM Plex Sans', sans-serif; letter-spacing: 0.2px;">
                VERIFIED PROPOSAL
              </span>
            </td>
          </tr>
        </table>
      </div>

      <!-- CARBON HERO BANNER (g100 Layer 01 Tile) -->
      <div style="background: linear-gradient(180deg, #262626 0%, #1f1f1f 100%); padding: 28px 24px; border-bottom: 2px solid #0f62fe;">
        <div style="font-size: 11px; font-weight: 600; color: #78a9ff; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-family: 'IBM Plex Mono', monospace;">
          CAMPAIGN SPOTLIGHT • Q3-2026
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #ffffff; letter-spacing: -0.2px; font-family: 'IBM Plex Sans', sans-serif;">
          ${productName}
        </h1>
        <div style="font-size: 13px; color: #a8a8a8; line-height: 1.4;">
          Exclusive Influencer Collaboration & Instant Escrow Commercials
        </div>
      </div>

      <!-- MAIN BODY PADDING -->
      <div style="padding: 28px 24px;">
        
        <!-- PROPOSAL BODY TEXT -->
        <div style="margin-bottom: 24px;">
          ${formattedBody}
        </div>

        <!-- CARBON DATA TABLE / COMMERCIAL CARD TILE -->
        <div style="background-color: #262626; border: 1px solid #393939; padding: 20px; margin-bottom: 28px;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #393939; padding-bottom: 12px; margin-bottom: 16px;">
            <span style="font-size: 12px; font-weight: 700; color: #f4f4f4; text-transform: uppercase; letter-spacing: 0.8px; font-family: 'IBM Plex Sans', sans-serif;">
              Commercial Terms Summary
            </span>
            <span style="font-size: 11px; color: #78a9ff; font-family: 'IBM Plex Mono', monospace;">
              ESCROW PROTECTED
            </span>
          </div>

          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; border-collapse: collapse;">
            
            <!-- ROW 1: GROSS ALLOCATION -->
            <tr style="border-bottom: 1px solid #333333;">
              <td style="padding: 10px 0; color: #a8a8a8; font-weight: 400;">Gross Creator Fee:</td>
              <td align="right" style="padding: 10px 0; font-family: 'IBM Plex Mono', monospace; font-size: 16px; font-weight: 700; color: #42be65;">
                ₹${formattedFee}
              </td>
            </tr>

            <!-- ROW 2: TDS DEDUCTION -->
            <tr style="border-bottom: 1px solid #333333;">
              <td style="padding: 10px 0; color: #a8a8a8;">Section 194J TDS (10%):</td>
              <td align="right" style="padding: 10px 0; font-family: 'IBM Plex Mono', monospace; font-weight: 500; color: #da1e28;">
                - ₹${tdsAmount} (Form 16A)
              </td>
            </tr>

            <!-- ROW 3: NET ESCROW DISBURSEMENT -->
            <tr style="border-bottom: 1px solid #333333;">
              <td style="padding: 10px 0; color: #f4f4f4; font-weight: 600;">Net Escrow Payout:</td>
              <td align="right" style="padding: 10px 0; font-family: 'IBM Plex Mono', monospace; font-size: 14px; font-weight: 700; color: #ffffff;">
                ₹${netAmount}
              </td>
            </tr>

            <!-- ROW 4: MANDATORY PHRASE -->
            <tr style="border-bottom: 1px solid #333333;">
              <td style="padding: 10px 0; color: #a8a8a8;">Spoken Keyphrase:</td>
              <td align="right" style="padding: 10px 0; color: #78a9ff; font-weight: 500;">
                "${mandatoryPhrase}"
              </td>
            </tr>

            <!-- ROW 5: PROMO CODE -->
            <tr style="border-bottom: 1px solid #333333;">
              <td style="padding: 10px 0; color: #a8a8a8;">Affiliate Promo Code:</td>
              <td align="right" style="padding: 10px 0;">
                <span style="background-color: #393939; border: 1px solid #525252; color: #f4f4f4; padding: 2px 8px; font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 12px;">
                  ${promoCode}
                </span>
              </td>
            </tr>

            <!-- ROW 6: GIFTING SAMPLE -->
            <tr>
              <td style="padding: 10px 0 0 0; color: #a8a8a8;">Product Unit:</td>
              <td align="right" style="padding: 10px 0 0 0; color: #42be65; font-weight: 500;">
                ✓ Complimentary Unit Shipped
              </td>
            </tr>

          </table>
        </div>

        <!-- CARBON PRIMARY BUTTON CTA -->
        <div style="margin: 32px 0 16px 0; text-align: left;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="background-color: #0f62fe; padding: 14px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-family: 'IBM Plex Sans', sans-serif; font-size: 14px; font-weight: 500; color: #ffffff;">
                      Reply directly to this email to accept terms
                    </td>
                    <td align="right" style="font-family: 'IBM Plex Sans', sans-serif; font-size: 18px; color: #ffffff;">
                      →
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <div style="font-size: 11px; color: #8d8d8d; margin-top: 8px; font-family: 'IBM Plex Sans', sans-serif;">
            Our autonomous campaign engine will process your confirmation and initiate product dispatch within 60 minutes.
          </div>
        </div>

      </div>

      <!-- CARBON FOOTER (cds--footer / g100) -->
      <div style="background-color: #121212; padding: 20px 24px; border-top: 1px solid #393939; font-size: 11px; color: #8d8d8d; font-family: 'IBM Plex Sans', sans-serif; line-height: 1.5;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align: top;">
              <span style="color: #c6c6c6; font-weight: 600;">${senderName}</span><br>
              Enterprise Influencer Operating System • ${brandName}
            </td>
            <td align="right" style="vertical-align: top; color: #6f6f6f; font-family: 'IBM Plex Mono', monospace;">
              TDS SEC 194J COMPLIANT<br>
              INSTANT UPI ESCROW RAIL
            </td>
          </tr>
        </table>
      </div>

    </div>
  </center>
</body>
</html>
  `.trim();
}
