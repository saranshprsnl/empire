import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import prisma from '@/lib/prisma';
import { runWithTenant } from '@/lib/tenant-context';
import { getRedisClient } from '@/lib/redis';

/**
 * Stripe API Webhook receiver endpoint.
 * Bypasses signature checking in local dev environments if STRIPE_WEBHOOK_SECRET is a placeholder.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event: any;

  try {
    if (webhookSecret && !webhookSecret.includes('placeholder')) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // Sandbox fallback parsing
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error(`[Stripe Webhook] Verification failure:`, err.message);
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
  }

  // Idempotency: verify this event has not been processed yet
  if (event.id) {
    const redis = getRedisClient();
    const eventKey = `stripe_event:${event.id}`;
    const isNewEvent = await redis.set(eventKey, 'processed', 'EX', 24 * 60 * 60, 'NX');
    if (!isNewEvent) {
      console.warn(`[Stripe Webhook] Duplicate event detected and bypassed: ${event.id}`);
      return NextResponse.json({ received: true, duplicate: true });
    }
  }

  const session = event.data?.object;

  // Event handler block
  try {
    if (event.type === 'checkout.session.completed') {
      const { tenantId, memberId, tierId } = session.metadata || {};

      if (tenantId && memberId && tierId) {
        await runWithTenant(tenantId, async () => {
          const ltvAmount = (session.amount_total || 0) / 100;

          // 1. Update Member status & assign their Tier
          await prisma.member.update({
            where: { id: memberId },
            data: {
              tierId,
              status: 'ACTIVE',
              stripeCustomerId: session.customer as string,
              totalSpent: { increment: ltvAmount },
              lifetimeValue: { increment: ltvAmount },
            },
          });

          // 2. Create Payment ledger record
          await prisma.payment.create({
            data: {
              tenantId,
              memberId,
              productId: null,
              amount: ltvAmount,
              currency: session.currency || 'USD',
              status: 'COMPLETED',
              stripePaymentIntentId: session.payment_intent as string,
              stripeSubscriptionId: session.subscription as string,
            },
          });

          // 3. Track conversion event in analytics
          await prisma.analyticsEvent.create({
            data: {
              tenantId,
              memberId,
              eventType: 'MEMBER_SUBSCRIBED',
              properties: {
                tierId,
                amount: ltvAmount,
              },
            },
          });
        });
        console.log(`[Stripe Webhook] Member ${memberId} conversion completed for tier ${tierId}.`);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscriptionId = session.id;

      // Find original payment reference to extract tenant context
      const payment = await prisma.payment.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
        orderBy: { createdAt: 'desc' },
      });

      if (payment) {
        await runWithTenant(payment.tenantId, async () => {
          // Update status to CHURNED
          await prisma.member.update({
            where: { id: payment.memberId },
            data: {
              status: 'CHURNED',
              churnedAt: new Date(),
            },
          });

          // Track churn event in analytics
          await prisma.analyticsEvent.create({
            data: {
              tenantId: payment.tenantId,
              memberId: payment.memberId,
              eventType: 'MEMBER_CHURNED',
              properties: {
                subscriptionId,
              },
            },
          });
        });
        console.log(`[Stripe Webhook] Revoked subscription ${subscriptionId} for member.`);
      }
    }
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error);
    return NextResponse.json({ error: 'Processing error occurred.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
