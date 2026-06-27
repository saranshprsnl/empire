import stripe from '@/lib/stripe';
import prisma from '@/lib/prisma';
import { runWithTenant } from '@/lib/tenant-context';

interface CheckoutOptions {
  tenantId: string;
  memberId: string;
  tierId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Handles payment structures, customer subscription checkouts,
 * and Stripe Connect express seller accounts for creators.
 */
export const PaymentService = {
  /**
   * Generates a Stripe Checkout Session for a member to subscribe to a membership tier.
   * Falls back to a mock link if Stripe keys are placeholders.
   */
  async createCheckoutSession({ tenantId, memberId, tierId, successUrl, cancelUrl }: CheckoutOptions) {
    const isMock = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder');

    const tier = await runWithTenant(tenantId, () =>
      prisma.tier.findUnique({
        where: { id: tierId },
      })
    );

    if (!tier) throw new Error('Subscription tier not found.');

    if (isMock) {
      console.log(`[Payment Service] (Mock Mode) Checkout Session requested for Member: ${memberId}, Tier: ${tierId}`);
      // Return a local mock callback success URL containing metadata for testing
      const mockSessionId = `sess_mock_${Math.random().toString(36).substring(7)}`;
      const url = new URL(successUrl);
      url.searchParams.set('session_id', mockSessionId);
      url.searchParams.set('tier_id', tierId);
      url.searchParams.set('member_id', memberId);
      return { url: url.toString(), id: mockSessionId };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: tier.name,
              description: tier.description || undefined,
            },
            unit_amount: Math.round(Number(tier.price) * 100),
            recurring: tier.price.toNumber() > 0 ? {
              interval: tier.interval.toLowerCase() as 'month' | 'year',
            } : undefined,
          },
          quantity: 1,
        },
      ],
      mode: tier.price.toNumber() > 0 ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tenantId,
        memberId,
        tierId,
      },
    });

    return { url: session.url, id: session.id };
  },

  /**
   * Sets up a Stripe Express Connect account for a creator workspace.
   */
  async createStripeConnectAccount(tenantId: string) {
    const isMock = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder');

    if (isMock) {
      return { stripeAccountId: `acct_mock_${Math.random().toString(36).substring(7)}` };
    }

    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    return { stripeAccountId: account.id };
  },

  /**
   * Generates a link to complete Stripe Connect onboarding.
   */
  async getStripeConnectOnboardingLink(stripeAccountId: string, returnUrl: string, refreshUrl: string) {
    const isMock = stripeAccountId.startsWith('acct_mock_');

    if (isMock) {
      return { url: returnUrl };
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  },
};
