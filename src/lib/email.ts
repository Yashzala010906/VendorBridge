import 'server-only'
import nodemailer from 'nodemailer'

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text?: string
}

export interface EmailResult {
  ok: boolean
  id: string
  provider: 'mock' | 'resend' | 'smtp'
}

/**
 * Pluggable email sender. Uses Resend when RESEND_API_KEY is set, or SMTP
 * when SMTP_HOST is configured. Otherwise, falls back to a mock provider.
 */
export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  const from = process.env.EMAIL_FROM ?? 'VendorBridge <procurement@vendorbridge.example>'

  // 1. Try Resend if configured
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: msg.to,
          subject: msg.subject,
          html: msg.html,
          text: msg.text,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        return { ok: true, id: data?.id ?? 'unknown', provider: 'resend' }
      } else {
        console.error('Resend error response:', data)
      }
    } catch (err) {
      console.error('Resend transport error:', err)
    }
  }

  // 2. Try SMTP if configured
  if (process.env.SMTP_HOST) {
    try {
      const secure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465'
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT ?? '587', 10),
        secure,
        auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        } : undefined,
      })

      const info = await transporter.sendMail({
        from,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      })

      return { ok: true, id: info.messageId, provider: 'smtp' }
    } catch (err) {
      console.error('SMTP transport error:', err)
      return { ok: false, id: '', provider: 'smtp' }
    }
  }

  // 3. Fallback to Mock
  console.log(`[mock-email] from=${from} to=${msg.to} subject="${msg.subject}"`)
  return { ok: true, id: `mock_${Date.now()}`, provider: 'mock' }
}
