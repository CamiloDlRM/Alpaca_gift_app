import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.FROM_EMAIL || 'WealthGift <noreply@wealthgift.app>';
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[EMAIL] No RESEND_API_KEY — would send to ${to}: ${subject}`);
    return;
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) console.error('[EMAIL] Send error:', error);
}

export async function sendGiftReceivedEmail(opts: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  amount: number;
  etfSymbol: string;
  occasion: string;
  claimToken: string;
}) {
  const claimUrl = `${BASE_URL}/claim/${opts.claimToken}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
        <tr>
          <td style="background:#F5C518;padding:28px 40px;text-align:center">
            <div style="display:inline-flex;align-items:center;gap:10px">
              <div style="width:36px;height:36px;background:rgba(0,0,0,.15);border-radius:50%;display:flex;align-items:center;justify-content:center">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M4 12 L8 8 L12 14 L16 6 L20 10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <span style="font-size:20px;font-weight:700;color:#000">WealthGift</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px">
            <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;font-weight:600">You have a gift waiting</p>
            <h1 style="margin:0 0 24px;font-size:28px;font-weight:700;color:#111827">Hi ${opts.recipientName}!</h1>
            <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6">
              <strong>${opts.senderName}</strong> has sent you a <strong>${opts.occasion}</strong> investment gift through WealthGift.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;margin-bottom:32px">
              <tr>
                <td style="padding:24px;text-align:center">
                  <div style="font-size:36px;font-weight:700;color:#111827;margin-bottom:4px">$${opts.amount.toFixed(2)}</div>
                  <div style="font-size:16px;color:#6b7280;font-weight:500">invested in ${opts.etfSymbol}</div>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${claimUrl}" style="display:inline-block;background:#F5C518;color:#000;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:100px">
                    Claim Your Gift
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 32px">
            <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center">
              If you can't click the button, copy this link:<br>
              <a href="${claimUrl}" style="color:#F5C518;word-break:break-all">${claimUrl}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6">
            <p style="margin:0;font-size:12px;color:#9ca3af">© ${new Date().getFullYear()} WealthGift. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await send(opts.recipientEmail, `🎁 ${opts.senderName} sent you a ${opts.occasion} gift!`, html);
}

