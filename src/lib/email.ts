import 'server-only'

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text?: string
}

export interface EmailResult {
  ok: boolean
  id: string
  provider: 'mock' | 'resend'
}

/**
 * Pluggable email sender. Uses Resend when RESEND_API_KEY is set, otherwise a
 * mock provider that logs and succeeds (for demos without an email account).
 */
export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  const from = process.env.EMAIL_FROM ?? 'VendorBridge <procurement@vendorbridge.example>'

  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: msg.to, subject: msg.subject, html: msg.html }),
      })
      const data = await res.json().catch(() => ({}))
      return { ok: res.ok, id: data?.id ?? 'unknown', provider: 'resend' }
    } catch {
      return { ok: false, id: '', provider: 'resend' }
    }
  }

  // Mock: pretend to send. The flow still records sent_at and shows a preview.
  console.log(`[mock-email] from=${from} to=${msg.to} subject="${msg.subject}"`)
  return { ok: true, id: `mock_${Date.now()}`, provider: 'mock' }
}
