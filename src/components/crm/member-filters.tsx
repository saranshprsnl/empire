'use client';

import React from 'react';
import { MemberStatus } from '@prisma/client';

interface MemberFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  status: MemberStatus | 'ALL';
  setStatus: (status: MemberStatus | 'ALL') => void;
  tierId: string;
  setTierId: (id: string) => void;
  tiers: { id: string; name: string }[];
}

/**
 * Filter Bar for the Member CRM Dashboard.
 */
export function MemberFilters({
  search,
  setSearch,
  status,
  setStatus,
  tierId,
  setTierId,
  tiers,
}: MemberFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-surface border border-border rounded-medium mb-6">
      {/* Search Input */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search members by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-border rounded-small bg-background text-text-primary text-sm focus:outline-none focus:border-primary placeholder:text-text-secondary"
        />
      </div>

      {/* Status Filter */}
      <div className="w-full sm:w-48">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as MemberStatus | 'ALL')}
          className="w-full px-4 py-2 border border-border rounded-small bg-background text-text-primary text-sm focus:outline-none focus:border-primary"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PAUSED">Paused</option>
          <option value="CHURNED">Churned</option>
        </select>
      </div>

      {/* Tier Filter */}
      <div className="w-full sm:w-48">
        <select
          value={tierId}
          onChange={(e) => setTierId(e.target.value)}
          className="w-full px-4 py-2 border border-border rounded-small bg-background text-text-primary text-sm focus:outline-none focus:border-primary"
        >
          <option value="ALL">All Tiers</option>
          {tiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
export default MemberFilters;
