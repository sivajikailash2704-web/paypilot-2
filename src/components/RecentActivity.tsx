import React from 'react';
import { ArrowRight, Clock, CheckCircle2, RotateCcw, AlertCircle, DollarSign, Activity } from 'lucide-react';
import { Transaction, InsightsData } from '../types';

interface RecentActivityProps {
  transactions: Transaction[];
  insights: InsightsData | null;
  onViewAll: () => void;
  onCaptureOrder: (orderId: string) => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  transactions,
  insights,
  onViewAll,
  onCaptureOrder,
}) => {
  const recent = transactions.slice(0, 5);
  const avgValue = transactions.length > 0
    ? (transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length).toFixed(2)
    : '0.00';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recent Activity Stream (2 cols) */}
      <div className="lg:col-span-2 bg-[#111827]/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Latest Activity Stream</h3>
              <p className="text-xs text-slate-400">Most recent payment events and status changes</p>
            </div>
          </div>

          <button
            onClick={onViewAll}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Open Transaction Monitor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/60 mt-2">
          {recent.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No recent activity recorded yet.
            </div>
          ) : (
            recent.map((tx) => (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-800/20 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Status Indicator Icon */}
                  <div className="mt-0.5">
                    {tx.status === 'Completed' && (
                      <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {tx.status === 'Pending' && (
                      <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {tx.status === 'Refunded' && (
                      <div className="w-6 h-6 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {tx.status === 'Failed' && (
                      <div className="w-6 h-6 rounded-md bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-medium text-slate-100 truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{tx.source}</span>
                      <span className="text-slate-600" aria-hidden="true">·</span>
                      <span>{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {tx.order_id && (
                        <>
                          <span className="text-slate-600" aria-hidden="true">·</span>
                          <span className="font-mono text-blue-400 truncate max-w-[90px]">{tx.order_id}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-mono font-semibold text-slate-100 block">
                      ${tx.amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{tx.currency}</span>
                  </div>

                  {tx.status === 'Pending' && tx.order_id && (
                    <button
                      onClick={() => onCaptureOrder(tx.order_id!)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      Capture
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Financial Diagnostics Card (1 col) */}
      <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Financial Performance</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Live</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Average Ticket Size:</span>
              <span className="font-mono font-semibold text-slate-200">${avgValue} USD</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Settlement Rate:</span>
              <span className="font-mono font-semibold text-emerald-400">{insights?.conversion_rate ?? 0}%</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Settled PayPal Orders:</span>
              <span className="font-mono font-semibold text-blue-400">{insights?.sandbox_count ?? 0}</span>
            </div>

            {insights?.largest_pending && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <span className="text-[11px] text-amber-400 font-semibold block">Largest Pending Item:</span>
                <p className="text-xs font-medium mt-0.5 truncate">{insights.largest_pending.description}</p>
                <p className="text-xs font-mono font-bold mt-0.5">${insights.largest_pending.amount.toFixed(2)} {insights.largest_pending.currency}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Continuous sync</span>
          <button
            onClick={onViewAll}
            className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
          >
            Audit full ledger →
          </button>
        </div>
      </div>
    </div>
  );
};
