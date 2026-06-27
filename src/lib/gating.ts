export interface GatableTier {
  id: string;
  price: any; // Allow string, number, or Decimal object
}

/**
 * Verifies if a member's active membership tier satisfies a resource's tier requirements.
 * Employs a pricing hierarchy check where higher-value tiers automatically inherit access
 * to resources gated by lower-value tiers.
 */
export function hasTierAccess(
  memberTier: GatableTier | null,
  requiredTierId: string | null,
  allTiers: GatableTier[]
): boolean {
  // If a resource is not gated, access is granted to all members
  if (!requiredTierId) return true;

  // If a tier is required but the member has no active tier subscription, access is denied
  if (!memberTier) return false;

  // Direct match allows access
  if (memberTier.id === requiredTierId) return true;

  const targetRequiredTier = allTiers.find((t) => t.id === requiredTierId);
  if (!targetRequiredTier) return false;

  // Compare prices: handles numbers, strings, and Prisma Decimal values
  const memberPrice = typeof memberTier.price === 'object' && memberTier.price?.toNumber
    ? memberTier.price.toNumber()
    : Number(memberTier.price);

  const requiredPrice = typeof targetRequiredTier.price === 'object' && targetRequiredTier.price?.toNumber
    ? targetRequiredTier.price.toNumber()
    : Number(targetRequiredTier.price);

  return memberPrice >= requiredPrice;
}
