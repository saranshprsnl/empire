'use client';

import React from 'react';
import { MemberStatus } from '@prisma/client';

interface MemberDetail {
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

interface MemberDetailPanelProps {
  member: MemberDetail | null;
  onClose: () => void;
  onUpdateTags: (memberId: string, tags: string[]) => void;
}

/**
 * Sliding detail drawer that appears on the right side of the dashboard
 * to inspect member activities, LTV, risk indicators and direct communications.
 */
export function MemberDetailPanel({ member, onClose, onUpdateTags }: MemberDetailPanelProps) {
  if (!member) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const input = e.currentTarget;
      const tag = input.value.trim().toLowerCase();
      if (tag && !member.tags.includes(tag)) {
        onUpdateTags(member.id, [...member.tags, tag]);
        input.value = '';
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateTags(
      member.id,
      member.tags.filter((t) => t !== tagToRemove)
    );
  };

  // Determine churn risk warning color
  const risk = member.churnRiskScore || 0;
  const riskColor = risk > 70 ? 'text-danger bg-danger/10 border-danger/20' : risk > 30 ? 'text-warning bg-warning/10 border-warning/20' : 'text-secondary bg-secondary/10 border-secondary/20';

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-surface border-l border-border shadow-elevated z-50 flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-6 border-b border-border flex justify-between items-center select-none">
        <h3 className="font-bold text-text-primary text-base">Member Profile</h3>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary text-xl cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* User Card */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
            {getInitials(member.name)}
          </div>
          <div>
            <h4 className="font-bold text-text-primary text-lg">{member.name}</h4>
            <p className="text-xs text-text-secondary">{member.email}</p>
            {member.tierName && (
              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-primary/20 text-primary rounded-full font-bold uppercase tracking-wider">
                {member.tierName}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-background border border-border rounded-medium text-center">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider">LTV</span>
            <p className="text-xl font-bold mt-1 text-primary">${Number(member.lifetimeValue).toFixed(2)}</p>
          </div>
          <div className="p-4 bg-background border border-border rounded-medium text-center">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider">Spent</span>
            <p className="text-xl font-bold mt-1 text-text-primary">${Number(member.totalSpent).toFixed(2)}</p>
          </div>
        </div>

        {/* AI Health Parameters */}
        <div className="space-y-4">
          {/* Engagement Score */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-text-secondary">Engagement Score</span>
              <span className="text-xs font-bold text-text-primary">{member.engagementScore}/100</span>
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${member.engagementScore}%` }}
              />
            </div>
          </div>

          {/* Churn Risk */}
          <div className={`p-4 border rounded-medium flex items-center justify-between ${riskColor}`}>
            <div>
              <span className="text-xs font-bold block">AI Churn Risk</span>
              <span className="text-[10px] opacity-75">Based on active habits</span>
            </div>
            <span className="text-lg font-extrabold">{risk}%</span>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
            Member Tags
          </label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {member.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-border text-text-primary rounded-small font-medium"
              >
                #{tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-danger font-bold text-[10px] ml-1"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Press Enter to add tag..."
            onKeyDown={handleAddTag}
            className="w-full px-3 py-1.5 text-xs border border-border rounded-small bg-background text-text-primary focus:outline-none focus:border-primary placeholder:text-text-secondary"
          />
        </div>

        {/* Joined details */}
        <div className="space-y-2 text-xs text-text-secondary border-t border-border pt-4 select-none">
          <div className="flex justify-between">
            <span>Joined Date</span>
            <span className="font-semibold text-text-primary">
              {new Date(member.joinedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Stripe Customer</span>
            <span className="font-mono text-text-primary">
              {member.stripeCustomerId || 'Not Linked'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-border space-y-2 select-none">
        <button className="w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-small text-xs font-semibold shadow-card transition-all cursor-pointer">
          📧 Send Email Campaign
        </button>
        <button className="w-full py-2 bg-background hover:bg-border border border-border text-text-primary rounded-small text-xs font-semibold transition-all cursor-pointer">
          💬 Send Direct Channel Message
        </button>
      </div>
    </div>
  );
}
export default MemberDetailPanel;
