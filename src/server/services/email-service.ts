import { Resend } from 'resend';

const resend =
  process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_placeholder'
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Interface with the Resend API to dispatch emails.
 * Falls back to local logging when running in development sandboxes.
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  console.log(`[Email Service] Queue Outbound Email -> To: ${to} | Subject: ${subject}`);

  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Empire Academy <onboarding@empire.com>',
        to,
        subject,
        html,
      });

      if (error) {
        console.error('[Email Service] Resend dispatch failed:', error);
      } else {
        console.log('[Email Service] Email dispatched successfully, id:', data?.id);
      }
    } catch (err) {
      console.error('[Email Service] Failed to send email via Resend:', err);
    }
  } else {
    console.log('[Email Service] (Dev mode fallback) Logging message content:');
    console.log('============================================================');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('--- Body ---');
    console.log(html);
    console.log('============================================================');
  }
}
