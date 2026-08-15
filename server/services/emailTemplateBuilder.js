/**
 * Premium Responsive HTML Email Card & Banner Builder
 * Generates email templates with banners, commercial cards, and responsive styling.
 */

export function buildBrandedEmailHtml({
  recipientName = 'Creator',
  senderName = 'boAt Creator Partnerships',
  brandName = 'boAt Lifestyle',
  productName = 'boAt Airdopes Pro Max 500',
  offeredPrice = 25000,
  mandatoryPhrase = 'Use code SAVER20 for 20% off',
  promoCode = 'SAVER20',
  bodyText = '',
  campaignBannerUrl = null
}) {
  const formattedFee = Number(offeredPrice).toLocaleString('en-IN');
  const tdsAmount = Math.round(Number(offeredPrice) * 0.10).toLocaleString('en-IN');
  const netAmount = (Number(offeredPrice) - Math.round(Number(offeredPrice) * 0.10)).toLocaleString('en-IN');

  // Convert plain text body into clean paragraphs if bodyText is provided
  const formattedBody = bodyText
    ? bodyText.split('\n\n').map(p => `<p style="margin: 0 0 16px 0; line-height: 1.65; color: #2d3748;">${p.replace(/\n/g, '<br>')}</p>`).join('')
    : `<p style="margin: 0 0 16px 0; line-height: 1.65; color: #2d3748;">Namaste <strong>${recipientName}</strong>,</p>
       <p style="margin: 0 0 16px 0; line-height: 1.65; color: #2d3748;">We love your content and would be thrilled to partner with you on our upcoming launch campaign for the <strong>${productName}</strong>!</p>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} Collaboration Proposal</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <center style="width: 100%; table-layout: fixed; background-color: #f4f7fa; padding-top: 30px; padding-bottom: 40px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0; text-align: left;">
      
      <!-- TOP BRANDED BANNER -->
      <div style="background: linear-gradient(135deg, #0b0f19 0%, #1a2234 100%); padding: 28px 32px; border-bottom: 3px solid #0f62fe;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <div style="display: inline-block; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                ⚡ ${brandName}
              </div>
              <div style="font-size: 12px; font-weight: 600; color: #78a9ff; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">
                Official Creator Partnership Invitation
              </div>
            </td>
            <td align="right">
              <span style="display: inline-block; background-color: rgba(15, 98, 254, 0.25); color: #a6c8ff; border: 1px solid #0f62fe; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;">
                ✓ Verified Offer
              </span>
            </td>
          </tr>
        </table>
      </div>

      <!-- MAIN CONTENT WRAPPER -->
      <div style="padding: 32px;">
        
        <!-- HERO PRODUCT TITLE -->
        <div style="margin-bottom: 24px;">
          <span style="font-size: 12px; font-weight: 700; color: #0f62fe; text-transform: uppercase; letter-spacing: 0.5px;">Campaign Spotlight</span>
          <h1 style="margin: 4px 0 0 0; font-size: 22px; font-weight: 700; color: #1a202c;">
            ${productName}
          </h1>
        </div>

        <!-- EMAIL BODY PARAGRAPHS -->
        <div style="font-size: 15px; color: #2d3748;">
          ${formattedBody}
        </div>

        <!-- COMMERCIAL SUMMARY CARD / PILL BOX -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #0f62fe; border-radius: 8px; padding: 20px; margin: 28px 0;">
          <div style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.75px; margin-bottom: 12px;">
            📊 Partnership Terms & Commercials
          </div>

          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Gross Collaboration Fee:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #16a34a; text-align: right; font-size: 16px;">
                ₹${formattedFee}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Net Escrow Payout (10% TDS Sec 194J):</td>
              <td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right;">
                ₹${netAmount}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Required Spoken Phrase:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #2563eb; text-align: right;">
                "${mandatoryPhrase}"
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Affiliate Promo Code:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-align: right; font-family: monospace;">
                ${promoCode}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Product Sample Gifting:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #059669; text-align: right;">
                📦 Complimentary Unit Included
              </td>
            </tr>
          </table>
        </div>

        <!-- CALL TO ACTION BOX -->
        <div style="text-align: center; margin: 30px 0 10px 0;">
          <div style="display: inline-block; background-color: #0f62fe; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none; box-shadow: 0 4px 12px rgba(15, 98, 254, 0.25);">
            ✉️ Reply Directly to this Email to Accept Terms
          </div>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">
            Our AI campaign system will automatically register your confirmation and initiate product dispatch.
          </p>
        </div>

      </div>

      <!-- ENTERPRISE FOOTER -->
      <div style="background-color: #f1f5f9; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.5;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <strong>${senderName}</strong><br>
              Automated Creator Marketing Engine • ${brandName}
            </td>
            <td align="right" style="color: #94a3b8; font-size: 11px;">
              Form 16A TDS Compliant<br>
              Instant UPI Escrow Rail
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
