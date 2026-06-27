import { Worker } from 'bullmq';
import { getRedisConnectionOptions } from '@/lib/redis';
import { sendEmail } from '../services/email-service';

console.log('[Email Worker] Initializing background email processor...');

/**
 * BullMQ Worker that processes outbound email dispatches in the background.
 */
export const emailWorker = new Worker(
  'email-queue',
  async (job) => {
    if (job.name === 'send-email') {
      const { to, template, data } = job.data;
      let html = '';

      if (template === 'broadcast') {
        html = `
          <div style="font-family: sans-serif; padding: 24px; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #6366f1; font-size: 20px; font-weight: bold; margin-bottom: 16px;">Hi ${data.name || 'Member'},</h2>
            <div style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px; whitespace: pre-wrap;">
              ${data.body}
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center;">
              Sent via your community on Empire. Own your audience. Keep 100%.
            </p>
          </div>
        `;
      } else if (template === 'magic-link') {
        html = `
          <div style="font-family: sans-serif; padding: 24px; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #6366f1; font-size: 20px; font-weight: bold; margin-bottom: 16px;">Welcome!</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
              Click the secure link below to login to your community. This magic link is valid for 15 minutes.
            </p>
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${data.magicLink}" style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);">
                Login to Community
              </a>
            </div>
            <p style="font-size: 12px; color: #64748b;">
              Or copy and paste this URL into your browser: <br />
              <a href="${data.magicLink}" style="color: #6366f1; word-break: break-all;">${data.magicLink}</a>
            </p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center;">
              Sent via your community on Empire.
            </p>
          </div>
        `;
      }

      await sendEmail({
        to,
        subject: data.subject || 'Update from Community',
        html,
      });
    }
  },
  {
    connection: getRedisConnectionOptions(),
  }
);

emailWorker.on('completed', (job) => {
  console.log(`[Email Worker] Job ${job.id} processed successfully.`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[Email Worker] Job ${job?.id} failed to process:`, err);
});

export default emailWorker;
