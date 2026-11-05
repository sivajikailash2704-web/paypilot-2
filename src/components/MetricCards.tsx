import React from 'react';
import { DollarSign, Clock, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { DashboardData, InsightsData } from '../types';

interface MetricCardsProps {
  dashboard: DashboardData | null;
  insights: InsightsData | null;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ dashboard, insights }) => {
  const completedTotal = dashboard?.completed_total ?? 0;
  const pendingTotal = dashboard?.pending_total ?? 0;
  const refundedTotal = dashboard?.refunded_total ?? 0;
  const count = dashboard?.transaction_count ?? 0;
  const conversionRate = insights?.conversion_rate ?? (count > 0 ? Math.round(((insights?.completed_count || 0) / count) * 100) : 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Captured & Completed Volume */}
      <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden transition-all hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Captured Revenue (USD)</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-bold font-mono text-slate-100">
            ${completedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <span className="text-emerald-400 font-medium flex items-center gap-0.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active</span>
          </span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span>{insights?.completed_count ?? 0} successful orders</span>
        </div>
      </div>

      {/* 2. Pending In Pipeline */}
      <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden transition-all hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Pending Authorization</span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-bold font-mono text-amber-200">
            ${pendingTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <span className="text-amber-400 font-medium">Awaiting Capture</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span>{insights?.pending_count ?? 0} pending orders</span>
        </div>
      </div>

      {/* 3. Total Transaction Volume */}
      <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden transition-all hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Transaction Records</span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-bold font-mono text-slate-100">
            {count}
          </span>
          <span className="text-xs text-slate-400">total events</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <span>{insights?.sandbox_count ?? 0} PayPal Checkout</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span>{count - (insights?.sandbox_count ?? 0)} invoice / direct</span>
        </div>
      </div>

      {/* 4. Conversion & Refund Health */}
      <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden transition-all hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Settlement Rate</span>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-bold font-mono text-slate-100">
            {conversionRate}%
          </span>
          <span className="text-xs text-slate-400">success rate</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <span>Refunded: ${refundedTotal.toFixed(2)}</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span>{insights?.refunded_count ?? 0} refunds</span>
        </div>
      </div>
    </div>
  );
};
