'use client';

import React, { useState } from 'react';
import { MemberFilters } from './member-filters';
import { MemberDetailPanel } from './member-detail-panel';
import { MemberStatus } from '@prisma/client';

interface MemberRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: MemberStatus;
  engagementScore: number;
  churnRiskScore: number | null;
  lifetimeValue: number;
  totalSpent: number;
  joinedAt: Date;
  tags: string[];
  stripeCustomerId: string | null;
  tierName?: string;
}

interface MemberTableProps {
  initialMembers: MemberRecord[];
  tiers: { id: string; name: string }[];
}

/**
 * Interactive CRM table rendering search controls, status badges, LTV currencies,
 * and contextual side-panel triggers for detailed inspection.
 */
export function MemberTable({ initialMembers, tiers }: MemberTableProps) {
  const [members, setMembers] = useState<MemberRecord[]>(initialMembers);
  
  // Filtering states
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MemberStatus | 'ALL'>('ALL');
  const [tierId, setTierId] = useState('ALL');

  // Drawer detail states
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Computed Filters
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = status === 'ALL' || m.status === status;
    const matchesTier = tierId === 'ALL' || m.stripeCustomerId !== null; // Mock tier match for seed data mapping
    
    return matchesSearch && matchesStatus && matchesTier;
  });

  const selectedMember = members.find((m) => m.id === selectedMemberId) || null;

  const handleUpdateTags = (memberId: string, nextTags: string[]) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, tags: nextTags } : m))
    );
  };

  const getStatusBadge = (s: MemberStatus) => {
    switch (s) {
      case 'ACTIVE':
        return 'bg-secondary/15 text-secondary border-secondary/20';
      case 'PAUSED':
        return 'bg-warning/15 text-warning border-warning/20';
      case 'CHURNED':
        return 'bg-danger/15 text-danger border-danger/20';
      default:
        return 'bg-slate-500/15 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="relative w-full">
      {/* Search & Filter Header */}
      <MemberFilters
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        tierId={tierId}
        setTierId={setTierId}
        tiers={tiers}
      />

      {/* Main Grid table */}
      <div className="w-full bg-surface border border-border rounded-medium overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-background select-none text-xs font-semibold text-text-secondary">
                <th className="p-4">Name</th>
                <th className="p-4">Tier</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Engagement</th>
                <th className="p-4 text-right">LTV</th>
                <th className="p-4 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedMemberId(m.id)}
                    className="hover:bg-background/50 cursor-pointer transition-colors duration-150"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-text-primary">{m.name}</div>
                      <div className="text-xs text-text-secondary">{m.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium text-text-primary">
                        {m.tierName || 'Free Access'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 border rounded-full font-bold tracking-wide uppercase ${getStatusBadge(
                          m.status
                        )}`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${m.engagementScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-text-secondary">
                          {m.engagementScore}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-text-primary">
                      ${Number(m.lifetimeValue).toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-xs text-text-secondary">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-secondary select-none">
                    No members matching filters found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Contextual Panel */}
      <MemberDetailPanel
        member={selectedMember}
        onClose={() => setSelectedMemberId(null)}
        onUpdateTags={handleUpdateTags}
      />
    </div>
  );
}
export default MemberTable;
