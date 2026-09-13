export interface EmailEnv {
  RESEND_API_KEY: string
  EMAIL_FROM: string
  PUBLIC_APP_URL: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export async function sendConfirmationEmail(
  env: EmailEnv,
  guest: {
    fullName: string
    email: string
    invitationCode: string
    qrToken: string
  }
) {
  const eventPassUrl =
    `${env.PUBLIC_APP_URL}/pass?token=${encodeURIComponent(
      guest.qrToken
    )}`

  const response = await fetch(
    'https://api.resend.com/emails',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [guest.email],
        subject: 'Your invitation to شمسك جواك',
        html: `
          <html>
            <body style="font-family:Arial,sans-serif;background:#f5efe5;padding:30px;">
              <div style="max-width:600px;margin:auto;background:#fff;padding:40px;border-radius:20px;text-align:center;">

                <p style="color:#e86616;letter-spacing:3px;font-size:12px;font-weight:700;">
                  YOU'RE IN
                </p>

                <h1>
                  Thank you, ${escapeHtml(guest.fullName)}.
                </h1>

                <p>
                  Your attendance at <strong>شمسك جواك</strong> has been confirmed.
                </p>

                <div style="margin:30px 0;padding:24px;background:#fff6e5;border-radius:18px;">
                  <div>02 OCT 2026</div>
                  <h2>THE NILE RITZ-CARLTON</h2>
                  <div>CAIRO</div>
                </div>

                <p style="font-size:12px;color:#777;">
                  INVITATION ID
                </p>

                <h2>
                  ${escapeHtml(guest.invitationCode)}
                </h2>

                <a
                  href="${eventPassUrl}"
                  style="
                    display:inline-block;
                    margin-top:20px;
                    background:#171512;
                    color:#fff;
                    text-decoration:none;
                    padding:15px 28px;
                    border-radius:12px;
                    font-weight:700;
                  "
                >
                  VIEW MY EVENT PASS
                </a>

              </div>
            </body>
          </html>
        `,
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()

    console.error(
      'RESEND ERROR:',
      response.status,
      errorText
    )

    return false
  }

  return true
}