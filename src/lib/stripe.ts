import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-02-preview' as any, // use latest stable API version compatibility
  appInfo: {
    name: 'Empire SaaS OS',
    version: '0.1.0',
  },
});

export default stripe;
