'use client';

import React from 'react';

interface UsageAlertProps {
  currentUsage: number;
  limit: number;
  metricName: string; // e.g. emails, members
  planName: string;   // e.g. Starter, Growth
  onUpgrade: () => void;
}

/**
 * Premium Usage Alert Banner displaying status alerts when creators
 * reach or exceed 80% of their subscription plan limits.
 */
export function UsageAlert({
  currentUsage,
  limit,
  metricName,
  planName,
  onUpgrade,
}: UsageAlertProps) {
  const percentage = Math.round((currentUsage / limit) * 100);

  // Trigger alert display once usage crosses the 80% threshold
  if (percentage < 80) return null;

  const isLimitExceeded = currentUsage >= limit;

  return (
    <div
      className={`p-4 border rounded-medium mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-card ${
        isLimitExceeded
          ? 'bg-danger/10 border-danger/25 text-danger'
          : 'bg-warning/10 border-warning/25 text-warning'
      }`}
    >
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 select-none">
          ⚠️ {isLimitExceeded ? 'Limit Exceeded' : 'Quota Warning'}
        </h4>
        <p className="text-xs mt-1 text-text-primary">
          You have consumed <span className="font-bold">{currentUsage.toLocaleString()}</span> of{' '}
          <span className="font-bold">{limit.toLocaleString()}</span> monthly {metricName} under the{' '}
          <span className="font-semibold">{planName}</span> tier ({percentage}%).
        </p>
      </div>

      <button
        onClick={onUpgrade}
        className={`px-4 py-1.5 rounded-small text-xs font-bold transition-all shadow-card cursor-pointer whitespace-nowrap ${
          isLimitExceeded
            ? 'bg-danger text-white hover:bg-danger/90'
            : 'bg-warning text-white hover:bg-warning/90'
        }`}
      >
        Upgrade Plan
      </button>
    </div>
  );
}
export default UsageAlert;