export async function sendClaimPinEmail(opts: {
  recipientEmail: string;
  recipientName: string;
  pin: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
        <tr>
          <td style="background:#F5C518;padding:28px 40px;text-align:center">
            <span style="font-size:20px;font-weight:700;color:#000">WealthGift</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px">
            <div style="text-align:center;margin-bottom:24px">
              <div style="width:60px;height:60px;background:#fef9c3;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827">Your verification code</h1>
              <p style="margin:0;font-size:15px;color:#6b7280">Hi ${opts.recipientName}, use this code to claim your gift.</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;margin-bottom:24px">
              <tr>
                <td style="padding:28px;text-align:center">
                  <div style="font-size:48px;font-weight:700;letter-spacing:12px;color:#111827;font-family:'Courier New',monospace">${opts.pin}</div>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center">
              This code expires in <strong>15 minutes</strong>. Do not share it with anyone.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6">
            <p style="margin:0;font-size:12px;color:#9ca3af">If you didn't request this code, you can safely ignore this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await send(opts.recipientEmail, `${opts.pin} is your WealthGift verification code`, html);
}

export async function sendPasswordCodeEmail(opts: {
  email: string;
  name: string;
  code: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
        <tr>
          <td style="background:#F5C518;padding:28px 40px;text-align:center">
            <span style="font-size:20px;font-weight:700;color:#000">WealthGift</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px">
            <div style="text-align:center;margin-bottom:24px">
              <div style="width:60px;height:60px;background:#fef9c3;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827">Password change request</h1>
              <p style="margin:0;font-size:15px;color:#6b7280">Hi ${opts.name}, use this code to confirm the change.</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;margin-bottom:24px">
              <tr>
                <td style="padding:28px;text-align:center">
                  <div style="font-size:48px;font-weight:700;letter-spacing:12px;color:#111827;font-family:'Courier New',monospace">${opts.code}</div>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center">
              This code expires in <strong>15 minutes</strong>. If you didn't request this, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6">
            <p style="margin:0;font-size:12px;color:#9ca3af">© ${new Date().getFullYear()} WealthGift. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await send(opts.email, `${opts.code} — your WealthGift password change code`, html);
}

interface VerificationEmailOpts {
  recipientEmail: string;
  recipientName: string;
  verificationUrl: string;
}

export async function sendVerificationEmail(opts: VerificationEmailOpts) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0b0b0f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0f;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#16161d;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.4)">
        <tr>
          <td style="background:#F5C518;padding:28px 40px;text-align:center">
            <div style="display:inline-flex;align-items:center;gap:10px">
              <div style="width:36px;height:36px;background:rgba(0,0,0,.15);border-radius:50%;display:flex;align-items:center;justify-content:center">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M4 12 L8 8 L12 14 L16 6 L20 10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <span style="font-size:20px;font-weight:700;color:#000">WealthGift</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px">
            <div style="text-align:center;margin-bottom:24px">
              <div style="width:60px;height:60px;background:rgba(245,197,24,.12);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F5C518" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff">Verify your email</h1>
              <p style="margin:0;font-size:15px;color:#9ca3af">Hi ${opts.recipientName}, welcome to WealthGift!</p>
            </div>
            <p style="margin:0 0 28px;font-size:16px;color:#d1d5db;line-height:1.6;text-align:center">
              Confirm your email address to activate your account and start gifting investments.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${opts.verificationUrl}" style="display:inline-block;background:#F5C518;color:#000;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:100px">
                    Verify my email
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 32px">
            <p style="margin:0;font-size:13px;color:#6b7280;text-align:center">
              If you can't click the button, copy this link:<br>
              <a href="${opts.verificationUrl}" style="color:#F5C518;word-break:break-all">${opts.verificationUrl}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#0f0f15;padding:20px 40px;text-align:center;border-top:1px solid #1f1f29">
            <p style="margin:0;font-size:12px;color:#6b7280">If you didn't create a WealthGift account, you can safely ignore this email.</p>
            <p style="margin:8px 0 0;font-size:12px;color:#6b7280">© ${new Date().getFullYear()} WealthGift. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await send(opts.recipientEmail, 'Verify your WealthGift email', html);
}

export async function sendGiftClaimedEmail(opts: {
  senderEmail: string;
  senderName: string;
  recipientName: string;
  amount: number;
  etfSymbol: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
        <tr>
          <td style="background:#F5C518;padding:28px 40px;text-align:center">
            <span style="font-size:20px;font-weight:700;color:#000">WealthGift</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px">
            <div style="text-align:center;margin-bottom:24px">
              <div style="font-size:40px;margin-bottom:12px">🎉</div>
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827">Your gift was claimed!</h1>
              <p style="margin:0;font-size:15px;color:#6b7280">Hi ${opts.senderName}, great news!</p>
            </div>
            <p style="font-size:16px;color:#374151;line-height:1.6;text-align:center;margin:0 0 24px">
              <strong>${opts.recipientName}</strong> has started claiming the investment gift you sent them.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;margin-bottom:32px">
              <tr>
                <td style="padding:20px;text-align:center">
                  <div style="font-size:28px;font-weight:700;color:#111827;margin-bottom:4px">$${opts.amount.toFixed(2)}</div>
                  <div style="font-size:14px;color:#6b7280">${opts.etfSymbol}</div>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${BASE_URL}/dashboard" style="display:inline-block;background:#F5C518;color:#000;font-size:15px;font-weight:700;text-decoration:none;padding:12px 32px;border-radius:100px">
                    View Dashboard
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6">
            <p style="margin:0;font-size:12px;color:#9ca3af">© ${new Date().getFullYear()} WealthGift. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await send(opts.senderEmail, `${opts.recipientName} claimed your WealthGift!`, html);
}
