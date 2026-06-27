import { describe, it, expect } from 'vitest';
import { hasTierAccess } from '../../src/lib/gating';

describe('Membership Tier Gating Rules', () => {
  const mockTiers = [
    { id: 'free_tier_id', price: 0 },
    { id: 'basic_tier_id', price: 49 },
    { id: 'premium_tier_id', price: 99 },
  ];

  it('should grant access if a resource is not gated', () => {
    const member = { id: 'free_tier_id', price: 0 };
    expect(hasTierAccess(member, null, mockTiers)).toBe(true);
  });

  it('should deny access if a resource is gated but member has no active tier', () => {
    expect(hasTierAccess(null, 'basic_tier_id', mockTiers)).toBe(false);
  });

  it('should allow access if the member tier matches the required tier exactly', () => {
    const member = { id: 'basic_tier_id', price: 49 };
    expect(hasTierAccess(member, 'basic_tier_id', mockTiers)).toBe(true);
  });

  it('should allow access to lower-tier resources by pricing inheritance', () => {
    const member = { id: 'premium_tier_id', price: 99 };
    // Premium tier member accessing a Basic tier gated course
    expect(hasTierAccess(member, 'basic_tier_id', mockTiers)).toBe(true);
  });

  it('should deny access to higher-tier resources due to insufficient price value', () => {
    const member = { id: 'basic_tier_id', price: 49 };
    // Basic tier member accessing a Premium tier gated course
    expect(hasTierAccess(member, 'premium_tier_id', mockTiers)).toBe(false);
  });
});
